import { z } from 'zod'

// VIN validation: 17 characters, alphanumeric (excluding I, O, Q)
const vinRegex = /^[A-HJ-NPR-Z0-9]{17}$/i

// Damage type enum values
export const damageTypeEnum = [
  'CLEAN',
  'SALVAGE',
  'REBUILT',
  'FLOOD',
  'VANDALISM',
  'HAIL',
  'MECHANICAL',
  'OTHER',
] as const

export type DamageTypeValue = (typeof damageTypeEnum)[number]

export const createVehicleSchema = z.object({
  // Basic Info
  dealerId: z.string().min(1, 'Dealer is required'),
  vin: z
    .string()
    .length(17, 'VIN must be exactly 17 characters')
    .regex(vinRegex, 'VIN must be alphanumeric (I, O, Q not allowed)'),
  makeId: z.string().min(1, 'Make is required'),
  modelId: z.string().min(1, 'Model is required'),
  year: z
    .number()
    .min(1900, 'Year must be 1900 or later')
    .max(new Date().getFullYear() + 1, 'Year cannot be more than 1 year in the future'),
  color: z.string().optional(),
  damageType: z.enum(damageTypeEnum),
  hasKeys: z.boolean(),

  // Auction Info
  auctionId: z.string().min(1, 'Auction is required'),
  lotNumber: z.string().min(1, 'Lot number is required'),
  auctionLink: z.string().url('Must be a valid URL').optional().or(z.literal('')),

  // Location
  countryId: z.string().min(1, 'Country is required'),
  stateId: z.string().min(1, 'State is required'),
  cityId: z.string().optional().or(z.literal('')),
  portId: z.string().optional().or(z.literal('')),

  // Transportation
  transportationPrice: z.number().min(0, 'Price must be positive'),
  statusId: z.string().min(1, 'Status is required'),
  shipName: z.string().optional().or(z.literal('')),
  containerNumber: z.string().optional().or(z.literal('')),
  eta: z.string().optional().or(z.literal('')),
})

export const updateVehicleSchema = createVehicleSchema

export const commentSchema = z.object({
  content: z
    .string()
    .min(1, 'Comment cannot be empty')
    .max(2000, 'Comment must be 2000 characters or less'),
})

export type CreateVehicleInput = z.infer<typeof createVehicleSchema>
export type UpdateVehicleInput = z.infer<typeof updateVehicleSchema>
export type CommentInput = z.infer<typeof commentSchema>

// Damage type options for select dropdowns
export const damageTypeOptions = [
  { value: 'CLEAN', label: 'Clean' },
  { value: 'SALVAGE', label: 'Salvage' },
  { value: 'REBUILT', label: 'Rebuilt' },
  { value: 'FLOOD', label: 'Flood' },
  { value: 'VANDALISM', label: 'Vandalism' },
  { value: 'HAIL', label: 'Hail' },
  { value: 'MECHANICAL', label: 'Mechanical' },
  { value: 'OTHER', label: 'Other' },
] as const
