import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import bcrypt from 'bcrypt'
import { db } from '@/lib/db'
import type { UserRole, UserStatus } from '@/generated/prisma'
import { checkRateLimit, resetRateLimit, RATE_LIMITS } from '@/lib/rate-limit-config'

// Custom types for our auth
export interface AuthUser {
  id: string
  email: string
  name: string
  role: UserRole
  status: UserStatus
}

// Extend the session types
declare module 'next-auth' {
  interface Session {
    user: AuthUser
  }

  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  interface User extends AuthUser {}
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  trustHost: true,
  providers: [
    Credentials({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Email and password are required')
        }

        const email = (credentials.email as string).toLowerCase()
        const password = credentials.password as string

        // Rate limit check by email
        const rateLimitKey = `login:${email}`
        const rateLimit = checkRateLimit(rateLimitKey, RATE_LIMITS.login)

        if (!rateLimit.allowed) {
          throw new Error(
            `Too many login attempts. Please try again in ${rateLimit.retryAfterSeconds} seconds.`
          )
        }

        // Find user by email
        const user = await db.user.findUnique({
          where: { email },
          select: {
            id: true,
            email: true,
            password: true,
            name: true,
            role: true,
            status: true,
          },
        })

        if (!user) {
          throw new Error('Invalid email or password')
        }

        // Check if user is blocked
        if (user.status === 'BLOCKED') {
          throw new Error('Your account has been blocked. Please contact administrator.')
        }

        // Verify password
        const isValidPassword = await bcrypt.compare(password, user.password)

        if (!isValidPassword) {
          throw new Error('Invalid email or password')
        }

        // Reset rate limit on successful login
        resetRateLimit(rateLimitKey)

        // Return user data (excluding password)
        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          status: user.status,
        }
      },
    }),
  ],
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  callbacks: {
    async jwt({ token, user }) {
      // Initial sign in - add user data to token
      if (user) {
        token.id = user.id
        token.email = user.email
        token.name = user.name
        token.role = user.role
        token.status = user.status
      }
      return token
    },
    async session({ session, token }) {
      // Add token data to session
      if (session.user) {
        ;(session.user as AuthUser).id = token.id as string
        ;(session.user as AuthUser).email = token.email as string
        ;(session.user as AuthUser).name = token.name as string
        ;(session.user as AuthUser).role = token.role as UserRole
        ;(session.user as AuthUser).status = token.status as UserStatus
      }
      return session
    },
  },
})

// Helper function to hash passwords
export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 12
  return bcrypt.hash(password, saltRounds)
}

// Helper function to verify passwords
export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword)
}

// Helper function to get current session (for use in server components)
export async function getSession() {
  return await auth()
}

// Helper function to require authentication (throws redirect if not authenticated)
export async function requireAuth() {
  const session = await auth()
  if (!session?.user) {
    const { redirect } = await import('next/navigation')
    redirect('/login')
    throw new Error('Redirect failed') // This line is never reached, but helps TypeScript
  }
  const user = session.user as AuthUser
  if (user.status === 'BLOCKED') {
    const { redirect } = await import('next/navigation')
    redirect('/login?error=blocked')
  }
  return { ...session, user }
}

// Helper function to require admin role
export async function requireAdmin() {
  const session = await requireAuth()
  if (session.user.role !== 'ADMIN') {
    const { redirect } = await import('next/navigation')
    redirect('/dealer')
  }
  return session
}

// Helper function to require dealer role
export async function requireDealer() {
  const session = await requireAuth()
  if (session.user.role !== 'DEALER') {
    const { redirect } = await import('next/navigation')
    redirect('/admin')
  }
  return session
}
