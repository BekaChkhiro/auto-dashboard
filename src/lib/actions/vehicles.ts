'use server'

import { db } from '@/lib/db'
import { requireAdmin } from '@/lib/auth'
import { revalidatePath } from 'next/cache'
import {
  createVehicleSchema,
  updateVehicleSchema,
  commentSchema,
  type CreateVehicleInput,
  type UpdateVehicleInput,
} from '@/lib/validations/vehicle'
import type { DamageType, PhotoStage } from '@/generated/prisma'
import { deleteObject, getKeyFromUrl } from '@/lib/r2'

export interface VehicleListParams {
  search?: string
  statusId?: string
  dealerId?: string
  makeId?: string
  year?: string
  portId?: string
  showArchived?: boolean
  sortBy?: 'createdAt' | 'year' | 'vin' | 'lotNumber'
  sortOrder?: 'asc' | 'desc'
  page?: number
  pageSize?: number
}

export interface VehicleListItem {
  id: string
  vin: string
  year: number
  color: string | null
  lotNumber: string
  make: {
    id: string
    name: string
  }
  model: {
    id: string
    name: string
  }
  status: {
    id: string
    nameEn: string
    nameKa: string
    color: string | null
  }
  dealer: {
    id: string
    name: string
  }
  isArchived: boolean
  createdAt: Date
}

export interface VehiclesResult {
  vehicles: VehicleListItem[]
  totalCount: number
  totalPages: number
  currentPage: number
}

