import { auth } from '@/lib/auth'
import { NextResponse } from 'next/server'

export default auth((request) => {
  const { nextUrl } = request
  const pathname = nextUrl.pathname
  const isLoggedIn = !!request.auth
  const userRole = request.auth?.user?.role

  console.log('[Middleware] Path:', pathname)
  console.log('[Middleware] Is logged in:', isLoggedIn)
  console.log('[Middleware] User role:', userRole || 'none')

  // Public routes that don't need authentication
  const publicRoutes = ['/login', '/api/auth', '/api/calculator']
  const isPublicRoute = publicRoutes.some((route) => pathname.startsWith(route))

  // Redirect authenticated users away from login
  if (isPublicRoute && isLoggedIn) {
    const redirectUrl = userRole === 'ADMIN' ? '/admin' : '/dealer'
    return NextResponse.redirect(new URL(redirectUrl, nextUrl))
  }

  // Allow public routes
  if (isPublicRoute) {
    return NextResponse.next()
  }

  // Redirect unauthenticated users to login
  if (!isLoggedIn) {
    const loginUrl = new URL('/login', nextUrl)
    loginUrl.searchParams.set('callbackUrl', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Role-based route protection
  if (pathname.startsWith('/admin') && userRole !== 'ADMIN') {
    return NextResponse.redirect(new URL('/dealer', nextUrl))
  }

  if (pathname.startsWith('/dealer') && userRole !== 'DEALER') {
    return NextResponse.redirect(new URL('/admin', nextUrl))
  }

  return NextResponse.next()
})

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
