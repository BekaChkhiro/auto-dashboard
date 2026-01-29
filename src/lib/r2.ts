import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
  GetObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

// Singleton pattern matching db.ts
const globalForR2 = globalThis as unknown as {
  r2Client: S3Client | undefined;
};

function createR2Client(): S3Client {
  const accountId = process.env.R2_ACCOUNT_ID;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;

  if (!accountId || !accessKeyId || !secretAccessKey) {
    throw new Error(
      "R2 environment variables are not set (R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY)"
    );
  }

  return new S3Client({
    region: "auto",
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
  });
}

export const r2Client = globalForR2.r2Client ?? createR2Client();

if (process.env.NODE_ENV !== "production") {
  globalForR2.r2Client = r2Client;
}

// Get the bucket name from environment
function getBucketName(): string {
  const bucket = process.env.R2_BUCKET_NAME;
  if (!bucket) {
    throw new Error("R2_BUCKET_NAME environment variable is not set");
  }
  return bucket;
}

// Get the public domain for R2 bucket
function getPublicDomain(): string {
  const domain = process.env.R2_PUBLIC_DOMAIN;
  if (!domain) {
    throw new Error("R2_PUBLIC_DOMAIN environment variable is not set");
  }
  return domain;
}

/**
 * Generate a presigned URL for uploading a file to R2
 * URL expires in 1 hour by default
 */
export async function getPresignedUploadUrl(
  key: string,
  contentType: string,
  expiresIn: number = 3600
): Promise<{ url: string; expiresAt: Date }> {
  const bucket = getBucketName();

  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    ContentType: contentType,
  });

  const url = await getSignedUrl(r2Client, command, { expiresIn });
  const expiresAt = new Date(Date.now() + expiresIn * 1000);

  return { url, expiresAt };
}

/**
 * Generate a presigned URL for downloading/reading a file from R2
 */
export async function getPresignedDownloadUrl(
  key: string,
  expiresIn: number = 3600
): Promise<string> {
  const bucket = getBucketName();

  const command = new GetObjectCommand({
    Bucket: bucket,
    Key: key,
  });

  return getSignedUrl(r2Client, command, { expiresIn });
}

/**
 * Check if an object exists in R2
 */
export async function objectExists(key: string): Promise<boolean> {
  const bucket = getBucketName();

  try {
    await r2Client.send(
      new HeadObjectCommand({
        Bucket: bucket,
        Key: key,
      })
    );
    return true;
  } catch {
    return false;
  }
}

/**
 * Get object metadata from R2
 */
export async function getObjectMetadata(key: string): Promise<{
  contentType?: string;
  contentLength?: number;
  lastModified?: Date;
} | null> {
  const bucket = getBucketName();

  try {
    const response = await r2Client.send(
      new HeadObjectCommand({
        Bucket: bucket,
        Key: key,
      })
    );

    return {
      contentType: response.ContentType,
      contentLength: response.ContentLength,
      lastModified: response.LastModified,
    };
  } catch {
    return null;
  }
}

/**
 * Get file content from R2 as a buffer
 */
export async function getObject(key: string): Promise<Buffer | null> {
  const bucket = getBucketName();

  try {
    const response = await r2Client.send(
      new GetObjectCommand({
        Bucket: bucket,
        Key: key,
      })
    );

    if (!response.Body) {
      return null;
    }

    // Convert stream to buffer
    const chunks: Uint8Array[] = [];
    const stream = response.Body as AsyncIterable<Uint8Array>;
    for await (const chunk of stream) {
      chunks.push(chunk);
    }
    return Buffer.concat(chunks);
  } catch {
    return null;
  }
}

/**
 * Upload a buffer directly to R2
 */
export async function uploadObject(
  key: string,
  body: Buffer,
  contentType: string
): Promise<void> {
  const bucket = getBucketName();

  await r2Client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: body,
      ContentType: contentType,
    })
  );
}

/**
 * Delete an object from R2
 */
export async function deleteObject(key: string): Promise<void> {
  const bucket = getBucketName();

  await r2Client.send(
    new DeleteObjectCommand({
      Bucket: bucket,
      Key: key,
    })
  );
}

/**
 * Delete multiple objects from R2
 */
export async function deleteObjects(keys: string[]): Promise<void> {
  // Delete in parallel
  await Promise.all(keys.map((key) => deleteObject(key)));
}

/**
 * Get the public URL for an object
 * Uses the configured public domain
 */
export function getPublicUrl(key: string): string {
  const domain = getPublicDomain();
  // Ensure no double slashes
  const cleanKey = key.startsWith("/") ? key.slice(1) : key;
  return `https://${domain}/${cleanKey}`;
}

/**
 * Extract the storage key from a public URL
 */
export function getKeyFromUrl(url: string): string | null {
  const domain = getPublicDomain();

  try {
    const urlObj = new URL(url);
    if (urlObj.hostname === domain) {
      return urlObj.pathname.slice(1); // Remove leading slash
    }
    return null;
  } catch {
    return null;
  }
}

export default r2Client;
