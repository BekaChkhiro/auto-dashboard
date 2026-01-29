'use server'

import { db } from '@/lib/db'
import { requireDealer, hashPassword, verifyPassword } from '@/lib/auth'
import { revalidatePath } from 'next/cache'
import {
  updateDealerProfileSchema,
  changePasswordSchema,
  type UpdateDealerProfileInput,
  type ChangePasswordInput,
} from '@/lib/validations/dealer-profile'

// ============================================================================
// TYPES
// ============================================================================

export interface DealerProfile {
  id: string
  email: string
  name: string
  phone: string
  address: string
  companyName: string | null
  identificationNumber: string | null
  createdAt: Date
}

export interface ActionResult {
  success: boolean
  message: string
}

// ============================================================================
// GET DEALER PROFILE
// ============================================================================

export async function getDealerProfile(): Promise<DealerProfile | null> {
  const session = await requireDealer()
  const dealerId = session.user.id

  const dealer = await db.user.findUnique({
    where: { id: dealerId },
    select: {
      id: true,
      email: true,
      name: true,
      phone: true,
      address: true,
      companyName: true,
      identificationNumber: true,
      createdAt: true,
      // Explicitly NOT selecting: balance, discount, password
    },
  })

  return dealer
}

// ============================================================================
// UPDATE DEALER PROFILE
// ============================================================================

export async function updateDealerProfile(data: UpdateDealerProfileInput): Promise<ActionResult> {
  const session = await requireDealer()
  const dealerId = session.user.id

  try {
    // Validate input
    const validatedData = updateDealerProfileSchema.parse(data)

    // Update only allowed fields (phone, address)
    await db.user.update({
      where: { id: dealerId },
      data: {
        phone: validatedData.phone,
        address: validatedData.address,
      },
    })

    revalidatePath('/dealer/profile')
    revalidatePath('/dealer')

    return {
      success: true,
      message: 'Profile updated successfully',
    }
  } catch (error) {
    console.error('Error updating dealer profile:', error)

    if (error instanceof Error && error.name === 'ZodError') {
      return { success: false, message: 'Invalid input data' }
    }

    return { success: false, message: 'Failed to update profile' }
  }
}

// ============================================================================
// CHANGE PASSWORD
// ============================================================================

export async function changePassword(data: ChangePasswordInput): Promise<ActionResult> {
  const session = await requireDealer()
  const dealerId = session.user.id

  try {
    // Validate input
    const validatedData = changePasswordSchema.parse(data)

    // Get current user with password hash
    const user = await db.user.findUnique({
      where: { id: dealerId },
      select: { password: true },
    })

    if (!user) {
      return { success: false, message: 'User not found' }
    }

    // Verify current password
    const isValidPassword = await verifyPassword(validatedData.currentPassword, user.password)

    if (!isValidPassword) {
      return { success: false, message: 'Current password is incorrect' }
    }

    // Hash new password
    const hashedPassword = await hashPassword(validatedData.newPassword)

    // Update password in database
    await db.user.update({
      where: { id: dealerId },
      data: { password: hashedPassword },
    })

    revalidatePath('/dealer/profile')

    return {
      success: true,
      message: 'Password changed successfully',
    }
  } catch (error) {
    console.error('Error changing password:', error)

    if (error instanceof Error && error.name === 'ZodError') {
      return { success: false, message: 'Invalid input data' }
    }

    return { success: false, message: 'Failed to change password' }
  }
}
