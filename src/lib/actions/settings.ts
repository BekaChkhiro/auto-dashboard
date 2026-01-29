'use server'

import { db } from '@/lib/db'
import { requireAdmin } from '@/lib/auth'
import { revalidatePath } from 'next/cache'
import {
  countrySchema,
  stateSchema,
  citySchema,
  portSchema,
  makeSchema,
  modelSchema,
  auctionSchema,
  statusSchema,
  statusOrderSchema,
  towingPriceSchema,
  shippingPriceSchema,
  insurancePriceSchema,
  systemSettingSchema,
  type CountryInput,
  type StateInput,
  type CityInput,
  type PortInput,
  type MakeInput,
  type ModelInput,
  type AuctionInput,
  type StatusInput,
  type StatusOrderInput,
  type TowingPriceInput,
  type ShippingPriceInput,
  type InsurancePriceInput,
  type SystemSettingInput,
} from '@/lib/validations/settings'

// Common result type
export interface ActionResult {
  success: boolean
  message: string
}

// ============================================================================
// COUNTRY ACTIONS
// ============================================================================

export interface CountryItem {
  id: string
  nameKa: string
  nameEn: string
  code: string
  _count: {
    states: number
    vehicles: number
  }
}

export async function getCountries(): Promise<CountryItem[]> {
  await requireAdmin()

  return db.country.findMany({
    orderBy: { nameEn: 'asc' },
    select: {
      id: true,
      nameKa: true,
      nameEn: true,
      code: true,
      _count: {
        select: {
          states: true,
          vehicles: true,
        },
      },
    },
  })
}

export async function createCountry(data: CountryInput): Promise<ActionResult> {
  await requireAdmin()

  const validation = countrySchema.safeParse(data)
  if (!validation.success) {
    return {
      success: false,
      message: validation.error.issues[0]?.message || 'Validation failed',
    }
  }

  const { nameKa, nameEn, code } = validation.data

  try {
    // Check for duplicate code
    const existing = await db.country.findUnique({
      where: { code },
      select: { id: true },
    })

    if (existing) {
      return { success: false, message: 'A country with this code already exists' }
    }

    await db.country.create({
      data: { nameKa, nameEn, code },
    })

    revalidatePath('/admin/settings')
    return { success: true, message: 'Country created successfully' }
  } catch {
    return { success: false, message: 'Failed to create country' }
  }
}

export async function updateCountry(id: string, data: CountryInput): Promise<ActionResult> {
  await requireAdmin()

  const validation = countrySchema.safeParse(data)
  if (!validation.success) {
    return {
      success: false,
      message: validation.error.issues[0]?.message || 'Validation failed',
    }
  }

  const { nameKa, nameEn, code } = validation.data

  try {
    // Check if country exists
    const country = await db.country.findUnique({
      where: { id },
      select: { id: true, code: true },
    })

    if (!country) {
      return { success: false, message: 'Country not found' }
    }

    // Check for duplicate code if changing
    if (code !== country.code) {
      const existing = await db.country.findUnique({
        where: { code },
        select: { id: true },
      })

      if (existing) {
        return { success: false, message: 'A country with this code already exists' }
      }
    }

    await db.country.update({
      where: { id },
      data: { nameKa, nameEn, code },
    })

    revalidatePath('/admin/settings')
    return { success: true, message: 'Country updated successfully' }
  } catch {
    return { success: false, message: 'Failed to update country' }
  }
}

export async function deleteCountry(id: string): Promise<ActionResult> {
  await requireAdmin()

  try {
    // Check for dependencies
    const country = await db.country.findUnique({
      where: { id },
      select: {
        id: true,
        nameEn: true,
        _count: {
          select: {
            states: true,
            vehicles: true,
          },
        },
      },
    })

    if (!country) {
      return { success: false, message: 'Country not found' }
    }

    if (country._count.states > 0) {
      return {
        success: false,
        message: `Cannot delete: ${country._count.states} state(s) belong to this country`,
      }
    }

    if (country._count.vehicles > 0) {
      return {
        success: false,
        message: `Cannot delete: ${country._count.vehicles} vehicle(s) reference this country`,
      }
    }

    await db.country.delete({ where: { id } })

    revalidatePath('/admin/settings')
    return { success: true, message: 'Country deleted successfully' }
  } catch {
    return { success: false, message: 'Failed to delete country' }
  }
}

// ============================================================================
// STATE ACTIONS
// ============================================================================

export interface StateItem {
  id: string
  nameKa: string
  nameEn: string
  code: string
  countryId: string
  _count: {
    cities: number
    ports: number
    vehicles: number
  }
}

export async function getStatesByCountry(countryId: string): Promise<StateItem[]> {
  await requireAdmin()

  return db.state.findMany({
    where: { countryId },
    orderBy: { nameEn: 'asc' },
    select: {
      id: true,
      nameKa: true,
      nameEn: true,
      code: true,
      countryId: true,
      _count: {
        select: {
          cities: true,
          ports: true,
          vehicles: true,
        },
      },
    },
  })
}

