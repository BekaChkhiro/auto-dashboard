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
