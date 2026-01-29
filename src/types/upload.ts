import type { PhotoStage } from "@/generated/prisma";

// Allowed MIME types for image uploads
export const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/heic",
  "image/heif",
] as const;

export type AllowedImageType = (typeof ALLOWED_IMAGE_TYPES)[number];

// Maximum file size: 10MB
export const MAX_FILE_SIZE = 10 * 1024 * 1024;

// Image variant sizes for optimization
export const IMAGE_VARIANTS = {
  thumb: 150,
  sm: 400,
  md: 800,
  lg: 1200,
} as const;

export type ImageVariant = keyof typeof IMAGE_VARIANTS;

// Upload context types
export type UploadContext =
  | { type: "vehicle"; vehicleId: string; stage: PhotoStage }
  | { type: "receipt"; balanceRequestId?: string };

// Upload status states
export type UploadStatus =
  | "pending"
  | "uploading"
  | "processing"
  | "completed"
  | "error";

// File upload state for tracking individual files
export interface FileUploadState {
  id: string;
  file: File;
  status: UploadStatus;
  progress: number;
  error?: string;
  url?: string;
  variants?: Record<ImageVariant, string>;
}

// Request types for presigned URL endpoint
export interface PresignedUrlRequest {
  filename: string;
  contentType: string;
  size: number;
  context: UploadContext;
}

// Response from presigned URL endpoint
export interface PresignedUrlResponse {
  uploadUrl: string;
  key: string;
  expiresAt: string;
}

// Request types for confirm endpoint
export interface ConfirmUploadRequest {
  key: string;
  context: UploadContext;
}

// Response from confirm endpoint
export interface ConfirmUploadResponse {
  id: string;
  url: string;
  variants: Record<ImageVariant, string>;
}

// Upload result returned by the hook
export interface UploadResult {
  success: boolean;
  id?: string;
  url?: string;
  variants?: Record<ImageVariant, string>;
  error?: string;
}

// Hook options
export interface UseFileUploadOptions {
  context: UploadContext;
  maxFiles?: number;
  onUploadComplete?: (result: UploadResult) => void;
  onError?: (error: string) => void;
}

// Utility function to check if a MIME type is allowed
export function isAllowedImageType(
  mimeType: string
): mimeType is AllowedImageType {
  return ALLOWED_IMAGE_TYPES.includes(mimeType as AllowedImageType);
}

// Utility function to validate file for upload
export function validateFile(file: File): { valid: boolean; error?: string } {
  if (!isAllowedImageType(file.type)) {
    return {
      valid: false,
      error: `File type ${file.type} is not allowed. Allowed types: JPEG, PNG, WebP, GIF, HEIC`,
    };
  }

  if (file.size > MAX_FILE_SIZE) {
    const sizeMB = (file.size / (1024 * 1024)).toFixed(2);
    return {
      valid: false,
      error: `File size (${sizeMB}MB) exceeds maximum allowed size (10MB)`,
    };
  }

  return { valid: true };
}

// Generate a unique storage key for uploads
export function generateStorageKey(
  context: UploadContext,
  filename: string
): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  const sanitizedFilename = filename
    .replace(/[^a-zA-Z0-9.-]/g, "_")
    .toLowerCase();
  const extension = sanitizedFilename.split(".").pop() || "jpg";

  if (context.type === "vehicle") {
    return `vehicles/${context.vehicleId}/${context.stage.toLowerCase()}/${timestamp}-${random}.${extension}`;
  }

  if (context.type === "receipt") {
    const prefix = context.balanceRequestId
      ? `receipts/${context.balanceRequestId}`
      : "receipts/pending";
    return `${prefix}/${timestamp}-${random}.${extension}`;
  }

  return `uploads/${timestamp}-${random}.${extension}`;
}