export async function createState(data: StateInput): Promise<ActionResult> {
  await requireAdmin()

  const validation = stateSchema.safeParse(data)
  if (!validation.success) {
    return {
      success: false,
      message: validation.error.issues[0]?.message || 'Validation failed',
    }
  }

  const { nameKa, nameEn, code, countryId } = validation.data

  try {
    // Check if country exists
    const country = await db.country.findUnique({
      where: { id: countryId },
      select: { id: true },
    })

    if (!country) {
      return { success: false, message: 'Country not found' }
    }

    await db.state.create({
      data: { nameKa, nameEn, code, countryId },
    })

    revalidatePath('/admin/settings')
    return { success: true, message: 'State created successfully' }
  } catch {
    return { success: false, message: 'Failed to create state' }
  }
}

export async function updateState(id: string, data: StateInput): Promise<ActionResult> {
  await requireAdmin()

  const validation = stateSchema.safeParse(data)
  if (!validation.success) {
    return {
      success: false,
      message: validation.error.issues[0]?.message || 'Validation failed',
    }
  }

  const { nameKa, nameEn, code, countryId } = validation.data

  try {
    const state = await db.state.findUnique({
      where: { id },
      select: { id: true },
    })

    if (!state) {
      return { success: false, message: 'State not found' }
    }

    // Check if country exists
    const country = await db.country.findUnique({
      where: { id: countryId },
      select: { id: true },
    })

    if (!country) {
      return { success: false, message: 'Country not found' }
    }

    await db.state.update({
      where: { id },
      data: { nameKa, nameEn, code, countryId },
    })

    revalidatePath('/admin/settings')
    return { success: true, message: 'State updated successfully' }
  } catch {
    return { success: false, message: 'Failed to update state' }
  }
}

export async function deleteState(id: string): Promise<ActionResult> {
  await requireAdmin()

  try {
    const state = await db.state.findUnique({
      where: { id },
      select: {
        id: true,
        nameEn: true,
        _count: {
          select: {
            cities: true,
            ports: true,
            vehicles: true,
          },
        },
      },
    })

    if (!state) {
      return { success: false, message: 'State not found' }
    }

    if (state._count.cities > 0 || state._count.ports > 0) {
      return {
        success: false,
        message: `Cannot delete: ${state._count.cities} city/cities and ${state._count.ports} port(s) belong to this state`,
      }
    }

    if (state._count.vehicles > 0) {
      return {
        success: false,
        message: `Cannot delete: ${state._count.vehicles} vehicle(s) reference this state`,
      }
    }

    await db.state.delete({ where: { id } })

    revalidatePath('/admin/settings')
    return { success: true, message: 'State deleted successfully' }
  } catch {
    return { success: false, message: 'Failed to delete state' }
  }
}

// ============================================================================
// CITY ACTIONS
// ============================================================================

export interface CityItem {
  id: string
  name: string
  stateId: string
  _count: {
    vehicles: number
  }
}

export async function getCitiesByState(stateId: string): Promise<CityItem[]> {
  await requireAdmin()

  return db.city.findMany({
    where: { stateId },
    orderBy: { name: 'asc' },
    select: {
      id: true,
      name: true,
      stateId: true,
      _count: {
        select: {
          vehicles: true,
        },
      },
    },
  })
}

export async function createCity(data: CityInput): Promise<ActionResult> {
  await requireAdmin()

  const validation = citySchema.safeParse(data)
  if (!validation.success) {
    return {
      success: false,
      message: validation.error.issues[0]?.message || 'Validation failed',
    }
  }

  const { name, stateId } = validation.data

  try {
    // Check if state exists
    const state = await db.state.findUnique({
      where: { id: stateId },
      select: { id: true },
    })

    if (!state) {
      return { success: false, message: 'State not found' }
    }

    await db.city.create({
      data: { name, stateId },
    })

    revalidatePath('/admin/settings')
    return { success: true, message: 'City created successfully' }
  } catch {
    return { success: false, message: 'Failed to create city' }
  }
}

export async function updateCity(id: string, data: CityInput): Promise<ActionResult> {
  await requireAdmin()

  const validation = citySchema.safeParse(data)
  if (!validation.success) {
    return {
      success: false,
      message: validation.error.issues[0]?.message || 'Validation failed',
    }
  }

  const { name, stateId } = validation.data

  try {
    const city = await db.city.findUnique({
      where: { id },
      select: { id: true },
    })

    if (!city) {
      return { success: false, message: 'City not found' }
    }

    // Check if state exists
    const state = await db.state.findUnique({
      where: { id: stateId },
      select: { id: true },
    })

    if (!state) {
      return { success: false, message: 'State not found' }
    }

    await db.city.update({
      where: { id },
      data: { name, stateId },
    })

    revalidatePath('/admin/settings')
    return { success: true, message: 'City updated successfully' }
  } catch {
    return { success: false, message: 'Failed to update city' }
  }
}

export async function deleteCity(id: string): Promise<ActionResult> {
  await requireAdmin()

  try {
    const city = await db.city.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        _count: {
          select: {
            vehicles: true,
          },
        },
      },
    })

    if (!city) {
      return { success: false, message: 'City not found' }
    }

    if (city._count.vehicles > 0) {
      return {
        success: false,
        message: `Cannot delete: ${city._count.vehicles} vehicle(s) reference this city`,
      }
    }

    await db.city.delete({ where: { id } })

    revalidatePath('/admin/settings')
    return { success: true, message: 'City deleted successfully' }
  } catch {
    return { success: false, message: 'Failed to delete city' }
  }
}

