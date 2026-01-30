import { z } from 'zod'

export const updateDealerProfileSchema = z.object({
  phone: z.string().min(5, 'Phone number must be at least 5 characters'),
  address: z.string().min(5, 'Address must be at least 5 characters'),
})

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z.string().min(8, 'New password must be at least 8 characters'),
    confirmPassword: z.string().min(1, 'Please confirm your new password'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })

export type UpdateDealerProfileInput = z.infer<typeof updateDealerProfileSchema>
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>

// Balance request schema
export const balanceRequestSchema = z.object({
  amount: z
    .number()
    .positive('Amount must be greater than 0')
    .max(1000000, 'Amount cannot exceed $1,000,000'),
  receiptUrl: z.string().url('Invalid receipt URL'),
  comment: z.string().max(500, 'Comment cannot exceed 500 characters').optional(),
})

export type BalanceRequestInput = z.infer<typeof balanceRequestSchema>
