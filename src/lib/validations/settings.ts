import { z } from 'zod'

// ============================================================================
// COUNTRY SCHEMAS
// ============================================================================

export const countrySchema = z.object({
  nameKa: z.string().min(1, 'Georgian name is required'),
  nameEn: z.string().min(1, 'English name is required'),
  code: z
    .string()
    .min(2, 'Code must be at least 2 characters')
    .max(3, 'Code must be at most 3 characters')
    .toUpperCase(),
})

export type CountryInput = z.infer<typeof countrySchema>

// ============================================================================
// STATE SCHEMAS
// ============================================================================

export const stateSchema = z.object({
  nameKa: z.string().min(1, 'Georgian name is required'),
  nameEn: z.string().min(1, 'English name is required'),
  code: z.string().min(1, 'Code is required').toUpperCase(),
  countryId: z.string().min(1, 'Country is required'),
})

export type StateInput = z.infer<typeof stateSchema>

// ============================================================================
// CITY SCHEMAS
// ============================================================================

export const citySchema = z.object({
  name: z.string().min(1, 'City name is required'),
  stateId: z.string().min(1, 'State is required'),
})

export type CityInput = z.infer<typeof citySchema>

// ============================================================================
// PORT SCHEMAS
// ============================================================================

export const portSchema = z.object({
  name: z.string().min(1, 'Port name is required'),
  isDestination: z.boolean(),
  stateId: z.string().min(1, 'State is required'),
})

export type PortInput = z.infer<typeof portSchema>

// ============================================================================
// MAKE SCHEMAS
// ============================================================================

export const makeSchema = z.object({
  name: z.string().min(1, 'Make name is required'),
})

export type MakeInput = z.infer<typeof makeSchema>

// ============================================================================
// MODEL SCHEMAS
// ============================================================================

export const modelSchema = z.object({
  name: z.string().min(1, 'Model name is required'),
  makeId: z.string().min(1, 'Make is required'),
})

export type ModelInput = z.infer<typeof modelSchema>

// ============================================================================
// AUCTION SCHEMAS
// ============================================================================

export const auctionSchema = z.object({
  name: z.string().min(1, 'Auction name is required'),
})

export type AuctionInput = z.infer<typeof auctionSchema>

// ============================================================================
// STATUS SCHEMAS
// ============================================================================

export const statusSchema = z.object({
  nameKa: z.string().min(1, 'Georgian name is required'),
  nameEn: z.string().min(1, 'English name is required'),
  order: z.number().int().min(0, 'Order must be a positive number'),
  color: z
    .string()
    .regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, 'Invalid hex color')
    .optional()
    .or(z.literal('')),
})

export type StatusInput = z.infer<typeof statusSchema>

// ============================================================================
// STATUS ORDER SCHEMA
// ============================================================================

export const statusOrderSchema = z.object({
  orderedIds: z.array(z.string()).min(1, 'At least one status is required'),
})

export type StatusOrderInput = z.infer<typeof statusOrderSchema>

// ============================================================================
// CALCULATOR SCHEMAS
// ============================================================================

export const towingPriceSchema = z.object({
  price: z.number().positive('Price must be positive'),
  cityId: z.string().min(1, 'City is required'),
  portId: z.string().min(1, 'Port is required'),
})

export type TowingPriceInput = z.infer<typeof towingPriceSchema>

export const shippingPriceSchema = z.object({
  price: z.number().positive('Price must be positive'),
  originPortId: z.string().min(1, 'Origin port is required'),
  destinationPortId: z.string().min(1, 'Destination port is required'),
})

export type ShippingPriceInput = z.infer<typeof shippingPriceSchema>

export const insurancePriceSchema = z
  .object({
    minValue: z.number().min(0, 'Minimum value must be non-negative'),
    maxValue: z.number().positive('Maximum value must be positive'),
    price: z.number().positive('Price must be positive'),
  })
  .refine((data) => data.minValue < data.maxValue, {
    message: 'Minimum value must be less than maximum value',
    path: ['minValue'],
  })

export type InsurancePriceInput = z.infer<typeof insurancePriceSchema>

export const systemSettingSchema = z.object({
  key: z.string().min(1, 'Key is required'),
  value: z.string().min(1, 'Value is required'),
})

export type SystemSettingInput = z.infer<typeof systemSettingSchema>