// ============================================================================
// PORT ACTIONS
// ============================================================================

export interface PortItem {
  id: string
  name: string
  isDestination: boolean
  stateId: string
  _count: {
    vehicles: number
  }
}

export async function getPortsByState(stateId: string): Promise<PortItem[]> {
  await requireAdmin()

  return db.port.findMany({
    where: { stateId },
    orderBy: { name: 'asc' },
    select: {
      id: true,
      name: true,
      isDestination: true,
      stateId: true,
      _count: {
        select: {
          vehicles: true,
        },
      },
    },
  })
}

export async function createPort(data: PortInput): Promise<ActionResult> {
  await requireAdmin()

  const validation = portSchema.safeParse(data)
  if (!validation.success) {
    return {
      success: false,
      message: validation.error.issues[0]?.message || 'Validation failed',
    }
  }

  const { name, isDestination, stateId } = validation.data

  try {
    // Check if state exists
    const state = await db.state.findUnique({
      where: { id: stateId },
      select: { id: true },
    })

    if (!state) {
      return { success: false, message: 'State not found' }
    }

    await db.port.create({
      data: { name, isDestination, stateId },
    })

    revalidatePath('/admin/settings')
    return { success: true, message: 'Port created successfully' }
  } catch {
    return { success: false, message: 'Failed to create port' }
  }
}

export async function updatePort(id: string, data: PortInput): Promise<ActionResult> {
  await requireAdmin()

  const validation = portSchema.safeParse(data)
  if (!validation.success) {
    return {
      success: false,
      message: validation.error.issues[0]?.message || 'Validation failed',
    }
  }

  const { name, isDestination, stateId } = validation.data

  try {
    const port = await db.port.findUnique({
      where: { id },
      select: { id: true },
    })

    if (!port) {
      return { success: false, message: 'Port not found' }
    }

    // Check if state exists
    const state = await db.state.findUnique({
      where: { id: stateId },
      select: { id: true },
    })

    if (!state) {
      return { success: false, message: 'State not found' }
    }

    await db.port.update({
      where: { id },
      data: { name, isDestination, stateId },
    })

    revalidatePath('/admin/settings')
    return { success: true, message: 'Port updated successfully' }
  } catch {
    return { success: false, message: 'Failed to update port' }
  }
}

export async function deletePort(id: string): Promise<ActionResult> {
  await requireAdmin()

  try {
    const port = await db.port.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        _count: {
          select: {
            vehicles: true,
          },
        },
      },
    })

    if (!port) {
      return { success: false, message: 'Port not found' }
    }

    if (port._count.vehicles > 0) {
      return {
        success: false,
        message: `Cannot delete: ${port._count.vehicles} vehicle(s) reference this port`,
      }
    }

    await db.port.delete({ where: { id } })

    revalidatePath('/admin/settings')
    return { success: true, message: 'Port deleted successfully' }
  } catch {
    return { success: false, message: 'Failed to delete port' }
  }
}

// ============================================================================
// MAKE ACTIONS
// ============================================================================

export interface MakeItem {
  id: string
  name: string
  _count: {
    models: number
    vehicles: number
  }
}

export async function getMakes(): Promise<MakeItem[]> {
  await requireAdmin()

  return db.make.findMany({
    orderBy: { name: 'asc' },
    select: {
      id: true,
      name: true,
      _count: {
        select: {
          models: true,
          vehicles: true,
        },
      },
    },
  })
}

export async function createMake(data: MakeInput): Promise<ActionResult> {
  await requireAdmin()

  const validation = makeSchema.safeParse(data)
  if (!validation.success) {
    return {
      success: false,
      message: validation.error.issues[0]?.message || 'Validation failed',
    }
  }

  const { name } = validation.data

  try {
    // Check for duplicate
    const existing = await db.make.findUnique({
      where: { name },
      select: { id: true },
    })

    if (existing) {
      return { success: false, message: 'A make with this name already exists' }
    }

    await db.make.create({
      data: { name },
    })

    revalidatePath('/admin/settings')
    return { success: true, message: 'Make created successfully' }
  } catch {
    return { success: false, message: 'Failed to create make' }
  }
}

export async function updateMake(id: string, data: MakeInput): Promise<ActionResult> {
  await requireAdmin()

  const validation = makeSchema.safeParse(data)
  if (!validation.success) {
    return {
      success: false,
      message: validation.error.issues[0]?.message || 'Validation failed',
    }
  }

  const { name } = validation.data

  try {
    const make = await db.make.findUnique({
      where: { id },
      select: { id: true, name: true },
    })

    if (!make) {
      return { success: false, message: 'Make not found' }
    }

    // Check for duplicate if changing name
    if (name !== make.name) {
      const existing = await db.make.findUnique({
        where: { name },
        select: { id: true },
      })

      if (existing) {
        return { success: false, message: 'A make with this name already exists' }
      }
    }

    await db.make.update({
      where: { id },
      data: { name },
    })

    revalidatePath('/admin/settings')
    return { success: true, message: 'Make updated successfully' }
  } catch {
    return { success: false, message: 'Failed to update make' }
  }
}

