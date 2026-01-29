"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import {
  type FileUploadState,
  type UploadContext,
  type PresignedUrlResponse,
  type ConfirmUploadResponse,
  type UploadResult,
  type UseFileUploadOptions,
  validateFile,
} from "@/types/upload";

interface UseFileUploadReturn {
  files: FileUploadState[];
  isUploading: boolean;
  upload: (files: File[]) => Promise<UploadResult[]>;
  remove: (id: string) => void;
  cancel: (id: string) => void;
  clear: () => void;
}

export function useFileUpload(options: UseFileUploadOptions): UseFileUploadReturn {
  const { context, maxFiles = 10, onUploadComplete, onError } = options;

  const [files, setFiles] = useState<FileUploadState[]>([]);
  const xhrRef = useRef<Map<string, XMLHttpRequest>>(new Map());

  // Store context and callbacks in refs to avoid dependency issues
  const contextRef = useRef(context);
  const onUploadCompleteRef = useRef(onUploadComplete);
  const onErrorRef = useRef(onError);

  useEffect(() => {
    contextRef.current = context;
    onUploadCompleteRef.current = onUploadComplete;
    onErrorRef.current = onError;
  }, [context, onUploadComplete, onError]);

  const isUploading = files.some(
    (f) => f.status === "uploading" || f.status === "processing"
  );

  // Generate unique ID for each file
  const generateId = () => `${Date.now()}-${Math.random().toString(36).slice(2)}`;

  // Update a specific file's state
  const updateFile = useCallback(
    (id: string, updates: Partial<FileUploadState>) => {
      setFiles((prev) =>
        prev.map((f) => (f.id === id ? { ...f, ...updates } : f))
      );
    },
    []
  );

  // Get presigned URL from API
  const getPresignedUrl = async (
    file: File,
    ctx: UploadContext
  ): Promise<PresignedUrlResponse> => {
    const response = await fetch("/api/upload/presigned", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        filename: file.name,
        contentType: file.type,
        size: file.size,
        context: ctx,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to get upload URL");
    }

    return response.json();
  };

  // Upload file to R2 using presigned URL with progress tracking
  const uploadToR2 = (
    file: File,
    uploadUrl: string,
    onProgress: (progress: number) => void
  ): Promise<void> => {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();

      xhr.upload.addEventListener("progress", (e) => {
        if (e.lengthComputable) {
          const progress = Math.round((e.loaded / e.total) * 100);
          onProgress(progress);
        }
      });

      xhr.addEventListener("load", () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve();
        } else {
          reject(new Error(`Upload failed with status ${xhr.status}`));
        }
      });

      xhr.addEventListener("error", () => {
        reject(new Error("Upload failed"));
      });

      xhr.addEventListener("abort", () => {
        reject(new Error("Upload cancelled"));
      });

      xhr.open("PUT", uploadUrl);
      xhr.setRequestHeader("Content-Type", file.type);
      xhr.send(file);

      // Store XHR for potential cancellation
      const fileId = file.name + file.size;
      xhrRef.current.set(fileId, xhr);
    });
  };

  // Confirm upload and process image
  const confirmUpload = async (
    key: string,
    ctx: UploadContext
  ): Promise<ConfirmUploadResponse> => {
    const response = await fetch("/api/upload/confirm", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key, context: ctx }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to confirm upload");
    }

    return response.json();
  };

  // Upload multiple files
  const upload = useCallback(
    async (newFiles: File[]): Promise<UploadResult[]> => {
      const currentContext = contextRef.current;

      // Limit number of files
      const filesToUpload = newFiles.slice(0, maxFiles);

      // Create file states
      const newFileStates: FileUploadState[] = filesToUpload.map((file) => ({
        id: generateId(),
        file,
        status: "pending" as const,
        progress: 0,
      }));

      // Add to state
      setFiles((prev) => [...prev, ...newFileStates]);

      // Upload a single file
      const uploadSingleFile = async (
        fileState: FileUploadState
      ): Promise<UploadResult> => {
        const { id, file } = fileState;

        try {
          // Validate file
          const validation = validateFile(file);
          if (!validation.valid) {
            updateFile(id, { status: "error", error: validation.error });
            return { success: false, error: validation.error };
          }

          // Get presigned URL
          updateFile(id, { status: "uploading", progress: 0 });
          const { uploadUrl, key } = await getPresignedUrl(file, currentContext);

          // Upload to R2 with progress tracking
          await uploadToR2(file, uploadUrl, (progress) => {
            updateFile(id, { progress });
          });

          // Confirm and process
          updateFile(id, { status: "processing", progress: 100 });
          const result = await confirmUpload(key, currentContext);

          // Success
          updateFile(id, {
            status: "completed",
            url: result.url,
            variants: result.variants,
          });

          const uploadResult: UploadResult = {
            success: true,
            id: result.id,
            url: result.url,
            variants: result.variants,
          };

          onUploadCompleteRef.current?.(uploadResult);
          return uploadResult;
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : "Upload failed";
          updateFile(id, { status: "error", error: errorMessage });
          onErrorRef.current?.(errorMessage);
          return { success: false, error: errorMessage };
        }
      };

      // Upload all files in parallel
      const results = await Promise.all(
        newFileStates.map((fileState) => uploadSingleFile(fileState))
      );

      return results;
    },
    [maxFiles, updateFile]
  );

  // Remove a file from the list
  const remove = useCallback((id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
  }, []);

  // Cancel an ongoing upload
  const cancel = useCallback((id: string) => {
    setFiles((prev) => {
      const file = prev.find((f) => f.id === id);
      if (file && file.status === "uploading") {
        const xhrKey = file.file.name + file.file.size;
        const xhr = xhrRef.current.get(xhrKey);
        if (xhr) {
          xhr.abort();
          xhrRef.current.delete(xhrKey);
        }
        return prev.map((f) =>
          f.id === id ? { ...f, status: "error" as const, error: "Upload cancelled" } : f
        );
      }
      return prev;
    });
  }, []);

  // Clear all files
  const clear = useCallback(() => {
    // Cancel any ongoing uploads
    xhrRef.current.forEach((xhr) => xhr.abort());
    xhrRef.current.clear();
    setFiles([]);
  }, []);

  return {
    files,
    isUploading,
    upload,
    remove,
    cancel,
    clear,
  };
}
