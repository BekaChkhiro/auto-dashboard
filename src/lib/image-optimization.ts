import sharp from "sharp";
import {
  IMAGE_VARIANTS,
  type ImageVariant,
} from "@/types/upload";
import {
  getObject,
  uploadObject,
  deleteObject,
  getPublicUrl,
} from "./r2";

// WebP quality setting for optimized images
const WEBP_QUALITY = 85;

// Options for Sharp processing
interface OptimizeOptions {
  /** Quality for WebP output (1-100) */
  quality?: number;
  /** Whether to preserve aspect ratio */
  preserveAspectRatio?: boolean;
}

/**
 * Resize and convert an image buffer to WebP format
 */
export async function resizeAndConvertToWebP(
  input: Buffer,
  width: number,
  options: OptimizeOptions = {}
): Promise<Buffer> {
  const { quality = WEBP_QUALITY, preserveAspectRatio = true } = options;

  let pipeline = sharp(input);

  // Resize with aspect ratio preservation
  pipeline = pipeline.resize({
    width,
    withoutEnlargement: true,
    fit: preserveAspectRatio ? "inside" : "cover",
  });

  // Convert to WebP
  pipeline = pipeline.webp({ quality });

  return pipeline.toBuffer();
}

/**
 * Generate all size variants for an image
 */
export async function generateImageVariants(
  input: Buffer,
  options: OptimizeOptions = {}
): Promise<Record<ImageVariant, Buffer>> {
  const variants = await Promise.all(
    Object.entries(IMAGE_VARIANTS).map(async ([variant, width]) => {
      const buffer = await resizeAndConvertToWebP(input, width, options);
      return [variant as ImageVariant, buffer] as const;
    })
  );

  return Object.fromEntries(variants) as Record<ImageVariant, Buffer>;
}

/**
 * Get image metadata from a buffer
 */
export async function getImageMetadata(input: Buffer): Promise<{
  width?: number;
  height?: number;
  format?: string;
  size: number;
}> {
  const metadata = await sharp(input).metadata();

  return {
    width: metadata.width,
    height: metadata.height,
    format: metadata.format,
    size: input.length,
  };
}

/**
 * Replace the file extension with .webp
 */
function replaceExtensionWithWebP(key: string): string {
  return key.replace(/\.[^.]+$/, ".webp");
}

/**
 * Generate variant key from original key
 * e.g., "vehicles/123/auction/file.jpg" -> "vehicles/123/auction/file-thumb.webp"
 */
function getVariantKey(originalKey: string, variant: ImageVariant): string {
  const webpKey = replaceExtensionWithWebP(originalKey);
  const parts = webpKey.split(".");
  const extension = parts.pop();
  return `${parts.join(".")}-${variant}.${extension}`;
}

/**
 * Process an uploaded image: fetch from R2, optimize, upload variants, delete original
 */
export async function processUploadedImage(
  originalKey: string,
  options: {
    deleteOriginal?: boolean;
    quality?: number;
  } = {}
): Promise<{
  success: boolean;
  variants?: Record<ImageVariant, string>;
  error?: string;
}> {
  const { deleteOriginal = true, quality = WEBP_QUALITY } = options;

  try {
    // Fetch original image from R2
    const originalBuffer = await getObject(originalKey);

    if (!originalBuffer) {
      return {
        success: false,
        error: "Original image not found in storage",
      };
    }

    // Generate all variants
    const variantBuffers = await generateImageVariants(originalBuffer, {
      quality,
    });

    // Upload all variants to R2
    const variantUrls: Record<ImageVariant, string> = {} as Record<
      ImageVariant,
      string
    >;

    await Promise.all(
      Object.entries(variantBuffers).map(async ([variant, buffer]) => {
        const variantKey = getVariantKey(originalKey, variant as ImageVariant);
        await uploadObject(variantKey, buffer, "image/webp");
        variantUrls[variant as ImageVariant] = getPublicUrl(variantKey);
      })
    );

    // Delete original if requested
    if (deleteOriginal) {
      await deleteObject(originalKey);
    }

    return {
      success: true,
      variants: variantUrls,
    };
  } catch (error) {
    console.error("Error processing image:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to process image",
    };
  }
}

/**
 * Delete all variants of an image
 */
export async function deleteImageVariants(
  baseKey: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const variantKeys = Object.keys(IMAGE_VARIANTS).map((variant) =>
      getVariantKey(baseKey, variant as ImageVariant)
    );

    await Promise.all(variantKeys.map((key) => deleteObject(key)));

    return { success: true };
  } catch (error) {
    console.error("Error deleting image variants:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to delete image variants",
    };
  }
}

/**
 * Get URLs for all variants of an image
 */
export function getVariantUrls(
  baseKey: string
): Record<ImageVariant, string> {
  const urls: Record<ImageVariant, string> = {} as Record<ImageVariant, string>;

  for (const variant of Object.keys(IMAGE_VARIANTS)) {
    const variantKey = getVariantKey(baseKey, variant as ImageVariant);
    urls[variant as ImageVariant] = getPublicUrl(variantKey);
  }

  return urls;
}

/**
 * Get the URL for a specific variant
 */
export function getVariantUrl(baseKey: string, variant: ImageVariant): string {
  const variantKey = getVariantKey(baseKey, variant);
  return getPublicUrl(variantKey);
}
