import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { objectExists } from "@/lib/r2";
import { processUploadedImage } from "@/lib/image-optimization";
import type { ConfirmUploadRequest, ConfirmUploadResponse } from "@/types/upload";

export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = session.user;

    // Parse request body
    const body: ConfirmUploadRequest = await request.json();
    const { key, context } = body;

    // Validate required fields
    if (!key || !context) {
      return NextResponse.json(
        { error: "Missing required fields: key, context" },
        { status: 400 }
      );
    }

    // Verify file exists in R2
    const exists = await objectExists(key);
    if (!exists) {
      return NextResponse.json(
        { error: "File not found in storage. Upload may have failed or expired." },
        { status: 404 }
      );
    }

    // Process based on context type
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

      // Process image: optimize and create variants
      const result = await processUploadedImage(key, {
        deleteOriginal: true,
        quality: 85,
      });

      if (!result.success || !result.variants) {
        return NextResponse.json(
          { error: result.error || "Failed to process image" },
          { status: 500 }
        );
      }

      // Get the highest order for this stage
      const lastPhoto = await db.vehiclePhoto.findFirst({
        where: {
          vehicleId: context.vehicleId,
          stage: context.stage,
        },
        orderBy: { order: "desc" },
        select: { order: true },
      });

      const newOrder = (lastPhoto?.order ?? -1) + 1;

      // Create VehiclePhoto record with the medium variant as the main URL
      const photo = await db.vehiclePhoto.create({
        data: {
          vehicleId: context.vehicleId,
          stage: context.stage,
          url: result.variants.md, // Use medium as main URL
          order: newOrder,
        },
      });

      const response: ConfirmUploadResponse = {
        id: photo.id,
        url: result.variants.md,
        variants: result.variants,
      };

      return NextResponse.json(response);
    }

    if (context.type === "receipt") {
      // Only dealers can upload receipts
      if (user.role !== "DEALER" && user.role !== "ADMIN") {
        return NextResponse.json(
          { error: "Only dealers can upload receipts" },
          { status: 403 }
        );
      }

      // Process image: optimize and create variants
      const result = await processUploadedImage(key, {
        deleteOriginal: true,
        quality: 90, // Higher quality for receipts
      });

      if (!result.success || !result.variants) {
        return NextResponse.json(
          { error: result.error || "Failed to process image" },
          { status: 500 }
        );
      }

      // For receipts, we don't create a database record here
      // The URL will be stored when creating/updating the BalanceRequest
      const response: ConfirmUploadResponse = {
        id: key, // Use key as ID for receipts
        url: result.variants.lg, // Use large for receipts (better quality for reading)
        variants: result.variants,
      };

      return NextResponse.json(response);
    }

    return NextResponse.json(
      { error: "Invalid context type" },
      { status: 400 }
    );
  } catch (error) {
    console.error("Error confirming upload:", error);
    return NextResponse.json(
      { error: "Failed to confirm upload" },
      { status: 500 }
    );
  }
}