export async function deleteMake(id: string): Promise<ActionResult> {
  await requireAdmin()

  try {
    const make = await db.make.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        _count: {
          select: {
            models: true,
            vehicles: true,
          },
        },
      },
    })

    if (!make) {
      return { success: false, message: 'Make not found' }
    }

    if (make._count.models > 0) {
      return {
        success: false,
        message: `Cannot delete: ${make._count.models} model(s) belong to this make`,
      }
    }

    if (make._count.vehicles > 0) {
      return {
        success: false,
        message: `Cannot delete: ${make._count.vehicles} vehicle(s) reference this make`,
      }
    }

    await db.make.delete({ where: { id } })

    revalidatePath('/admin/settings')
    return { success: true, message: 'Make deleted successfully' }
  } catch {
    return { success: false, message: 'Failed to delete make' }
  }
}

// ============================================================================
// MODEL ACTIONS
// ============================================================================

export interface ModelItem {
  id: string
  name: string
  makeId: string
  _count: {
    vehicles: number
  }
}

export async function getModelsByMake(makeId: string): Promise<ModelItem[]> {
  await requireAdmin()

  return db.model.findMany({
    where: { makeId },
    orderBy: { name: 'asc' },
    select: {
      id: true,
      name: true,
      makeId: true,
      _count: {
        select: {
          vehicles: true,
        },
      },
    },
  })
}

export async function createModel(data: ModelInput): Promise<ActionResult> {
  await requireAdmin()

  const validation = modelSchema.safeParse(data)
  if (!validation.success) {
    return {
      success: false,
      message: validation.error.issues[0]?.message || 'Validation failed',
    }
  }

  const { name, makeId } = validation.data

  try {
    // Check if make exists
    const make = await db.make.findUnique({
      where: { id: makeId },
      select: { id: true },
    })

    if (!make) {
      return { success: false, message: 'Make not found' }
    }

    await db.model.create({
      data: { name, makeId },
    })

    revalidatePath('/admin/settings')
    return { success: true, message: 'Model created successfully' }
  } catch {
    return { success: false, message: 'Failed to create model' }
  }
}

export async function updateModel(id: string, data: ModelInput): Promise<ActionResult> {
  await requireAdmin()

  const validation = modelSchema.safeParse(data)
  if (!validation.success) {
    return {
      success: false,
      message: validation.error.issues[0]?.message || 'Validation failed',
    }
  }

  const { name, makeId } = validation.data

  try {
    const model = await db.model.findUnique({
      where: { id },
      select: { id: true },
    })

    if (!model) {
      return { success: false, message: 'Model not found' }
    }

    // Check if make exists
    const make = await db.make.findUnique({
      where: { id: makeId },
      select: { id: true },
    })

    if (!make) {
      return { success: false, message: 'Make not found' }
    }

    await db.model.update({
      where: { id },
      data: { name, makeId },
    })

    revalidatePath('/admin/settings')
    return { success: true, message: 'Model updated successfully' }
  } catch {
    return { success: false, message: 'Failed to update model' }
  }
}

export async function deleteModel(id: string): Promise<ActionResult> {
  await requireAdmin()

  try {
    const model = await db.model.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        _count: {
          select: {
            vehicles: true,
          },
        },
      },
    })

    if (!model) {
      return { success: false, message: 'Model not found' }
    }

    if (model._count.vehicles > 0) {
      return {
        success: false,
        message: `Cannot delete: ${model._count.vehicles} vehicle(s) reference this model`,
      }
    }

    await db.model.delete({ where: { id } })

    revalidatePath('/admin/settings')
    return { success: true, message: 'Model deleted successfully' }
  } catch {
    return { success: false, message: 'Failed to delete model' }
  }
}

// ============================================================================
// AUCTION ACTIONS
// ============================================================================

export interface AuctionItem {
  id: string
  name: string
  _count: {
    vehicles: number
  }
}

export async function getAuctions(): Promise<AuctionItem[]> {
  await requireAdmin()

  return db.auction.findMany({
    orderBy: { name: 'asc' },
    select: {
      id: true,
      name: true,
      _count: {
        select: {
          vehicles: true,
        },
      },
    },
  })
}

export async function createAuction(data: AuctionInput): Promise<ActionResult> {
  await requireAdmin()

  const validation = auctionSchema.safeParse(data)
  if (!validation.success) {
    return {
      success: false,
      message: validation.error.issues[0]?.message || 'Validation failed',
    }
  }

  const { name } = validation.data

  try {
    // Check for duplicate
    const existing = await db.auction.findUnique({
      where: { name },
      select: { id: true },
    })

    if (existing) {
      return { success: false, message: 'An auction with this name already exists' }
    }

    await db.auction.create({
      data: { name },
    })

    revalidatePath('/admin/settings')
    return { success: true, message: 'Auction created successfully' }
  } catch {
    return { success: false, message: 'Failed to create auction' }
  }
}

