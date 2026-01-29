import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getPresignedUploadUrl } from "@/lib/r2";
import {
  type PresignedUrlRequest,
  type PresignedUrlResponse,
  isAllowedImageType,
  MAX_FILE_SIZE,
  generateStorageKey,
} from "@/types/upload";

export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = session.user;

    // Parse request body
    const body: PresignedUrlRequest = await request.json();
    const { filename, contentType, size, context } = body;

    // Validate required fields
    if (!filename || !contentType || !size || !context) {
      return NextResponse.json(
        { error: "Missing required fields: filename, contentType, size, context" },
        { status: 400 }
      );
    }

    // Validate content type
    if (!isAllowedImageType(contentType)) {
      return NextResponse.json(
        {
          error: `Invalid file type: ${contentType}. Allowed types: JPEG, PNG, WebP, GIF, HEIC`,
        },
        { status: 400 }
      );
    }

    // Validate file size
    if (size > MAX_FILE_SIZE) {
      const sizeMB = (size / (1024 * 1024)).toFixed(2);
      return NextResponse.json(
        { error: `File size (${sizeMB}MB) exceeds maximum allowed size (10MB)` },
        { status: 400 }
      );
    }

    // Check permissions based on context
    if (context.type === "vehicle") {
      // Verify vehicle exists and user has permission
      const vehicle = await db.vehicle.findUnique({
        where: { id: context.vehicleId },
        select: { id: true, dealerId: true },
      });

      if (!vehicle) {
        return NextResponse.json(
          { error: "Vehicle not found" },
          { status: 404 }
        );
      }

      // Dealers can only upload to their own vehicles
      if (user.role === "DEALER" && vehicle.dealerId !== user.id) {
        return NextResponse.json(
          { error: "You do not have permission to upload photos to this vehicle" },
          { status: 403 }
        );
      }
    }

    if (context.type === "receipt") {
      // Only dealers can upload receipts
      if (user.role !== "DEALER" && user.role !== "ADMIN") {
        return NextResponse.json(
          { error: "Only dealers can upload receipts" },
          { status: 403 }
        );
      }
    }

    // Generate unique storage key
    const key = generateStorageKey(context, filename);

    // Generate presigned URL (expires in 1 hour)
    const { url, expiresAt } = await getPresignedUploadUrl(key, contentType, 3600);

    const response: PresignedUrlResponse = {
      uploadUrl: url,
      key,
      expiresAt: expiresAt.toISOString(),
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error generating presigned URL:", error);
    return NextResponse.json(
      { error: "Failed to generate upload URL" },
      { status: 500 }
    );
  }
}
