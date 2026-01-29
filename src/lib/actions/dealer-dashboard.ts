'use server'

import { db } from '@/lib/db'
import { requireDealer } from '@/lib/auth'
import type { DamageType, PhotoStage } from '@/generated/prisma'

export interface DealerDashboardStats {
  totalVehicles: number
  activeVehicles: number
  archivedVehicles: number
  vehiclesByStatus: Array<{
    statusId: string
    statusName: string
    statusColor: string | null
    count: number
  }>
  currentBalance: number
  pendingBalanceRequests: number
  pendingBalanceAmount: number
  pendingInvoices: number
  pendingInvoiceAmount: number
  unreadNotifications: number
}

export interface DealerNotification {
  id: string
  title: string
  message: string
  type: 'STATUS_CHANGE' | 'BALANCE' | 'INVOICE' | 'SYSTEM'
  isRead: boolean
  referenceType: string | null
  referenceId: string | null
  createdAt: Date
}

export async function getDealerDashboardStats(): Promise<DealerDashboardStats> {
  const session = await requireDealer()
  const dealerId = session.user.id

  // Get vehicle counts, balance, and unread notifications in parallel
  const [
    totalVehicles,
    activeVehicles,
    archivedVehicles,
    dealer,
    pendingBalanceRequests,
    pendingInvoices,
    unreadNotifications,
    statuses,
  ] = await Promise.all([
    db.vehicle.count({ where: { dealerId } }),
    db.vehicle.count({ where: { dealerId, isArchived: false } }),
    db.vehicle.count({ where: { dealerId, isArchived: true } }),
    db.user.findUnique({
      where: { id: dealerId },
      select: { balance: true },
    }),
    db.balanceRequest.aggregate({
      where: { dealerId, status: 'PENDING' },
      _count: true,
      _sum: { amount: true },
    }),
    db.invoice.aggregate({
      where: { dealerId, status: 'PENDING' },
      _count: true,
      _sum: { totalAmount: true },
    }),
    db.notification.count({
      where: { userId: dealerId, isRead: false },
    }),
    db.status.findMany({
      orderBy: { order: 'asc' },
      include: {
        _count: {
          select: {
            vehicles: {
              where: { dealerId, isArchived: false },
            },
          },
        },
      },
    }),
  ])

  const vehiclesByStatus = statuses.map((status) => ({
    statusId: status.id,
    statusName: status.nameEn,
    statusColor: status.color,
    count: status._count.vehicles,
  }))

  return {
    totalVehicles,
    activeVehicles,
    archivedVehicles,
    vehiclesByStatus,
    currentBalance: Number(dealer?.balance || 0),
    pendingBalanceRequests: pendingBalanceRequests._count,
    pendingBalanceAmount: Number(pendingBalanceRequests._sum.amount || 0),
    pendingInvoices: pendingInvoices._count,
    pendingInvoiceAmount: Number(pendingInvoices._sum.totalAmount || 0),
    unreadNotifications,
  }
}

export async function getDealerRecentNotifications(
  limit: number = 5
): Promise<DealerNotification[]> {
  const session = await requireDealer()
  const dealerId = session.user.id

  const notifications = await db.notification.findMany({
    where: { userId: dealerId },
    orderBy: { createdAt: 'desc' },
    take: limit,
    select: {
      id: true,
      titleEn: true,
      messageEn: true,
      type: true,
      isRead: true,
      referenceType: true,
      referenceId: true,
      createdAt: true,
    },
  })

  return notifications.map((notification) => ({
    id: notification.id,
    title: notification.titleEn,
    message: notification.messageEn,
    type: notification.type,
    isRead: notification.isRead,
    referenceType: notification.referenceType,
    referenceId: notification.referenceId,
    createdAt: notification.createdAt,
  }))
}

// ============================================================================
// DEALER VEHICLES
// ============================================================================

export interface DealerVehicleListParams {
  search?: string
  statusId?: string
  makeId?: string
  year?: string
  showArchived?: boolean
  sortBy?: 'createdAt' | 'year' | 'vin' | 'lotNumber'
  sortOrder?: 'asc' | 'desc'
  page?: number
  pageSize?: number
}

export interface DealerVehicleListItem {
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
  isArchived: boolean
  createdAt: Date
}

export interface DealerVehiclesResult {
  vehicles: DealerVehicleListItem[]
  totalCount: number
  totalPages: number
  currentPage: number
}

export async function getDealerVehicles(
  params: DealerVehicleListParams = {}
): Promise<DealerVehiclesResult> {
  const session = await requireDealer()
  const dealerId = session.user.id

  const {
    search = '',
    statusId,
    makeId,
    year,
    showArchived = false,
    sortBy = 'createdAt',
    sortOrder = 'desc',
    page = 1,
    pageSize = 10,
  } = params

  // Build where clause - always filter by dealer
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: any = {
    dealerId,
    isArchived: showArchived,
  }

  // Status filter
  if (statusId) {
    where.statusId = statusId
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
      isArchived: vehicle.isArchived,
      createdAt: vehicle.createdAt,
    })),
    totalCount,
    totalPages,
    currentPage: page,
  }
}

