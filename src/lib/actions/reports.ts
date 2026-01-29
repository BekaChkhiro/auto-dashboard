'use server'

import { db } from '@/lib/db'
import { requireAdmin } from '@/lib/auth'

// ============================================================================
// TYPES
// ============================================================================

export interface DateRange {
  from: Date
  to: Date
}

export interface DealerBalanceSummary {
  id: string
  name: string
  companyName: string | null
  email: string
  balance: number
  vehicleCount: number
  pendingInvoicesCount: number
  totalPendingAmount: number
}

export interface VehicleStatusDistribution {
  statusId: string
  statusName: string
  statusColor: string | null
  count: number
  percentage: number
}

export interface MonthlyTrendData {
  month: string
  monthLabel: string
  vehiclesAdded: number
  invoicesCreated: number
  depositsApproved: number
  revenue: number
}

export interface ReportsSummary {
  totalDealerBalance: number
  totalActiveVehicles: number
  totalRevenueInPeriod: number
  totalInvoicesInPeriod: number
  totalDepositsInPeriod: number
  averageInvoiceAmount: number
}

export interface ReportsData {
  summary: ReportsSummary
  dealerBalances: DealerBalanceSummary[]
  statusDistribution: VehicleStatusDistribution[]
  monthlyTrends: MonthlyTrendData[]
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function getMonthLabel(date: Date): string {
  return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
}

function getMonthKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
}

// ============================================================================
// DATA FETCHING FUNCTIONS
// ============================================================================

export async function getReportsSummary(dateRange: DateRange): Promise<ReportsSummary> {
  await requireAdmin()

  const [
    totalBalanceResult,
    activeVehicles,
    invoicesInPeriod,
    depositsInPeriod,
  ] = await Promise.all([
    // Total dealer balance
    db.user.aggregate({
      where: { role: 'DEALER', status: 'ACTIVE' },
      _sum: { balance: true },
    }),
    // Active vehicles count
    db.vehicle.count({
      where: { isArchived: false },
    }),
    // Invoices in period
    db.invoice.aggregate({
      where: {
        createdAt: {
          gte: dateRange.from,
          lte: dateRange.to,
        },
        status: 'PAID',
      },
      _count: true,
      _sum: { totalAmount: true },
      _avg: { totalAmount: true },
    }),
    // Deposits approved in period
    db.balanceRequest.aggregate({
      where: {
        status: 'APPROVED',
        processedAt: {
          gte: dateRange.from,
          lte: dateRange.to,
        },
      },
      _count: true,
      _sum: { amount: true },
    }),
  ])

  return {
    totalDealerBalance: Number(totalBalanceResult._sum.balance || 0),
    totalActiveVehicles: activeVehicles,
    totalRevenueInPeriod: Number(invoicesInPeriod._sum.totalAmount || 0),
    totalInvoicesInPeriod: invoicesInPeriod._count,
    totalDepositsInPeriod: Number(depositsInPeriod._sum.amount || 0),
    averageInvoiceAmount: Number(invoicesInPeriod._avg.totalAmount || 0),
  }
}

export async function getDealerBalancesSummary(
  dateRange: DateRange
): Promise<DealerBalanceSummary[]> {
  await requireAdmin()

  const dealers = await db.user.findMany({
    where: {
      role: 'DEALER',
    },
    select: {
      id: true,
      name: true,
      companyName: true,
      email: true,
      balance: true,
      _count: {
        select: {
          vehicles: {
            where: { isArchived: false },
          },
        },
      },
      invoices: {
        where: {
          status: 'PENDING',
        },
        select: {
          totalAmount: true,
        },
      },
    },
    orderBy: { balance: 'desc' },
  })

  return dealers.map((dealer) => ({
    id: dealer.id,
    name: dealer.name,
    companyName: dealer.companyName,
    email: dealer.email,
    balance: Number(dealer.balance),
    vehicleCount: dealer._count.vehicles,
    pendingInvoicesCount: dealer.invoices.length,
    totalPendingAmount: dealer.invoices.reduce(
      (sum, inv) => sum + Number(inv.totalAmount),
      0
    ),
  }))
}

export async function getVehicleStatusDistribution(): Promise<VehicleStatusDistribution[]> {
  await requireAdmin()

  const [statuses, totalVehicles] = await Promise.all([
    db.status.findMany({
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
    }),
    db.vehicle.count({ where: { isArchived: false } }),
  ])

  return statuses.map((status) => ({
    statusId: status.id,
    statusName: status.nameEn,
    statusColor: status.color,
    count: status._count.vehicles,
    percentage: totalVehicles > 0
      ? Math.round((status._count.vehicles / totalVehicles) * 100)
      : 0,
  }))
}

export async function getMonthlyTrends(
  dateRange: DateRange
): Promise<MonthlyTrendData[]> {
  await requireAdmin()

  // Generate list of months in the range
  const months: { key: string; label: string; start: Date; end: Date }[] = []
  const current = new Date(dateRange.from)
  current.setDate(1)
  current.setHours(0, 0, 0, 0)

  while (current <= dateRange.to) {
    const monthStart = new Date(current)
    const monthEnd = new Date(current.getFullYear(), current.getMonth() + 1, 0, 23, 59, 59, 999)

    months.push({
      key: getMonthKey(current),
      label: getMonthLabel(current),
      start: monthStart,
      end: monthEnd > dateRange.to ? dateRange.to : monthEnd,
    })

    current.setMonth(current.getMonth() + 1)
  }

  // Fetch data for each month in parallel
  const trendsData = await Promise.all(
    months.map(async (month) => {
      const [vehicles, invoices, deposits] = await Promise.all([
        db.vehicle.count({
          where: {
            createdAt: {
              gte: month.start,
              lte: month.end,
            },
          },
        }),
        db.invoice.aggregate({
          where: {
            createdAt: {
              gte: month.start,
              lte: month.end,
            },
          },
          _count: true,
          _sum: { totalAmount: true },
        }),
        db.balanceRequest.count({
          where: {
            status: 'APPROVED',
            processedAt: {
              gte: month.start,
              lte: month.end,
            },
          },
        }),
      ])

      return {
        month: month.key,
        monthLabel: month.label,
        vehiclesAdded: vehicles,
        invoicesCreated: invoices._count,
        depositsApproved: deposits,
        revenue: Number(invoices._sum.totalAmount || 0),
      }
    })
  )

  return trendsData
}

export async function getReportsData(dateRange: DateRange): Promise<ReportsData> {
  await requireAdmin()

  const [summary, dealerBalances, statusDistribution, monthlyTrends] =
    await Promise.all([
      getReportsSummary(dateRange),
      getDealerBalancesSummary(dateRange),
      getVehicleStatusDistribution(),
      getMonthlyTrends(dateRange),
    ])

  return {
    summary,
    dealerBalances,
    statusDistribution,
    monthlyTrends,
  }
}