export async function getVehicles(params: VehicleListParams = {}): Promise<VehiclesResult> {
  await requireAdmin()

  const {
    search = '',
    statusId,
    dealerId,
    makeId,
    year,
    portId,
    showArchived = false,
    sortBy = 'createdAt',
    sortOrder = 'desc',
    page = 1,
    pageSize = 10,
  } = params

  // Build where clause
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: any = {
    isArchived: showArchived,
  }

  // Status filter
  if (statusId) {
    where.statusId = statusId
  }

  // Dealer filter
  if (dealerId) {
    where.dealerId = dealerId
  }

  // Make filter
  if (makeId) {
    where.makeId = makeId
  }

  // Year filter
  if (year) {
    const yearInt = parseInt(year, 10)
    if (!isNaN(yearInt)) {
      where.year = yearInt
    }
  }

  // Port filter
  if (portId) {
    where.portId = portId
  }

  // Search filter (VIN or lot number)
  if (search.trim()) {
    where.OR = [
      { vin: { contains: search.trim(), mode: 'insensitive' } },
      { lotNumber: { contains: search.trim(), mode: 'insensitive' } },
    ]
  }

  // Build orderBy
  const orderBy: Record<string, 'asc' | 'desc'> = {}
  orderBy[sortBy] = sortOrder

  // Get total count
  const totalCount = await db.vehicle.count({ where })

  // Calculate pagination
  const totalPages = Math.ceil(totalCount / pageSize)
  const skip = (page - 1) * pageSize

  // Fetch vehicles with relations
  const vehicles = await db.vehicle.findMany({
    where,
    orderBy,
    skip,
    take: pageSize,
    select: {
      id: true,
      vin: true,
      year: true,
      color: true,
      lotNumber: true,
      isArchived: true,
      createdAt: true,
      make: {
        select: {
          id: true,
          name: true,
        },
      },
      model: {
        select: {
          id: true,
          name: true,
        },
      },
      status: {
        select: {
          id: true,
          nameEn: true,
          nameKa: true,
          color: true,
        },
      },
      dealer: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  })

  return {
    vehicles: vehicles.map((vehicle) => ({
      id: vehicle.id,
      vin: vehicle.vin,
      year: vehicle.year,
      color: vehicle.color,
      lotNumber: vehicle.lotNumber,
      make: vehicle.make,
      model: vehicle.model,
      status: vehicle.status,
      dealer: vehicle.dealer,
      isArchived: vehicle.isArchived,
      createdAt: vehicle.createdAt,
    })),
    totalCount,
    totalPages,
    currentPage: page,
  }
}

// Get filter options for the vehicles list
export interface VehicleFilterOptions {
  statuses: Array<{ id: string; nameEn: string; nameKa: string }>
  dealers: Array<{ id: string; name: string }>
  makes: Array<{ id: string; name: string }>
  years: number[]
}

export async function getVehicleFilterOptions(): Promise<VehicleFilterOptions> {
  await requireAdmin()

  const [statuses, dealers, makes, yearsResult] = await Promise.all([
    db.status.findMany({
      select: { id: true, nameEn: true, nameKa: true },
      orderBy: { order: 'asc' },
    }),
    db.user.findMany({
      where: { role: 'DEALER' },
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
    }),
    db.make.findMany({
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
    }),
    db.vehicle.findMany({
      where: { isArchived: false },
      select: { year: true },
      distinct: ['year'],
      orderBy: { year: 'desc' },
    }),
  ])

  return {
    statuses,
    dealers,
    makes,
    years: yearsResult.map((v) => v.year),
  }
}

export interface ArchiveVehicleResult {
  success: boolean
  message: string
}

export async function archiveVehicle(vehicleId: string): Promise<ArchiveVehicleResult> {
  await requireAdmin()

  try {
    const vehicle = await db.vehicle.findUnique({
      where: { id: vehicleId },
      select: { id: true, vin: true, isArchived: true },
    })

    if (!vehicle) {
      return { success: false, message: 'Vehicle not found' }
    }

    await db.vehicle.update({
      where: { id: vehicleId },
      data: {
        isArchived: true,
        archivedAt: new Date(),
      },
    })

    revalidatePath('/admin/vehicles')

    return {
      success: true,
      message: `Vehicle ${vehicle.vin} has been archived`,
    }
  } catch {
    return { success: false, message: 'Failed to archive vehicle' }
  }
}

export async function restoreVehicle(vehicleId: string): Promise<ArchiveVehicleResult> {
  await requireAdmin()

  try {
    const vehicle = await db.vehicle.findUnique({
      where: { id: vehicleId },
      select: { id: true, vin: true, isArchived: true },
    })

    if (!vehicle) {
      return { success: false, message: 'Vehicle not found' }
    }

    await db.vehicle.update({
      where: { id: vehicleId },
      data: {
        isArchived: false,
        archivedAt: null,
      },
    })

    revalidatePath('/admin/vehicles')

    return {
      success: true,
      message: `Vehicle ${vehicle.vin} has been restored`,
    }
  } catch {
    return { success: false, message: 'Failed to restore vehicle' }
  }
}

// ============================================================================
// VEHICLE FORM OPTIONS
// ============================================================================

export interface VehicleFormOptions {
  dealers: Array<{ id: string; name: string }>
  makes: Array<{ id: string; name: string }>
  auctions: Array<{ id: string; name: string }>
  statuses: Array<{ id: string; nameEn: string; nameKa: string }>
  countries: Array<{ id: string; nameEn: string; nameKa: string; code: string }>
}

export async function getVehicleFormOptions(): Promise<VehicleFormOptions> {
  await requireAdmin()

  const [dealers, makes, auctions, statuses, countries] = await Promise.all([
    db.user.findMany({
      where: { role: 'DEALER', status: 'ACTIVE' },
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
    }),
    db.make.findMany({
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
    }),
    db.auction.findMany({
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
    }),
    db.status.findMany({
      select: { id: true, nameEn: true, nameKa: true },
      orderBy: { order: 'asc' },
    }),
    db.country.findMany({
      select: { id: true, nameEn: true, nameKa: true, code: true },
      orderBy: { nameEn: 'asc' },
    }),
  ])

  return { dealers, makes, auctions, statuses, countries }
}

// ============================================================================
// CASCADING DATA FETCHERS
// ============================================================================

export interface ModelOption {
  id: string
  name: string
}

export async function getModelsByMake(makeId: string): Promise<ModelOption[]> {
  await requireAdmin()

  if (!makeId) return []

  return db.model.findMany({
    where: { makeId },
    select: { id: true, name: true },
    orderBy: { name: 'asc' },
  })
}

export interface StateOption {
  id: string
  nameEn: string
  nameKa: string
  code: string
}

export async function getStatesByCountry(countryId: string): Promise<StateOption[]> {
  await requireAdmin()

  if (!countryId) return []

  return db.state.findMany({
    where: { countryId },
    select: { id: true, nameEn: true, nameKa: true, code: true },
    orderBy: { nameEn: 'asc' },
  })
}

export interface CityOption {
  id: string
  name: string
}

export async function getCitiesByState(stateId: string): Promise<CityOption[]> {
  await requireAdmin()

  if (!stateId) return []

  return db.city.findMany({
    where: { stateId },
    select: { id: true, name: true },
    orderBy: { name: 'asc' },
  })
}

export interface PortOption {
  id: string
  name: string
}

export async function getPortsByState(stateId: string): Promise<PortOption[]> {
  await requireAdmin()

  if (!stateId) return []

  return db.port.findMany({
    where: { stateId },
    select: { id: true, name: true },
    orderBy: { name: 'asc' },
  })
}

// ============================================================================
// CREATE VEHICLE
// ============================================================================

export interface CreateVehicleResult {
  success: boolean
  message: string
  vehicleId?: string
}

export async function createVehicle(data: CreateVehicleInput): Promise<CreateVehicleResult> {
  await requireAdmin()

  // Validate input
  const parsed = createVehicleSchema.safeParse(data)
  if (!parsed.success) {
    return {
      success: false,
      message: parsed.error.issues[0]?.message || 'Invalid input',
    }
  }

  const input = parsed.data

  try {
    // Check VIN uniqueness
    const existingVehicle = await db.vehicle.findUnique({
      where: { vin: input.vin.toUpperCase() },
      select: { id: true },
    })

    if (existingVehicle) {
      return {
        success: false,
        message: 'A vehicle with this VIN already exists',
      }
    }

    // Create vehicle
    const vehicle = await db.vehicle.create({
      data: {
        vin: input.vin.toUpperCase(),
        year: input.year,
        color: input.color || null,
        lotNumber: input.lotNumber,
        auctionLink: input.auctionLink || null,
        damageType: input.damageType as DamageType,
        hasKeys: input.hasKeys,
        transportationPrice: input.transportationPrice,
        shipName: input.shipName || null,
        containerNumber: input.containerNumber || null,
        eta: input.eta ? new Date(input.eta) : null,
        dealerId: input.dealerId,
        makeId: input.makeId,
        modelId: input.modelId,
        auctionId: input.auctionId,
        statusId: input.statusId,
        countryId: input.countryId,
        stateId: input.stateId,
        cityId: input.cityId || null,
        portId: input.portId || null,
      },
    })

    revalidatePath('/admin/vehicles')

    return {
      success: true,
      message: 'Vehicle created successfully',
      vehicleId: vehicle.id,
    }
  } catch (error) {
    console.error('Failed to create vehicle:', error)
    return {
      success: false,
      message: 'Failed to create vehicle',
    }
  }
}

// ============================================================================
// GET VEHICLE BY ID
// ============================================================================

export interface VehiclePhoto {
  id: string
  url: string
  stage: PhotoStage
  order: number
  createdAt: Date
}

export interface VehicleStatusHistoryItem {
  id: string
  changedAt: Date
  status: {
    id: string
    nameEn: string
    nameKa: string
    color: string | null
  }
  changedBy: {
    id: string
    name: string
  }
}

export interface VehicleCommentItem {
  id: string
  content: string
  createdAt: Date
  user: {
    id: string
    name: string
  }
}

export interface VehicleDetail {
  id: string
  vin: string
  year: number
  color: string | null
  lotNumber: string
  auctionLink: string | null
  damageType: DamageType
  hasKeys: boolean
  shipName: string | null
  containerNumber: string | null
  eta: Date | null
  transportationPrice: number
  isArchived: boolean
  archivedAt: Date | null
  createdAt: Date
  updatedAt: Date
  make: { id: string; name: string }
  model: { id: string; name: string }
  auction: { id: string; name: string }
  status: { id: string; nameEn: string; nameKa: string; color: string | null }
  dealer: { id: string; name: string; email: string }
  country: { id: string; nameEn: string; nameKa: string; code: string }
  state: { id: string; nameEn: string; nameKa: string; code: string }
  city: { id: string; name: string } | null
  port: { id: string; name: string } | null
  photos: VehiclePhoto[]
  statusHistory: VehicleStatusHistoryItem[]
  comments: VehicleCommentItem[]
}

export async function getVehicleById(id: string): Promise<VehicleDetail | null> {
  await requireAdmin()

  const vehicle = await db.vehicle.findUnique({
    where: { id },
    include: {
      make: { select: { id: true, name: true } },
      model: { select: { id: true, name: true } },
      auction: { select: { id: true, name: true } },
      status: { select: { id: true, nameEn: true, nameKa: true, color: true } },
      dealer: { select: { id: true, name: true, email: true } },
      country: { select: { id: true, nameEn: true, nameKa: true, code: true } },
      state: { select: { id: true, nameEn: true, nameKa: true, code: true } },
      city: { select: { id: true, name: true } },
      port: { select: { id: true, name: true } },
      photos: {
        orderBy: [{ stage: 'asc' }, { order: 'asc' }],
      },
      statusHistory: {
        orderBy: { changedAt: 'desc' },
        include: {
          status: { select: { id: true, nameEn: true, nameKa: true, color: true } },
          changedBy: { select: { id: true, name: true } },
        },
      },
      comments: {
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { id: true, name: true } },
        },
      },
    },
  })

  if (!vehicle) return null

  return {
    ...vehicle,
    transportationPrice: Number(vehicle.transportationPrice),
  }
}

