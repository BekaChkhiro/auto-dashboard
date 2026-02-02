import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'

// CSRF protection: validate origin for state-changing requests
function validateCsrf(request: NextRequest): boolean {
  const method = request.method

  // Only validate state-changing methods
  if (!['POST', 'PUT', 'DELETE', 'PATCH'].includes(method)) {
    return true
  }

  const origin = request.headers.get('origin')
  const host = request.headers.get('host')

  // Allow requests without origin (same-origin requests from forms, etc.)
  if (!origin) {
    return true
  }

  // Parse origin to get hostname
  try {
    const originUrl = new URL(origin)
    const originHost = originUrl.host

    // Allow if origin matches host
    if (originHost === host) {
      return true
    }

    // For development, also allow localhost variations
    if (process.env.NODE_ENV === 'development') {
      const localhostPatterns = ['localhost', '127.0.0.1']
      const originIsLocalhost = localhostPatterns.some((p) => originHost.includes(p))
      const hostIsLocalhost = localhostPatterns.some((p) => host?.includes(p))
      if (originIsLocalhost && hostIsLocalhost) {
        return true
      }
    }

    return false
  } catch {
    // Invalid origin URL
    return false
  }
}

export async function middleware(request: NextRequest) {
  // CSRF protection for state-changing requests
  if (!validateCsrf(request)) {
    return new NextResponse('Forbidden - CSRF validation failed', { status: 403 })
  }

  // NextAuth v5 uses different cookie name
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
    cookieName:
      process.env.NODE_ENV === 'production'
        ? '__Secure-authjs.session-token'
        : 'authjs.session-token',
  })

  const { pathname } = request.nextUrl

  // Public routes that don't need authentication
  const publicRoutes = [
    '/login',
    '/forgot-password',
    '/reset-password',
    '/api/auth',
    '/api/calculator',
    '/api/health',
  ]

  // Check if it's a public route or the landing page
  const isLandingPage = pathname === '/'
  const isPublicRoute = isLandingPage || publicRoutes.some((route) => pathname.startsWith(route))

  // Redirect authenticated users away from login (but not from landing page)
  if (isPublicRoute && token && !isLandingPage) {
    const role = token.role as string
    const redirectUrl = role === 'ADMIN' ? '/admin' : '/dealer'
    return NextResponse.redirect(new URL(redirectUrl, request.url))
  }

  // Allow public routes
  if (isPublicRoute) {
    return NextResponse.next()
  }

  // Redirect unauthenticated users to login
  if (!token) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('callbackUrl', pathname)
    return NextResponse.redirect(loginUrl)
  }

  const role = token.role as string

  // Role-based route protection
  if (pathname.startsWith('/admin') && role !== 'ADMIN') {
    return NextResponse.redirect(new URL('/dealer', request.url))
  }

  if (pathname.startsWith('/dealer') && role !== 'DEALER') {
    return NextResponse.redirect(new URL('/admin', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (public folder)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
