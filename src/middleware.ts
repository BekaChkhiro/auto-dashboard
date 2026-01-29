import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'

export async function middleware(request: NextRequest) {
  const secret = process.env.NEXTAUTH_SECRET

  // Debug logging
  console.log('[Middleware] Path:', request.nextUrl.pathname)
  console.log('[Middleware] NEXTAUTH_SECRET exists:', !!secret)
  console.log('[Middleware] NEXTAUTH_SECRET length:', secret?.length || 0)

  const token = await getToken({
    req: request,
    secret,
  })

  console.log('[Middleware] Token exists:', !!token)
  console.log('[Middleware] Token role:', token?.role || 'none')

  const { pathname } = request.nextUrl

  // Public routes that don't need authentication
  const publicRoutes = ['/login', '/api/auth', '/api/calculator']
  const isPublicRoute = publicRoutes.some((route) => pathname.startsWith(route))

  // Redirect authenticated users away from login
  if (isPublicRoute && token) {
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
