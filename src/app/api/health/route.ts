import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'
export const revalidate = 0

interface HealthStatus {
  status: 'healthy' | 'unhealthy'
  timestamp: string
  version: string
  checks: {
    database: {
      status: 'connected' | 'disconnected'
      latency?: number
    }
  }
}

export async function GET() {
  const startTime = Date.now()
  let dbStatus: 'connected' | 'disconnected' = 'disconnected'
  let dbLatency: number | undefined

  try {
    // Check database connectivity with a simple query
    const dbStart = Date.now()
    await db.$queryRaw`SELECT 1`
    dbLatency = Date.now() - dbStart
    dbStatus = 'connected'
  } catch (error) {
    console.error('Health check - Database error:', error)
    dbStatus = 'disconnected'
  }

  const isHealthy = dbStatus === 'connected'

  const response: HealthStatus = {
    status: isHealthy ? 'healthy' : 'unhealthy',
    timestamp: new Date().toISOString(),
    version: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) || 'local',
    checks: {
      database: {
        status: dbStatus,
        ...(dbLatency !== undefined && { latency: dbLatency }),
      },
    },
  }

  return NextResponse.json(response, {
    status: isHealthy ? 200 : 503,
    headers: {
      'Cache-Control': 'no-store, no-cache, must-revalidate',
    },
  })
}