export async function updateAuction(id: string, data: AuctionInput): Promise<ActionResult> {
  await requireAdmin()

  const validation = auctionSchema.safeParse(data)
  if (!validation.success) {
    return {
      success: false,
      message: validation.error.issues[0]?.message || 'Validation failed',
    }
  }

  const { name } = validation.data

  try {
    const auction = await db.auction.findUnique({
      where: { id },
      select: { id: true, name: true },
    })

    if (!auction) {
      return { success: false, message: 'Auction not found' }
    }

    // Check for duplicate if changing name
    if (name !== auction.name) {
      const existing = await db.auction.findUnique({
        where: { name },
        select: { id: true },
      })

      if (existing) {
        return { success: false, message: 'An auction with this name already exists' }
      }
    }

    await db.auction.update({
      where: { id },
      data: { name },
    })

    revalidatePath('/admin/settings')
    return { success: true, message: 'Auction updated successfully' }
  } catch {
    return { success: false, message: 'Failed to update auction' }
  }
}

export async function deleteAuction(id: string): Promise<ActionResult> {
  await requireAdmin()

  try {
    const auction = await db.auction.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        _count: {
          select: {
            vehicles: true,
          },
        },
      },
    })

    if (!auction) {
      return { success: false, message: 'Auction not found' }
    }

    if (auction._count.vehicles > 0) {
      return {
        success: false,
        message: `Cannot delete: ${auction._count.vehicles} vehicle(s) reference this auction`,
      }
    }

    await db.auction.delete({ where: { id } })

    revalidatePath('/admin/settings')
    return { success: true, message: 'Auction deleted successfully' }
  } catch {
    return { success: false, message: 'Failed to delete auction' }
  }
}

// ============================================================================
// STATUS ACTIONS
// ============================================================================

export interface StatusItem {
  id: string
  nameKa: string
  nameEn: string
  order: number
  color: string | null
  _count: {
    vehicles: number
  }
}

export async function getStatuses(): Promise<StatusItem[]> {
  await requireAdmin()

  return db.status.findMany({
    orderBy: { order: 'asc' },
    select: {
      id: true,
      nameKa: true,
      nameEn: true,
      order: true,
      color: true,
      _count: {
        select: {
          vehicles: true,
        },
      },
    },
  })
}

export async function createStatus(data: StatusInput): Promise<ActionResult> {
  await requireAdmin()

  const validation = statusSchema.safeParse(data)
  if (!validation.success) {
    return {
      success: false,
      message: validation.error.issues[0]?.message || 'Validation failed',
    }
  }

  const { nameKa, nameEn, order, color } = validation.data

  try {
    await db.status.create({
      data: {
        nameKa,
        nameEn,
        order,
        color: color || null,
      },
    })

    revalidatePath('/admin/settings')
    return { success: true, message: 'Status created successfully' }
  } catch {
    return { success: false, message: 'Failed to create status' }
  }
}

export async function updateStatus(id: string, data: StatusInput): Promise<ActionResult> {
  await requireAdmin()

  const validation = statusSchema.safeParse(data)
  if (!validation.success) {
    return {
      success: false,
      message: validation.error.issues[0]?.message || 'Validation failed',
    }
  }

  const { nameKa, nameEn, order, color } = validation.data

  try {
    const status = await db.status.findUnique({
      where: { id },
      select: { id: true },
    })

    if (!status) {
      return { success: false, message: 'Status not found' }
    }

    await db.status.update({
      where: { id },
      data: {
        nameKa,
        nameEn,
        order,
        color: color || null,
      },
    })

    revalidatePath('/admin/settings')
    return { success: true, message: 'Status updated successfully' }
  } catch {
    return { success: false, message: 'Failed to update status' }
  }
}

export async function deleteStatus(id: string): Promise<ActionResult> {
  await requireAdmin()

  try {
    const status = await db.status.findUnique({
      where: { id },
      select: {
        id: true,
        nameEn: true,
        _count: {
          select: {
            vehicles: true,
          },
        },
      },
    })

    if (!status) {
      return { success: false, message: 'Status not found' }
    }

    if (status._count.vehicles > 0) {
      return {
        success: false,
        message: `Cannot delete: ${status._count.vehicles} vehicle(s) have this status`,
      }
    }

    await db.status.delete({ where: { id } })

    revalidatePath('/admin/settings')
    return { success: true, message: 'Status deleted successfully' }
  } catch {
    return { success: false, message: 'Failed to delete status' }
  }
}

export async function updateStatusOrder(data: StatusOrderInput): Promise<ActionResult> {
  await requireAdmin()

  const validation = statusOrderSchema.safeParse(data)
  if (!validation.success) {
    return {
      success: false,
      message: validation.error.issues[0]?.message || 'Validation failed',
    }
  }

  const { orderedIds } = validation.data

  try {
    // Update each status with its new order
    await db.$transaction(
      orderedIds.map((id, index) =>
        db.status.update({
          where: { id },
          data: { order: index + 1 },
        })
      )
    )

    revalidatePath('/admin/settings')
    return { success: true, message: 'Status order updated successfully' }
  } catch {
    return { success: false, message: 'Failed to update status order' }
  }
}