// ============================================================================
// UPDATE VEHICLE
// ============================================================================

export interface UpdateVehicleResult {
  success: boolean
  message: string
}

export async function updateVehicle(
  id: string,
  data: UpdateVehicleInput
): Promise<UpdateVehicleResult> {
  const session = await requireAdmin()

  // Validate input
  const parsed = updateVehicleSchema.safeParse(data)
  if (!parsed.success) {
    return {
      success: false,
      message: parsed.error.issues[0]?.message || 'Invalid input',
    }
  }

  const input = parsed.data

  try {
    // Check if vehicle exists
    const existingVehicle = await db.vehicle.findUnique({
      where: { id },
      select: { id: true, vin: true, statusId: true },
    })

    if (!existingVehicle) {
      return { success: false, message: 'Vehicle not found' }
    }

    // Check VIN uniqueness (if changed)
    if (input.vin.toUpperCase() !== existingVehicle.vin) {
      const vinExists = await db.vehicle.findUnique({
        where: { vin: input.vin.toUpperCase() },
        select: { id: true },
      })
      if (vinExists) {
        return { success: false, message: 'A vehicle with this VIN already exists' }
      }
    }

    // Check if status changed
    const statusChanged = existingVehicle.statusId !== input.statusId

    // Update vehicle
    await db.vehicle.update({
      where: { id },
      data: {
        vin: input.vin.toUpperCase(),
        year: input.year,
        color: input.color || null,
        lotNumber: input.lotNumber,
        auctionLink: input.auctionLink || null,
        damageType: input.damageType as DamageType,
        hasKeys: input.hasKeys,
        transportationPrice: input.transportationPrice,
        shipName: input.shipName || null,
        containerNumber: input.containerNumber || null,
        eta: input.eta ? new Date(input.eta) : null,
        dealerId: input.dealerId,
        makeId: input.makeId,
        modelId: input.modelId,
        auctionId: input.auctionId,
        statusId: input.statusId,
        countryId: input.countryId,
        stateId: input.stateId,
        cityId: input.cityId || null,
        portId: input.portId || null,
      },
    })

    // Create status history entry if status changed
    if (statusChanged) {
      await db.vehicleStatusHistory.create({
        data: {
          vehicleId: id,
          statusId: input.statusId,
          changedById: session.user.id,
        },
      })
    }

    revalidatePath('/admin/vehicles')
    revalidatePath(`/admin/vehicles/${id}`)

    return {
      success: true,
      message: 'Vehicle updated successfully',
    }
  } catch (error) {
    console.error('Failed to update vehicle:', error)
    return {
      success: false,
      message: 'Failed to update vehicle',
    }
  }
}

