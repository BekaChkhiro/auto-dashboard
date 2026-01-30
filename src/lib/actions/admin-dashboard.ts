'use server'

import { db } from '@/lib/db'
import { requireAdmin } from '@/lib/auth'

export interface DashboardStats {
  totalDealers: number
  activeDealers: number
  blockedDealers: number
  totalVehicles: number
  activeVehicles: number
  archivedVehicles: number
  pendingBalanceRequests: number
  totalPendingAmount: number
  invoicesThisMonth: number
  pendingInvoices: number
  vehiclesByStatus: Array<{
    statusId: string
    statusName: string
    statusColor: string | null
    count: number
  }>
}

export interface RecentActivity {
  id: string
  type: 'vehicle_added' | 'status_change' | 'balance_request' | 'invoice_created' | 'dealer_added'
  description: string
  metadata: {
    entityId?: string
    entityName?: string
    dealerName?: string
    statusName?: string
    amount?: number
  }
  createdAt: Date
}

export async function getDashboardStats(): Promise<DashboardStats> {
  await requireAdmin()

  // Get dealer counts
  const [totalDealers, activeDealers, blockedDealers] = await Promise.all([
    db.user.count({ where: { role: 'DEALER' } }),
    db.user.count({ where: { role: 'DEALER', status: 'ACTIVE' } }),
    db.user.count({ where: { role: 'DEALER', status: 'BLOCKED' } }),
  ])

  // Get vehicle counts
  const [totalVehicles, activeVehicles, archivedVehicles] = await Promise.all([
    db.vehicle.count(),
    db.vehicle.count({ where: { isArchived: false } }),
    db.vehicle.count({ where: { isArchived: true } }),
  ])

  // Get pending balance requests
  const pendingRequests = await db.balanceRequest.aggregate({
    where: { status: 'PENDING' },
    _count: true,
    _sum: { amount: true },
  })

  // Get invoices this month
  const startOfMonth = new Date()
  startOfMonth.setDate(1)
  startOfMonth.setHours(0, 0, 0, 0)

  const [invoicesThisMonth, pendingInvoices] = await Promise.all([
    db.invoice.count({
      where: { createdAt: { gte: startOfMonth } },
    }),
    db.invoice.count({
      where: { status: 'PENDING' },
    }),
  ])

  // Get vehicles grouped by status
  const statuses = await db.status.findMany({
    orderBy: { order: 'asc' },
    include: {
      _count: {
        select: {
          vehicles: {
            where: { isArchived: false },
          },
        },
      },
    },
  })

  const vehiclesByStatus = statuses.map((status) => ({
    statusId: status.id,
    statusName: status.nameEn,
    statusColor: status.color,
    count: status._count.vehicles,
  }))

  return {
    totalDealers,
    activeDealers,
    blockedDealers,
    totalVehicles,
    activeVehicles,
    archivedVehicles,
    pendingBalanceRequests: pendingRequests._count,
    totalPendingAmount: Number(pendingRequests._sum.amount || 0),
    invoicesThisMonth,
    pendingInvoices,
    vehiclesByStatus,
  }
}

export async function getRecentActivity(limit: number = 10): Promise<RecentActivity[]> {
  await requireAdmin()

  // Run all queries in parallel for better performance
  const [
    recentVehicles,
    recentStatusChanges,
    recentBalanceRequests,
    recentInvoices,
    recentDealers,
  ] = await Promise.all([
    // Get recent vehicles added
    db.vehicle.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        year: true,
        createdAt: true,
        dealer: { select: { name: true } },
        make: { select: { name: true } },
        model: { select: { name: true } },
      },
    }),
    // Get recent status changes
    db.vehicleStatusHistory.findMany({
      take: 5,
      orderBy: { changedAt: 'desc' },
      select: {
        id: true,
        vehicleId: true,
        changedAt: true,
        vehicle: {
          select: {
            year: true,
            make: { select: { name: true } },
            model: { select: { name: true } },
          },
        },
        status: { select: { nameEn: true } },
      },
    }),
    // Get recent balance requests
    db.balanceRequest.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        amount: true,
        createdAt: true,
        dealer: { select: { name: true } },
      },
    }),
    // Get recent invoices
    db.invoice.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        invoiceNumber: true,
        totalAmount: true,
        createdAt: true,
        dealer: { select: { name: true } },
      },
    }),
    // Get recent dealers added
    db.user.findMany({
      where: { role: 'DEALER' },
      take: 5,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        createdAt: true,
      },
    }),
  ])

  // Build activities array
  const activities: RecentActivity[] = [
    ...recentVehicles.map((vehicle) => ({
      id: `vehicle-${vehicle.id}`,
      type: 'vehicle_added' as const,
      description: `New vehicle added: ${vehicle.year} ${vehicle.make.name} ${vehicle.model.name}`,
      metadata: {
        entityId: vehicle.id,
        entityName: `${vehicle.year} ${vehicle.make.name} ${vehicle.model.name}`,
        dealerName: vehicle.dealer.name,
      },
      createdAt: vehicle.createdAt,
    })),
    ...recentStatusChanges.map((change) => ({
      id: `status-${change.id}`,
      type: 'status_change' as const,
      description: `Status changed to "${change.status.nameEn}" for ${change.vehicle.year} ${change.vehicle.make.name} ${change.vehicle.model.name}`,
      metadata: {
        entityId: change.vehicleId,
        entityName: `${change.vehicle.year} ${change.vehicle.make.name} ${change.vehicle.model.name}`,
        statusName: change.status.nameEn,
      },
      createdAt: change.changedAt,
    })),
    ...recentBalanceRequests.map((request) => ({
      id: `balance-${request.id}`,
      type: 'balance_request' as const,
      description: `Balance request: $${Number(request.amount).toLocaleString()} from ${request.dealer.name}`,
      metadata: {
        entityId: request.id,
        dealerName: request.dealer.name,
        amount: Number(request.amount),
      },
      createdAt: request.createdAt,
    })),
    ...recentInvoices.map((invoice) => ({
      id: `invoice-${invoice.id}`,
      type: 'invoice_created' as const,
      description: `Invoice ${invoice.invoiceNumber} created for ${invoice.dealer.name}`,
      metadata: {
        entityId: invoice.id,
        entityName: invoice.invoiceNumber,
        dealerName: invoice.dealer.name,
        amount: Number(invoice.totalAmount),
      },
      createdAt: invoice.createdAt,
    })),
    ...recentDealers.map((dealer) => ({
      id: `dealer-${dealer.id}`,
      type: 'dealer_added' as const,
      description: `New dealer registered: ${dealer.name}`,
      metadata: {
        entityId: dealer.id,
        dealerName: dealer.name,
      },
      createdAt: dealer.createdAt,
    })),
  ]

  // Sort by date and limit
  return activities.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()).slice(0, limit)
}
