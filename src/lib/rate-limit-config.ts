/**
 * Rate limiting configuration for sensitive endpoints
 * Uses in-memory store - consider Redis for production multi-instance deployments
 */

interface RateLimitEntry {
  count: number
  resetAt: number
}

// In-memory store for rate limiting
const rateLimitStore = new Map<string, RateLimitEntry>()

// Clean up expired entries periodically
setInterval(() => {
  const now = Date.now()
  for (const [key, entry] of rateLimitStore.entries()) {
    if (entry.resetAt < now) {
      rateLimitStore.delete(key)
    }
  }
}, 60000) // Clean up every minute

export interface RateLimitConfig {
  maxAttempts: number
  windowMs: number
}

// Rate limit configurations for different endpoints
export const RATE_LIMITS = {
  // Login: 5 attempts per 5 minutes
  login: {
    maxAttempts: 5,
    windowMs: 5 * 60 * 1000, // 5 minutes
  },
  // Password reset: 3 attempts per hour
  passwordReset: {
    maxAttempts: 3,
    windowMs: 60 * 60 * 1000, // 1 hour
  },
  // File uploads: 30 requests per 5 minutes
  upload: {
    maxAttempts: 30,
    windowMs: 5 * 60 * 1000, // 5 minutes
  },
} as const

export interface RateLimitResult {
  allowed: boolean
  remaining: number
  resetAt: Date
  retryAfterSeconds?: number
}

/**
 * Check and update rate limit for a given key
 * @param key Unique identifier (e.g., email, IP, user ID)
 * @param config Rate limit configuration
 * @returns Rate limit result with allowed status and remaining attempts
 */
export function checkRateLimit(key: string, config: RateLimitConfig): RateLimitResult {
  const now = Date.now()
  const entry = rateLimitStore.get(key)

  // If no entry or window has expired, create new entry
  if (!entry || entry.resetAt < now) {
    const resetAt = now + config.windowMs
    rateLimitStore.set(key, { count: 1, resetAt })
    return {
      allowed: true,
      remaining: config.maxAttempts - 1,
      resetAt: new Date(resetAt),
    }
  }

  // Check if limit exceeded
  if (entry.count >= config.maxAttempts) {
    const retryAfterSeconds = Math.ceil((entry.resetAt - now) / 1000)
    return {
      allowed: false,
      remaining: 0,
      resetAt: new Date(entry.resetAt),
      retryAfterSeconds,
    }
  }

  // Increment count
  entry.count += 1
  rateLimitStore.set(key, entry)

  return {
    allowed: true,
    remaining: config.maxAttempts - entry.count,
    resetAt: new Date(entry.resetAt),
  }
}

/**
 * Reset rate limit for a given key (e.g., after successful login)
 */
export function resetRateLimit(key: string): void {
  rateLimitStore.delete(key)
}

/**
 * Get rate limit status without incrementing
 */
export function getRateLimitStatus(key: string, config: RateLimitConfig): RateLimitResult {
  const now = Date.now()
  const entry = rateLimitStore.get(key)

  if (!entry || entry.resetAt < now) {
    return {
      allowed: true,
      remaining: config.maxAttempts,
      resetAt: new Date(now + config.windowMs),
    }
  }

  const remaining = Math.max(0, config.maxAttempts - entry.count)
  const allowed = remaining > 0

  return {
    allowed,
    remaining,
    resetAt: new Date(entry.resetAt),
    retryAfterSeconds: allowed ? undefined : Math.ceil((entry.resetAt - now) / 1000),
  }
}