// ============================================================================
// CHANGE VEHICLE STATUS
// ============================================================================

export async function changeVehicleStatus(
  vehicleId: string,
  statusId: string
): Promise<{ success: boolean; message: string }> {
  const session = await requireAdmin()

  try {
    // Fetch vehicle with dealer and current status info
    const vehicle = await db.vehicle.findUnique({
      where: { id: vehicleId },
      select: {
        id: true,
        vin: true,
        statusId: true,
        dealerId: true,
        status: {
          select: { id: true, nameEn: true, nameKa: true },
        },
      },
    })

    if (!vehicle) {
      return { success: false, message: 'Vehicle not found' }
    }

    // Check if status is different
    if (vehicle.statusId === statusId) {
      return { success: false, message: 'Status is already set to this value' }
    }

    // Fetch new status with bilingual names
    const newStatus = await db.status.findUnique({
      where: { id: statusId },
      select: { id: true, nameEn: true, nameKa: true },
    })

    if (!newStatus) {
      return { success: false, message: 'Status not found' }
    }

    const oldStatus = vehicle.status

    // Atomic transaction: update + history + audit + notification
    await db.$transaction([
      db.vehicle.update({
        where: { id: vehicleId },
        data: { statusId },
      }),
      db.vehicleStatusHistory.create({
        data: {
          vehicleId,
          statusId,
          changedById: session.user.id,
        },
      }),
      db.auditLog.create({
        data: {
          userId: session.user.id,
          action: 'STATUS_CHANGE',
          entityType: 'Vehicle',
          entityId: vehicleId,
          oldData: {
            statusId: oldStatus.id,
            statusNameEn: oldStatus.nameEn,
            statusNameKa: oldStatus.nameKa,
          },
          newData: {
            statusId: newStatus.id,
            statusNameEn: newStatus.nameEn,
            statusNameKa: newStatus.nameKa,
          },
        },
      }),
      db.notification.create({
        data: {
          userId: vehicle.dealerId,
          type: 'STATUS_CHANGE',
          titleEn: 'Vehicle Status Updated',
          titleKa: 'მანქანის სტატუსი განახლდა',
          messageEn: `Your vehicle ${vehicle.vin} status changed from "${oldStatus.nameEn}" to "${newStatus.nameEn}"`,
          messageKa: `თქვენი მანქანის ${vehicle.vin} სტატუსი შეიცვალა "${oldStatus.nameKa}"-დან "${newStatus.nameKa}"-მდე`,
          referenceType: 'Vehicle',
          referenceId: vehicleId,
        },
      }),
    ])

    revalidatePath('/admin/vehicles')
    revalidatePath(`/admin/vehicles/${vehicleId}`)

    return {
      success: true,
      message: `Status changed to ${newStatus.nameEn}`,
    }
  } catch (error) {
    console.error('Failed to change vehicle status:', error)
    return { success: false, message: 'Failed to change status' }
  }
}

