import { NextRequest } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { handleCorsPreflightRequest, withCors } from "@/lib/cors";
import { rateLimit, getRateLimitHeaders } from "@/lib/rate-limit";

// Rate limit: 50 requests per minute (stricter for calculate endpoint)
const RATE_LIMIT_CONFIG = { limit: 50, windowSeconds: 60 };

function getClientIp(request: NextRequest): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "anonymous"
  );
}

// Request validation schema
const calculateRequestSchema = z.object({
  cityId: z.string().min(1, "City ID is required"),
  originPortId: z.string().min(1, "Origin port ID is required"),
  destinationPortId: z.string().min(1, "Destination port ID is required"),
  vehicleValue: z.number().positive("Vehicle value must be positive"),
});

export type CalculateRequest = z.infer<typeof calculateRequestSchema>;

export interface CalculateResponse {
  breakdown: {
    towingPrice: number;
    shippingPrice: number;
    insurancePrice: number;
    basePrice: number;
  };
  total: number;
  currency: "USD";
}

export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get("origin");
  return handleCorsPreflightRequest(origin);
}

export async function POST(request: NextRequest) {
  const origin = request.headers.get("origin");
  const clientIp = getClientIp(request);

  // Check rate limit
  const rateLimitResult = rateLimit(clientIp, RATE_LIMIT_CONFIG);
  if (!rateLimitResult.success) {
    return withCors(
      { error: "Too many requests. Please try again later." },
      origin,
      429,
      getRateLimitHeaders(rateLimitResult)
    );
  }

  try {
    // Parse and validate request body
    const body = await request.json();
    const validation = calculateRequestSchema.safeParse(body);

    if (!validation.success) {
      return withCors(
        {
          error: "Validation failed",
          details: validation.error.issues.map((i) => ({
            field: i.path.join("."),
            message: i.message,
          })),
        },
        origin,
        400,
        getRateLimitHeaders(rateLimitResult)
      );
    }

    const { cityId, originPortId, destinationPortId, vehicleValue } =
      validation.data;

    // Fetch all required data in parallel
    const [towingPrice, shippingPrice, insurancePrice, baseTransportSetting] =
      await Promise.all([
        // Get towing price (city to origin port)
        db.towingPrice.findFirst({
          where: {
            cityId,
            portId: originPortId,
          },
          select: { price: true },
        }),

        // Get shipping price (origin port to destination port)
        db.shippingPrice.findFirst({
          where: {
            originPortId,
            destinationPortId,
          },
          select: { price: true },
        }),

        // Get insurance price for vehicle value
        db.insurancePrice.findFirst({
          where: {
            minValue: { lte: vehicleValue },
            maxValue: { gte: vehicleValue },
          },
          select: { price: true },
        }),

        // Get base transportation price
        db.systemSettings.findUnique({
          where: { key: "BASE_TRANSPORTATION_PRICE" },
          select: { value: true },
        }),
      ]);

    // Validate all prices were found
    const errors: string[] = [];

    if (!towingPrice) {
      errors.push("No towing price configured for the selected city and port combination");
    }

    if (!shippingPrice) {
      errors.push("No shipping price configured for the selected port route");
    }

    if (!insurancePrice) {
      errors.push(
        `No insurance price configured for vehicle value $${vehicleValue.toLocaleString()}`
      );
    }

    if (errors.length > 0) {
      return withCors(
        {
          error: "Price calculation not available",
          details: errors,
        },
        origin,
        422,
        getRateLimitHeaders(rateLimitResult)
      );
    }

    // Calculate totals
    const towing = Number(towingPrice!.price);
    const shipping = Number(shippingPrice!.price);
    const insurance = Number(insurancePrice!.price);
    const basePrice = baseTransportSetting
      ? parseFloat(baseTransportSetting.value)
      : 0;

    const total = towing + shipping + insurance + basePrice;

    const response: CalculateResponse = {
      breakdown: {
        towingPrice: towing,
        shippingPrice: shipping,
        insurancePrice: insurance,
        basePrice,
      },
      total,
      currency: "USD",
    };

    return withCors(response, origin, 200, getRateLimitHeaders(rateLimitResult));
  } catch (error) {
    console.error("Error calculating price:", error);

    // Check for JSON parsing error
    if (error instanceof SyntaxError) {
      return withCors(
        { error: "Invalid JSON in request body" },
        origin,
        400,
        getRateLimitHeaders(rateLimitResult)
      );
    }

    return withCors(
      { error: "Failed to calculate price" },
      origin,
      500,
      getRateLimitHeaders(rateLimitResult)
    );
  }
}
