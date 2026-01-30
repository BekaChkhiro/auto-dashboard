import { NextResponse } from 'next/server'

/**
 * CORS configuration for calculator API
 * Allows external domains to access the calculator endpoints
 */

// Allowed origins for calculator API
// In production, this should be configured via environment variable
const ALLOWED_ORIGINS = process.env.CALCULATOR_ALLOWED_ORIGINS
  ? process.env.CALCULATOR_ALLOWED_ORIGINS.split(',').map((o) => o.trim())
  : ['*'] // Default to all origins in development

/**
 * Check if origin is allowed
 */
function isOriginAllowed(origin: string | null): boolean {
  if (!origin) return true // Allow requests without origin (e.g., server-to-server)
  if (ALLOWED_ORIGINS.includes('*')) return true
  return ALLOWED_ORIGINS.includes(origin)
}

/**
 * Get cache headers for static data (locations, makes, etc.)
 * Cache for 5 minutes, allow stale for 1 hour while revalidating
 */
export function getCacheHeaders(maxAge: number = 300): HeadersInit {
  return {
    'Cache-Control': `public, s-maxage=${maxAge}, stale-while-revalidate=${maxAge * 12}`,
  }
}

/**
 * Get CORS headers for a request
 */
export function getCorsHeaders(origin: string | null): HeadersInit {
  const allowedOrigin = isOriginAllowed(origin) ? origin || '*' : ALLOWED_ORIGINS[0] || '*'

  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400', // 24 hours
  }
}

/**
 * Handle CORS preflight request
 */
export function handleCorsPreflightRequest(origin: string | null): NextResponse {
  if (!isOriginAllowed(origin)) {
    return new NextResponse(null, { status: 403 })
  }

  return new NextResponse(null, {
    status: 204,
    headers: getCorsHeaders(origin),
  })
}

/**
 * Add CORS headers to a response
 */
export function withCors<T>(
  data: T,
  origin: string | null,
  status: number = 200,
  additionalHeaders?: HeadersInit
): NextResponse {
  return NextResponse.json(data, {
    status,
    headers: {
      ...getCorsHeaders(origin),
      ...additionalHeaders,
    },
  })
}
