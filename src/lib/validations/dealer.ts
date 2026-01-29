import { z } from 'zod'

export const createDealerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  name: z.string().min(2, 'Name must be at least 2 characters'),
  phone: z.string().min(5, 'Phone number is required'),
  address: z.string().min(5, 'Address is required'),
  companyName: z.string().optional(),
  identificationNumber: z.string().optional(),
  discount: z.coerce.number().min(0).max(100).default(0),
  balance: z.coerce.number().default(0),
  status: z.enum(['ACTIVE', 'BLOCKED']).default('ACTIVE'),
})

export const updateDealerSchema = createDealerSchema
  .omit({ password: true })
  .extend({
    password: z.string().min(8, 'Password must be at least 8 characters').optional().or(z.literal('')),
  })

export type CreateDealerInput = z.infer<typeof createDealerSchema>
export type UpdateDealerInput = z.infer<typeof updateDealerSchema>