// ============================================================================
// ADD VEHICLE COMMENT
// ============================================================================

export async function addVehicleComment(
  vehicleId: string,
  content: string
): Promise<{ success: boolean; message: string }> {
  const session = await requireAdmin()

  // Validate content
  const parsed = commentSchema.safeParse({ content })
  if (!parsed.success) {
    return {
      success: false,
      message: parsed.error.issues[0]?.message || 'Invalid comment',
    }
  }

  try {
    const vehicle = await db.vehicle.findUnique({
      where: { id: vehicleId },
      select: { id: true },
    })

    if (!vehicle) {
      return { success: false, message: 'Vehicle not found' }
    }

    await db.vehicleComment.create({
      data: {
        vehicleId,
        userId: session.user.id,
        content: parsed.data.content,
      },
    })

    revalidatePath(`/admin/vehicles/${vehicleId}`)

    return {
      success: true,
      message: 'Comment added successfully',
    }
  } catch (error) {
    console.error('Failed to add comment:', error)
    return { success: false, message: 'Failed to add comment' }
  }
}

// ============================================================================
// DELETE VEHICLE PHOTO
// ============================================================================

export async function deleteVehiclePhoto(
  photoId: string
): Promise<{ success: boolean; message: string }> {
  await requireAdmin()

  try {
    const photo = await db.vehiclePhoto.findUnique({
      where: { id: photoId },
      select: { id: true, url: true, vehicleId: true },
    })

    if (!photo) {
      return { success: false, message: 'Photo not found' }
    }

    // Extract key from URL and delete from R2
    const key = getKeyFromUrl(photo.url)
    if (key) {
      try {
        await deleteObject(key)
      } catch (error) {
        console.error('Failed to delete photo from R2:', error)
        // Continue with database deletion even if R2 delete fails
      }
    }

    // Delete from database
    await db.vehiclePhoto.delete({
      where: { id: photoId },
    })

    revalidatePath(`/admin/vehicles/${photo.vehicleId}`)
    revalidatePath(`/admin/vehicles/${photo.vehicleId}/edit`)

    return {
      success: true,
      message: 'Photo deleted successfully',
    }
  } catch (error) {
    console.error('Failed to delete photo:', error)
    return { success: false, message: 'Failed to delete photo' }
  }
}