// ============================================================================
// TOWING PRICE ACTIONS
// ============================================================================

export interface TowingPriceItem {
  id: string
  price: number
  cityId: string
  portId: string
  city: {
    id: string
    name: string
    state: {
      id: string
      nameEn: string
      country: {
        id: string
        nameEn: string
      }
    }
  }
  port: {
    id: string
    name: string
    state: {
      id: string
      nameEn: string
    }
  }
}

export async function getTowingPrices(): Promise<TowingPriceItem[]> {
  await requireAdmin()

  const prices = await db.towingPrice.findMany({
    orderBy: [{ city: { name: 'asc' } }, { port: { name: 'asc' } }],
    select: {
      id: true,
      price: true,
      cityId: true,
      portId: true,
      city: {
        select: {
          id: true,
          name: true,
          state: {
            select: {
              id: true,
              nameEn: true,
              country: {
                select: {
                  id: true,
                  nameEn: true,
                },
              },
            },
          },
        },
      },
      port: {
        select: {
          id: true,
          name: true,
          state: {
            select: {
              id: true,
              nameEn: true,
            },
          },
        },
      },
    },
  })

  return prices.map((p) => ({
    ...p,
    price: Number(p.price),
  }))
}

export async function createTowingPrice(data: TowingPriceInput): Promise<ActionResult> {
  await requireAdmin()

  const validation = towingPriceSchema.safeParse(data)
  if (!validation.success) {
    return {
      success: false,
      message: validation.error.issues[0]?.message || 'Validation failed',
    }
  }

  const { price, cityId, portId } = validation.data

  try {
    // Check for duplicate
    const existing = await db.towingPrice.findUnique({
      where: { cityId_portId: { cityId, portId } },
      select: { id: true },
    })

    if (existing) {
      return { success: false, message: 'A towing price for this city-port combination already exists' }
    }

    await db.towingPrice.create({
      data: { price, cityId, portId },
    })

    revalidatePath('/admin/settings')
    return { success: true, message: 'Towing price created successfully' }
  } catch {
    return { success: false, message: 'Failed to create towing price' }
  }
}

export async function updateTowingPrice(id: string, data: TowingPriceInput): Promise<ActionResult> {
  await requireAdmin()

  const validation = towingPriceSchema.safeParse(data)
  if (!validation.success) {
    return {
      success: false,
      message: validation.error.issues[0]?.message || 'Validation failed',
    }
  }

  const { price, cityId, portId } = validation.data

  try {
    const towingPrice = await db.towingPrice.findUnique({
      where: { id },
      select: { id: true, cityId: true, portId: true },
    })

    if (!towingPrice) {
      return { success: false, message: 'Towing price not found' }
    }

    // Check for duplicate if changing city or port
    if (cityId !== towingPrice.cityId || portId !== towingPrice.portId) {
      const existing = await db.towingPrice.findUnique({
        where: { cityId_portId: { cityId, portId } },
        select: { id: true },
      })

      if (existing) {
        return { success: false, message: 'A towing price for this city-port combination already exists' }
      }
    }

    await db.towingPrice.update({
      where: { id },
      data: { price, cityId, portId },
    })

    revalidatePath('/admin/settings')
    return { success: true, message: 'Towing price updated successfully' }
  } catch {
    return { success: false, message: 'Failed to update towing price' }
  }
}

export async function deleteTowingPrice(id: string): Promise<ActionResult> {
  await requireAdmin()

  try {
    const towingPrice = await db.towingPrice.findUnique({
      where: { id },
      select: { id: true },
    })

    if (!towingPrice) {
      return { success: false, message: 'Towing price not found' }
    }

    await db.towingPrice.delete({ where: { id } })

    revalidatePath('/admin/settings')
    return { success: true, message: 'Towing price deleted successfully' }
  } catch {
    return { success: false, message: 'Failed to delete towing price' }
  }
}

// ============================================================================
// SHIPPING PRICE ACTIONS
// ============================================================================

export interface ShippingPriceItem {
  id: string
  price: number
  originPortId: string
  destinationPortId: string
  originPort: {
    id: string
    name: string
    state: {
      id: string
      nameEn: string
      country: {
        id: string
        nameEn: string
      }
    }
  }
  destinationPort: {
    id: string
    name: string
    state: {
      id: string
      nameEn: string
      country: {
        id: string
        nameEn: string
      }
    }
  }
}

export async function getShippingPrices(): Promise<ShippingPriceItem[]> {
  await requireAdmin()

  const prices = await db.shippingPrice.findMany({
    orderBy: [{ originPort: { name: 'asc' } }, { destinationPort: { name: 'asc' } }],
    select: {
      id: true,
      price: true,
      originPortId: true,
      destinationPortId: true,
      originPort: {
        select: {
          id: true,
          name: true,
          state: {
            select: {
              id: true,
              nameEn: true,
              country: {
                select: {
                  id: true,
                  nameEn: true,
                },
              },
            },
          },
        },
      },
      destinationPort: {
        select: {
          id: true,
          name: true,
          state: {
            select: {
              id: true,
              nameEn: true,
              country: {
                select: {
                  id: true,
                  nameEn: true,
                },
              },
            },
          },
        },
      },
    },
  })

  return prices.map((p) => ({
    ...p,
    price: Number(p.price),
  }))
}

