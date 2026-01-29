import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { handleCorsPreflightRequest, withCors } from "@/lib/cors";
import { rateLimit, getRateLimitHeaders } from "@/lib/rate-limit";

// Rate limit: 100 requests per minute
const RATE_LIMIT_CONFIG = { limit: 100, windowSeconds: 60 };

function getClientIp(request: NextRequest): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "anonymous"
  );
}

export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get("origin");
  return handleCorsPreflightRequest(origin);
}

export async function GET(request: NextRequest) {
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

  // Get stateId from query params
  const { searchParams } = new URL(request.url);
  const stateId = searchParams.get("stateId");

  if (!stateId) {
    return withCors(
      { error: "Missing required parameter: stateId" },
      origin,
      400,
      getRateLimitHeaders(rateLimitResult)
    );
  }

  try {
    // Verify state exists
    const state = await db.state.findUnique({
      where: { id: stateId },
      select: { id: true },
    });

    if (!state) {
      return withCors(
        { error: "State not found" },
        origin,
        404,
        getRateLimitHeaders(rateLimitResult)
      );
    }

    // Only return cities that have towing prices configured
    const cities = await db.city.findMany({
      where: {
        stateId,
        towingPrices: {
          some: {}, // Has at least one towing price
        },
      },
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
      },
    });

    return withCors(
      { cities },
      origin,
      200,
      getRateLimitHeaders(rateLimitResult)
    );
  } catch (error) {
    console.error("Error fetching cities:", error);
    return withCors(
      { error: "Failed to fetch cities" },
      origin,
      500,
      getRateLimitHeaders(rateLimitResult)
    );
  }
}
