'use server'

import { db } from '@/lib/db'
import { hashPassword } from '@/lib/auth'
import { sendPasswordResetEmail } from '@/lib/email'
import { randomBytes } from 'crypto'
import { z } from 'zod'
import { checkRateLimit, RATE_LIMITS } from '@/lib/rate-limit-config'
import { headers } from 'next/headers'

// ============================================================================
// TYPES
// ============================================================================

export interface ActionResult {
  success: boolean
  message: string
}

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
})

const resetPasswordSchema = z
  .object({
    token: z.string().min(1, 'Token is required'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })

// ============================================================================
// REQUEST PASSWORD RESET
// ============================================================================

export async function requestPasswordReset(
  email: string,
  locale: string = 'en'
): Promise<ActionResult> {
  try {
    // Validate email
    const validated = forgotPasswordSchema.safeParse({ email })
    if (!validated.success) {
      return { success: false, message: 'Invalid email address' }
    }

    // Get client IP for rate limiting
    const headersList = await headers()
    const ip = headersList.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'

    // Rate limit by email + IP combination
    const rateLimitKey = `password-reset:${email.toLowerCase()}:${ip}`
    const rateLimit = checkRateLimit(rateLimitKey, RATE_LIMITS.passwordReset)

    if (!rateLimit.allowed) {
      const minutes = Math.ceil((rateLimit.retryAfterSeconds || 0) / 60)
      return {
        success: false,
        message: `Too many password reset requests. Please try again in ${minutes} minute${minutes !== 1 ? 's' : ''}.`,
      }
    }

    // Check if user exists
    const user = await db.user.findUnique({
      where: { email: email.toLowerCase() },
      select: { id: true, email: true, status: true },
    })

    // Always return success to prevent email enumeration
    if (!user || user.status === 'BLOCKED') {
      // Wait a bit to prevent timing attacks
      await new Promise((resolve) => setTimeout(resolve, 500))
      return {
        success: true,
        message: 'If an account exists with this email, you will receive a password reset link.',
      }
    }

    // Delete any existing tokens for this email
    await db.passwordResetToken.deleteMany({
      where: { email: user.email },
    })

    // Generate a secure token
    const token = randomBytes(32).toString('hex')

    // Create token with 1 hour expiry
    await db.passwordResetToken.create({
      data: {
        token,
        email: user.email,
        expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
      },
    })

    // Send reset email
    const emailResult = await sendPasswordResetEmail(user.email, token, locale)

    if (!emailResult.success) {
      console.error('Failed to send password reset email:', emailResult.error)
      // Still return success to prevent information leakage
    }

    return {
      success: true,
      message: 'If an account exists with this email, you will receive a password reset link.',
    }
  } catch (error) {
    console.error('Error requesting password reset:', error)
    return { success: false, message: 'An error occurred. Please try again.' }
  }
}

// ============================================================================
// VALIDATE RESET TOKEN
// ============================================================================

export async function validateResetToken(token: string): Promise<{
  valid: boolean
  email?: string
  message?: string
}> {
  try {
    const resetToken = await db.passwordResetToken.findUnique({
      where: { token },
    })

    if (!resetToken) {
      return { valid: false, message: 'Invalid or expired reset link' }
    }

    if (resetToken.usedAt) {
      return { valid: false, message: 'This reset link has already been used' }
    }

    if (new Date() > resetToken.expiresAt) {
      return { valid: false, message: 'This reset link has expired' }
    }

    return { valid: true, email: resetToken.email }
  } catch (error) {
    console.error('Error validating reset token:', error)
    return { valid: false, message: 'An error occurred. Please try again.' }
  }
}

// ============================================================================
// RESET PASSWORD
// ============================================================================

export async function resetPassword(
  token: string,
  password: string,
  confirmPassword: string
): Promise<ActionResult> {
  try {
    // Validate input
    const validated = resetPasswordSchema.safeParse({ token, password, confirmPassword })
    if (!validated.success) {
      const issues = validated.error.issues
      return { success: false, message: issues[0]?.message || 'Invalid input' }
    }

    // Find and validate token
    const resetToken = await db.passwordResetToken.findUnique({
      where: { token },
    })

    if (!resetToken) {
      return { success: false, message: 'Invalid or expired reset link' }
    }

    if (resetToken.usedAt) {
      return { success: false, message: 'This reset link has already been used' }
    }

    if (new Date() > resetToken.expiresAt) {
      return { success: false, message: 'This reset link has expired' }
    }

    // Find user
    const user = await db.user.findUnique({
      where: { email: resetToken.email },
    })

    if (!user) {
      return { success: false, message: 'User not found' }
    }

    if (user.status === 'BLOCKED') {
      return { success: false, message: 'This account has been blocked' }
    }

    // Hash new password
    const hashedPassword = await hashPassword(password)

    // Update password and mark token as used
    await db.$transaction([
      db.user.update({
        where: { id: user.id },
        data: { password: hashedPassword },
      }),
      db.passwordResetToken.update({
        where: { token },
        data: { usedAt: new Date() },
      }),
    ])

    return {
      success: true,
      message:
        'Your password has been reset successfully. You can now login with your new password.',
    }
  } catch (error) {
    console.error('Error resetting password:', error)
    return { success: false, message: 'An error occurred. Please try again.' }
  }
}