export async function createShippingPrice(data: ShippingPriceInput): Promise<ActionResult> {
  await requireAdmin()

  const validation = shippingPriceSchema.safeParse(data)
  if (!validation.success) {
    return {
      success: false,
      message: validation.error.issues[0]?.message || 'Validation failed',
    }
  }

  const { price, originPortId, destinationPortId } = validation.data

  try {
    // Check for duplicate
    const existing = await db.shippingPrice.findUnique({
      where: { originPortId_destinationPortId: { originPortId, destinationPortId } },
      select: { id: true },
    })

    if (existing) {
      return { success: false, message: 'A shipping price for this port combination already exists' }
    }

    await db.shippingPrice.create({
      data: { price, originPortId, destinationPortId },
    })

    revalidatePath('/admin/settings')
    return { success: true, message: 'Shipping price created successfully' }
  } catch {
    return { success: false, message: 'Failed to create shipping price' }
  }
}

export async function updateShippingPrice(id: string, data: ShippingPriceInput): Promise<ActionResult> {
  await requireAdmin()

  const validation = shippingPriceSchema.safeParse(data)
  if (!validation.success) {
    return {
      success: false,
      message: validation.error.issues[0]?.message || 'Validation failed',
    }
  }

  const { price, originPortId, destinationPortId } = validation.data

  try {
    const shippingPrice = await db.shippingPrice.findUnique({
      where: { id },
      select: { id: true, originPortId: true, destinationPortId: true },
    })

    if (!shippingPrice) {
      return { success: false, message: 'Shipping price not found' }
    }

    // Check for duplicate if changing ports
    if (originPortId !== shippingPrice.originPortId || destinationPortId !== shippingPrice.destinationPortId) {
      const existing = await db.shippingPrice.findUnique({
        where: { originPortId_destinationPortId: { originPortId, destinationPortId } },
        select: { id: true },
      })

      if (existing) {
        return { success: false, message: 'A shipping price for this port combination already exists' }
      }
    }

    await db.shippingPrice.update({
      where: { id },
      data: { price, originPortId, destinationPortId },
    })

    revalidatePath('/admin/settings')
    return { success: true, message: 'Shipping price updated successfully' }
  } catch {
    return { success: false, message: 'Failed to update shipping price' }
  }
}

export async function deleteShippingPrice(id: string): Promise<ActionResult> {
  await requireAdmin()

  try {
    const shippingPrice = await db.shippingPrice.findUnique({
      where: { id },
      select: { id: true },
    })

    if (!shippingPrice) {
      return { success: false, message: 'Shipping price not found' }
    }

    await db.shippingPrice.delete({ where: { id } })

    revalidatePath('/admin/settings')
    return { success: true, message: 'Shipping price deleted successfully' }
  } catch {
    return { success: false, message: 'Failed to delete shipping price' }
  }
}

// ============================================================================
// INSURANCE PRICE ACTIONS
// ============================================================================

export interface InsurancePriceItem {
  id: string
  minValue: number
  maxValue: number
  price: number
}

export async function getInsurancePrices(): Promise<InsurancePriceItem[]> {
  await requireAdmin()

  const prices = await db.insurancePrice.findMany({
    orderBy: { minValue: 'asc' },
    select: {
      id: true,
      minValue: true,
      maxValue: true,
      price: true,
    },
  })

  return prices.map((p) => ({
    id: p.id,
    minValue: Number(p.minValue),
    maxValue: Number(p.maxValue),
    price: Number(p.price),
  }))
}

export async function createInsurancePrice(data: InsurancePriceInput): Promise<ActionResult> {
  await requireAdmin()

  const validation = insurancePriceSchema.safeParse(data)
  if (!validation.success) {
    return {
      success: false,
      message: validation.error.issues[0]?.message || 'Validation failed',
    }
  }

  const { minValue, maxValue, price } = validation.data

  try {
    // Check for overlapping ranges
    const overlapping = await db.insurancePrice.findFirst({
      where: {
        OR: [
          { AND: [{ minValue: { lte: minValue } }, { maxValue: { gte: minValue } }] },
          { AND: [{ minValue: { lte: maxValue } }, { maxValue: { gte: maxValue } }] },
          { AND: [{ minValue: { gte: minValue } }, { maxValue: { lte: maxValue } }] },
        ],
      },
      select: { id: true },
    })

    if (overlapping) {
      return { success: false, message: 'This value range overlaps with an existing insurance price' }
    }

    await db.insurancePrice.create({
      data: { minValue, maxValue, price },
    })

    revalidatePath('/admin/settings')
    return { success: true, message: 'Insurance price created successfully' }
  } catch {
    return { success: false, message: 'Failed to create insurance price' }
  }
}

