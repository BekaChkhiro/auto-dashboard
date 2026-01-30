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

  // Get query params
  const { searchParams } = new URL(request.url)
  const stateId = searchParams.get('stateId')
  const type = searchParams.get('type') // "origin" or "destination"

  try {
    // If type is "destination", return all destination ports (Georgian ports)
    if (type === 'destination') {
      const ports = await db.port.findMany({
        where: { isDestination: true },
        orderBy: { name: 'asc' },
        select: {
          id: true,
          name: true,
          state: {
            select: {
              id: true,
              nameEn: true,
              nameKa: true,
              country: {
                select: {
                  id: true,
                  nameEn: true,
                  nameKa: true,
                },
              },
            },
          },
        },
      })

      return withCors({ ports }, origin, 200, {
        ...getRateLimitHeaders(rateLimitResult),
        ...getCacheHeaders(300), // Cache for 5 minutes
      })
    }

    // For origin ports, require stateId
    if (!stateId) {
      return withCors(
        { error: 'Missing required parameter: stateId (or use type=destination)' },
        origin,
        400,
        getRateLimitHeaders(rateLimitResult)
      )
    }

    // Verify state exists
    const state = await db.state.findUnique({
      where: { id: stateId },
      select: { id: true },
    })

    if (!state) {
      return withCors(
        { error: 'State not found' },
        origin,
        404,
        getRateLimitHeaders(rateLimitResult)
      )
    }

    // Return origin ports (non-destination) for the state
    // Only ports that have shipping prices configured
    const ports = await db.port.findMany({
      where: {
        stateId,
        isDestination: false,
        shippingPricesFrom: {
          some: {}, // Has at least one shipping price as origin
        },
      },
      orderBy: { name: 'asc' },
      select: {
        id: true,
        name: true,
      },
    })

    return withCors({ ports }, origin, 200, {
      ...getRateLimitHeaders(rateLimitResult),
      ...getCacheHeaders(300), // Cache for 5 minutes
    })
  } catch (error) {
    console.error('Error fetching ports:', error)
    return withCors(
      { error: 'Failed to fetch ports' },
      origin,
      500,
      getRateLimitHeaders(rateLimitResult)
    )
  }
}
