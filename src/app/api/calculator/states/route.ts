import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { handleCorsPreflightRequest, withCors, getCacheHeaders } from '@/lib/cors'
import { rateLimit, getRateLimitHeaders } from '@/lib/rate-limit'

// Rate limit: 100 requests per minute
const RATE_LIMIT_CONFIG = { limit: 100, windowSeconds: 60 }

function getClientIp(request: NextRequest): string {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    'anonymous'
  )
}

export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get('origin')
  return handleCorsPreflightRequest(origin)
}

export async function GET(request: NextRequest) {
  const origin = request.headers.get('origin')
  const clientIp = getClientIp(request)

  // Check rate limit
  const rateLimitResult = rateLimit(clientIp, RATE_LIMIT_CONFIG)
  if (!rateLimitResult.success) {
    return withCors(
      { error: 'Too many requests. Please try again later.' },
      origin,
      429,
      getRateLimitHeaders(rateLimitResult)
    )
  }

  // Get countryId from query params
  const { searchParams } = new URL(request.url)
  const countryId = searchParams.get('countryId')

  if (!countryId) {
    return withCors(
      { error: 'Missing required parameter: countryId' },
      origin,
      400,
      getRateLimitHeaders(rateLimitResult)
    )
  }

  try {
    // Verify country exists
    const country = await db.country.findUnique({
      where: { id: countryId },
      select: { id: true },
    })

    if (!country) {
      return withCors(
        { error: 'Country not found' },
        origin,
        404,
        getRateLimitHeaders(rateLimitResult)
      )
    }

    const states = await db.state.findMany({
      where: { countryId },
      orderBy: { nameEn: 'asc' },
      select: {
        id: true,
        code: true,
        nameEn: true,
        nameKa: true,
      },
    })

    return withCors({ states }, origin, 200, {
      ...getRateLimitHeaders(rateLimitResult),
      ...getCacheHeaders(300), // Cache for 5 minutes
    })
  } catch (error) {
    console.error('Error fetching states:', error)
    return withCors(
      { error: 'Failed to fetch states' },
      origin,
      500,
      getRateLimitHeaders(rateLimitResult)
    )
  }
}