export async function updateInsurancePrice(id: string, data: InsurancePriceInput): Promise<ActionResult> {
  await requireAdmin()

  const validation = insurancePriceSchema.safeParse(data)
  if (!validation.success) {
    return {
      success: false,
      message: validation.error.issues[0]?.message || 'Validation failed',
    }
  }

  const { minValue, maxValue, price } = validation.data

  try {
    const insurancePrice = await db.insurancePrice.findUnique({
      where: { id },
      select: { id: true },
    })

    if (!insurancePrice) {
      return { success: false, message: 'Insurance price not found' }
    }

    // Check for overlapping ranges (excluding current record)
    const overlapping = await db.insurancePrice.findFirst({
      where: {
        id: { not: id },
        OR: [
          { AND: [{ minValue: { lte: minValue } }, { maxValue: { gte: minValue } }] },
          { AND: [{ minValue: { lte: maxValue } }, { maxValue: { gte: maxValue } }] },
          { AND: [{ minValue: { gte: minValue } }, { maxValue: { lte: maxValue } }] },
        ],
      },
      select: { id: true },
    })

    if (overlapping) {
      return { success: false, message: 'This value range overlaps with an existing insurance price' }
    }

    await db.insurancePrice.update({
      where: { id },
      data: { minValue, maxValue, price },
    })

    revalidatePath('/admin/settings')
    return { success: true, message: 'Insurance price updated successfully' }
  } catch {
    return { success: false, message: 'Failed to update insurance price' }
  }
}

export async function deleteInsurancePrice(id: string): Promise<ActionResult> {
  await requireAdmin()

  try {
    const insurancePrice = await db.insurancePrice.findUnique({
      where: { id },
      select: { id: true },
    })

    if (!insurancePrice) {
      return { success: false, message: 'Insurance price not found' }
    }

    await db.insurancePrice.delete({ where: { id } })

    revalidatePath('/admin/settings')
    return { success: true, message: 'Insurance price deleted successfully' }
  } catch {
    return { success: false, message: 'Failed to delete insurance price' }
  }
}

// ============================================================================
// SYSTEM SETTINGS ACTIONS
// ============================================================================

export interface SystemSettingItem {
  id: string
  key: string
  value: string
}

export async function getSystemSettings(): Promise<SystemSettingItem[]> {
  await requireAdmin()

  return db.systemSettings.findMany({
    orderBy: { key: 'asc' },
    select: {
      id: true,
      key: true,
      value: true,
    },
  })
}

export async function getSystemSetting(key: string): Promise<string | null> {
  await requireAdmin()

  const setting = await db.systemSettings.findUnique({
    where: { key },
    select: { value: true },
  })

  return setting?.value ?? null
}

export async function upsertSystemSetting(data: SystemSettingInput): Promise<ActionResult> {
  await requireAdmin()

  const validation = systemSettingSchema.safeParse(data)
  if (!validation.success) {
    return {
      success: false,
      message: validation.error.issues[0]?.message || 'Validation failed',
    }
  }

  const { key, value } = validation.data

  try {
    await db.systemSettings.upsert({
      where: { key },
      update: { value },
      create: { key, value },
    })

    revalidatePath('/admin/settings')
    return { success: true, message: 'Setting saved successfully' }
  } catch {
    return { success: false, message: 'Failed to save setting' }
  }
}

export async function deleteSystemSetting(key: string): Promise<ActionResult> {
  await requireAdmin()

  try {
    const setting = await db.systemSettings.findUnique({
      where: { key },
      select: { id: true },
    })

    if (!setting) {
      return { success: false, message: 'Setting not found' }
    }

    await db.systemSettings.delete({ where: { key } })

    revalidatePath('/admin/settings')
    return { success: true, message: 'Setting deleted successfully' }
  } catch {
    return { success: false, message: 'Failed to delete setting' }
  }
}

// ============================================================================
// HELPER ACTIONS FOR CALCULATOR DROPDOWNS
// ============================================================================

export interface CityOption {
  id: string
  name: string
  stateName: string
  countryName: string
}

export interface PortOption {
  id: string
  name: string
  stateName: string
  countryName: string
  isDestination: boolean
}

export async function getAllCities(): Promise<CityOption[]> {
  await requireAdmin()

  const cities = await db.city.findMany({
    orderBy: [{ state: { country: { nameEn: 'asc' } } }, { state: { nameEn: 'asc' } }, { name: 'asc' }],
    select: {
      id: true,
      name: true,
      state: {
        select: {
          nameEn: true,
          country: {
            select: {
              nameEn: true,
            },
          },
        },
      },
    },
  })

  return cities.map((c) => ({
    id: c.id,
    name: c.name,
    stateName: c.state.nameEn,
    countryName: c.state.country.nameEn,
  }))
}

export async function getAllPorts(): Promise<PortOption[]> {
  await requireAdmin()

  const ports = await db.port.findMany({
    orderBy: [{ state: { country: { nameEn: 'asc' } } }, { state: { nameEn: 'asc' } }, { name: 'asc' }],
    select: {
      id: true,
      name: true,
      isDestination: true,
      state: {
        select: {
          nameEn: true,
          country: {
            select: {
              nameEn: true,
            },
          },
        },
      },
    },
  })

  return ports.map((p) => ({
    id: p.id,
    name: p.name,
    isDestination: p.isDestination,
    stateName: p.state.nameEn,
    countryName: p.state.country.nameEn,
  }))
}
