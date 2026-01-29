"use client";

import { useCallback, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Upload, X, CheckCircle, AlertCircle, Loader2, ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useFileUpload } from "@/hooks/use-file-upload";
import type { UploadContext, FileUploadState, UploadResult } from "@/types/upload";

interface FileUploaderProps {
  context: UploadContext;
  maxFiles?: number;
  onUploadComplete?: (result: UploadResult) => void;
  onError?: (error: string) => void;
  className?: string;
  disabled?: boolean;
}

export function FileUploader({
  context,
  maxFiles = 10,
  onUploadComplete,
  onError,
  className,
  disabled = false,
}: FileUploaderProps) {
  const t = useTranslations("upload");
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { files, isUploading, upload, remove, cancel, clear } = useFileUpload({
    context,
    maxFiles,
    onUploadComplete,
    onError,
  });

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) {
      setIsDragOver(true);
    }
  }, [disabled]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragOver(false);

      if (disabled) return;

      const droppedFiles = Array.from(e.dataTransfer.files).filter((file) =>
        file.type.startsWith("image/")
      );

      if (droppedFiles.length > 0) {
        await upload(droppedFiles);
      }
    },
    [disabled, upload]
  );

  const handleFileSelect = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const selectedFiles = e.target.files;
      if (!selectedFiles || selectedFiles.length === 0) return;

      await upload(Array.from(selectedFiles));

      // Reset input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    },
    [upload]
  );

  const openFilePicker = useCallback(() => {
    if (!disabled) {
      fileInputRef.current?.click();
    }
  }, [disabled]);

  const getStatusIcon = (status: FileUploadState["status"]) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "error":
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case "uploading":
      case "processing":
        return <Loader2 className="h-4 w-4 animate-spin text-blue-500" />;
      default:
        return <ImageIcon className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getStatusText = (file: FileUploadState): string => {
    switch (file.status) {
      case "pending":
        return t("statusPending");
      case "uploading":
        return `${t("statusUploading")} ${file.progress}%`;
      case "processing":
        return t("statusProcessing");
      case "completed":
        return t("statusCompleted");
      case "error":
        return file.error || t("statusError");
      default:
        return "";
    }
  };

  return (
    <div className={cn("space-y-4", className)}>
      {/* Drop Zone */}
      <div
        className={cn(
          "relative flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 transition-colors",
          isDragOver
            ? "border-primary bg-primary/5"
            : "border-muted-foreground/25 hover:border-muted-foreground/50",
          disabled && "cursor-not-allowed opacity-50"
        )}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleFileSelect}
          className="hidden"
          disabled={disabled}
        />

        <Upload className="mb-4 h-10 w-10 text-muted-foreground" />
        <p className="mb-2 text-sm font-medium">{t("dragAndDrop")}</p>
        <p className="mb-4 text-xs text-muted-foreground">{t("orClickToSelect")}</p>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={openFilePicker}
          disabled={disabled || isUploading}
        >
          {t("selectFiles")}
        </Button>
        <p className="mt-4 text-xs text-muted-foreground">
          {t("allowedFormats")}
        </p>
      </div>

      {/* File List */}
      {files.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium">
              {t("uploadedFiles")} ({files.length})
            </h4>
            {files.some((f) => f.status === "completed" || f.status === "error") && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={clear}
                className="h-auto p-1 text-xs"
              >
                {t("clearAll")}
              </Button>
            )}
          </div>

          <div className="space-y-2">
            {files.map((file) => (
              <div
                key={file.id}
                className="flex items-center gap-3 rounded-lg border bg-card p-3"
              >
                {/* Preview */}
                <div className="relative h-12 w-12 flex-shrink-0 overflow-hidden rounded bg-muted">
                  {file.url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={file.variants?.thumb || file.url}
                      alt={file.file.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center">
                      <ImageIcon className="h-6 w-6 text-muted-foreground" />
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{file.file.name}</p>
                  <div className="flex items-center gap-2">
                    {getStatusIcon(file.status)}
                    <span
                      className={cn(
                        "text-xs",
                        file.status === "error"
                          ? "text-red-500"
                          : "text-muted-foreground"
                      )}
                    >
                      {getStatusText(file)}
                    </span>
                  </div>

                  {/* Progress Bar */}
                  {(file.status === "uploading" || file.status === "processing") && (
                    <Progress value={file.progress} className="mt-2 h-1" />
                  )}
                </div>

                {/* Actions */}
                <div className="flex-shrink-0">
                  {file.status === "uploading" ? (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => cancel(file.id)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  ) : file.status !== "processing" ? (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => remove(file.id)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
