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

  try {
    const countries = await db.country.findMany({
      orderBy: { nameEn: "asc" },
      select: {
        id: true,
        code: true,
        nameEn: true,
        nameKa: true,
      },
    });

    return withCors(
      { countries },
      origin,
      200,
      getRateLimitHeaders(rateLimitResult)
    );
  } catch (error) {
    console.error("Error fetching countries:", error);
    return withCors(
      { error: "Failed to fetch countries" },
      origin,
      500,
      getRateLimitHeaders(rateLimitResult)
    );
  }
}