export interface DealerVehicleFilterOptions {
  statuses: Array<{ id: string; nameEn: string; nameKa: string }>
  makes: Array<{ id: string; name: string }>
  years: number[]
}

export async function getDealerVehicleFilterOptions(): Promise<DealerVehicleFilterOptions> {
  const session = await requireDealer()
  const dealerId = session.user.id

  // Get filter options scoped to dealer's vehicles
  const [statuses, dealerVehicles] = await Promise.all([
    db.status.findMany({
      select: { id: true, nameEn: true, nameKa: true },
      orderBy: { order: 'asc' },
    }),
    db.vehicle.findMany({
      where: { dealerId },
      select: { makeId: true, year: true },
      distinct: ['makeId', 'year'],
    }),
  ])

  // Extract unique make IDs and years from dealer's vehicles
  const makeIds = [...new Set(dealerVehicles.map((v) => v.makeId))]
  const years = [...new Set(dealerVehicles.map((v) => v.year))].sort((a, b) => b - a)

  // Fetch makes that the dealer has vehicles for
  const makes = makeIds.length > 0
    ? await db.make.findMany({
        where: { id: { in: makeIds } },
        select: { id: true, name: true },
        orderBy: { name: 'asc' },
      })
    : []

  return {
    statuses,
    makes,
    years,
  }
}

// ============================================================================
// DEALER VEHICLE DETAIL
// ============================================================================

export interface DealerVehicleDetail {
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
  make: { id: string; name: string }
  model: { id: string; name: string }
  auction: { id: string; name: string }
  status: { id: string; nameEn: string; nameKa: string; color: string | null }
  country: { id: string; nameEn: string; nameKa: string }
  state: { id: string; nameEn: string; nameKa: string }
  city: { id: string; name: string } | null
  port: { id: string; name: string } | null
  photos: Array<{ id: string; url: string; stage: PhotoStage; order: number }>
  statusHistory: Array<{
    id: string
    changedAt: Date
    status: { id: string; nameEn: string; nameKa: string; color: string | null }
    changedBy: { id: string; name: string }
  }>
}

export async function getDealerVehicleById(
  id: string
): Promise<DealerVehicleDetail | null> {
  const session = await requireDealer()
  const dealerId = session.user.id

  const vehicle = await db.vehicle.findUnique({
    where: { id },
    select: {
      id: true,
      vin: true,
      year: true,
      color: true,
      lotNumber: true,
      auctionLink: true,
      damageType: true,
      hasKeys: true,
      shipName: true,
      containerNumber: true,
      eta: true,
      transportationPrice: true,
      isArchived: true,
      archivedAt: true,
      createdAt: true,
      dealerId: true,
      make: {
        select: { id: true, name: true },
      },
      model: {
        select: { id: true, name: true },
      },
      auction: {
        select: { id: true, name: true },
      },
      status: {
        select: { id: true, nameEn: true, nameKa: true, color: true },
      },
      country: {
        select: { id: true, nameEn: true, nameKa: true },
      },
      state: {
        select: { id: true, nameEn: true, nameKa: true },
      },
      city: {
        select: { id: true, name: true },
      },
      port: {
        select: { id: true, name: true },
      },
      photos: {
        select: { id: true, url: true, stage: true, order: true },
        orderBy: { order: 'asc' },
      },
      statusHistory: {
        select: {
          id: true,
          changedAt: true,
          status: {
            select: { id: true, nameEn: true, nameKa: true, color: true },
          },
          changedBy: {
            select: { id: true, name: true },
          },
        },
        orderBy: { changedAt: 'desc' },
      },
    },
  })

  // Return null if not found or dealer doesn't own this vehicle
  if (!vehicle || vehicle.dealerId !== dealerId) {
    return null
  }

  return {
    id: vehicle.id,
    vin: vehicle.vin,
    year: vehicle.year,
    color: vehicle.color,
    lotNumber: vehicle.lotNumber,
    auctionLink: vehicle.auctionLink,
    damageType: vehicle.damageType,
    hasKeys: vehicle.hasKeys,
    shipName: vehicle.shipName,
    containerNumber: vehicle.containerNumber,
    eta: vehicle.eta,
    transportationPrice: Number(vehicle.transportationPrice),
    isArchived: vehicle.isArchived,
    archivedAt: vehicle.archivedAt,
    createdAt: vehicle.createdAt,
    make: vehicle.make,
    model: vehicle.model,
    auction: vehicle.auction,
    status: vehicle.status,
    country: vehicle.country,
    state: vehicle.state,
    city: vehicle.city,
    port: vehicle.port,
    photos: vehicle.photos,
    statusHistory: vehicle.statusHistory,
  }
}
