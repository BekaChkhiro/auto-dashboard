'use server'

import { db } from '@/lib/db'
import { requireAdmin } from '@/lib/auth'
import type { UserStatus, DamageType, InvoiceStatus, TransactionType } from '@/generated/prisma'

// ============================================================================
// TYPES
// ============================================================================

export interface ExportDealerRow {
  name: string
  email: string
  phone: string
  companyName: string | null
  identificationNumber: string | null
  status: UserStatus
  balance: number
  vehicleCount: number
  createdAt: Date
}

export interface ExportVehicleRow {
  vin: string
  year: number
  make: string
  model: string
  color: string | null
  lotNumber: string
  auction: string
  status: string
  dealerName: string
  dealerEmail: string
  transportationPrice: number
  damageType: DamageType
  hasKeys: boolean
  shipName: string | null
  containerNumber: string | null
  eta: Date | null
  country: string
  state: string
  city: string | null
  port: string | null
  isArchived: boolean
  createdAt: Date
}

export interface ExportTransactionRow {
  dealerName: string
  dealerEmail: string
  type: TransactionType
  amount: number
  balanceAfter: number
  description: string | null
  referenceType: string | null
  createdAt: Date
}

export interface ExportInvoiceRow {
  invoiceNumber: string
  dealerName: string
  dealerEmail: string
  totalAmount: number
  status: InvoiceStatus
  itemCount: number
  createdAt: Date
  paidAt: Date | null
}

// ============================================================================
// EXPORT FUNCTIONS
// ============================================================================

export async function getExportDealers(): Promise<ExportDealerRow[]> {
  await requireAdmin()

  const dealers = await db.user.findMany({
    where: { role: 'DEALER' },
    orderBy: { createdAt: 'desc' },
    select: {
      name: true,
      email: true,
      phone: true,
      companyName: true,
      identificationNumber: true,
      status: true,
      balance: true,
      createdAt: true,
      _count: {
        select: {
          vehicles: {
            where: { isArchived: false },
          },
        },
      },
    },
  })

  return dealers.map((dealer) => ({
    name: dealer.name,
    email: dealer.email,
    phone: dealer.phone,
    companyName: dealer.companyName,
    identificationNumber: dealer.identificationNumber,
    status: dealer.status,
    balance: Number(dealer.balance),
    vehicleCount: dealer._count.vehicles,
    createdAt: dealer.createdAt,
  }))
}

export async function getExportVehicles(params: {
  showArchived?: boolean
} = {}): Promise<ExportVehicleRow[]> {
  await requireAdmin()

  const { showArchived = false } = params

  const vehicles = await db.vehicle.findMany({
    where: { isArchived: showArchived },
    orderBy: { createdAt: 'desc' },
    select: {
      vin: true,
      year: true,
      color: true,
      lotNumber: true,
      transportationPrice: true,
      damageType: true,
      hasKeys: true,
      shipName: true,
      containerNumber: true,
      eta: true,
      isArchived: true,
      createdAt: true,
      make: { select: { name: true } },
      model: { select: { name: true } },
      auction: { select: { name: true } },
      status: { select: { nameEn: true } },
      dealer: { select: { name: true, email: true } },
      country: { select: { nameEn: true } },
      state: { select: { nameEn: true } },
      city: { select: { name: true } },
      port: { select: { name: true } },
    },
  })

  return vehicles.map((vehicle) => ({
    vin: vehicle.vin,
    year: vehicle.year,
    make: vehicle.make.name,
    model: vehicle.model.name,
    color: vehicle.color,
    lotNumber: vehicle.lotNumber,
    auction: vehicle.auction.name,
    status: vehicle.status.nameEn,
    dealerName: vehicle.dealer.name,
    dealerEmail: vehicle.dealer.email,
    transportationPrice: Number(vehicle.transportationPrice),
    damageType: vehicle.damageType,
    hasKeys: vehicle.hasKeys,
    shipName: vehicle.shipName,
    containerNumber: vehicle.containerNumber,
    eta: vehicle.eta,
    country: vehicle.country.nameEn,
    state: vehicle.state.nameEn,
    city: vehicle.city?.name || null,
    port: vehicle.port?.name || null,
    isArchived: vehicle.isArchived,
    createdAt: vehicle.createdAt,
  }))
}

export async function getExportTransactions(params: {
  dateFrom?: Date
  dateTo?: Date
} = {}): Promise<ExportTransactionRow[]> {
  await requireAdmin()

  const { dateFrom, dateTo } = params

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: any = {}

  if (dateFrom || dateTo) {
    where.createdAt = {}
    if (dateFrom) where.createdAt.gte = dateFrom
    if (dateTo) where.createdAt.lte = dateTo
  }

  const transactions = await db.transaction.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    select: {
      type: true,
      amount: true,
      balanceAfter: true,
      description: true,
      referenceType: true,
      createdAt: true,
      dealer: {
        select: {
          name: true,
          email: true,
        },
      },
    },
  })

  return transactions.map((transaction) => ({
    dealerName: transaction.dealer.name,
    dealerEmail: transaction.dealer.email,
    type: transaction.type,
    amount: Number(transaction.amount),
    balanceAfter: Number(transaction.balanceAfter),
    description: transaction.description,
    referenceType: transaction.referenceType,
    createdAt: transaction.createdAt,
  }))
}

export async function getExportInvoices(params: {
  dateFrom?: Date
  dateTo?: Date
  status?: InvoiceStatus
} = {}): Promise<ExportInvoiceRow[]> {
  await requireAdmin()

  const { dateFrom, dateTo, status } = params

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: any = {}

  if (status) {
    where.status = status
  }

  if (dateFrom || dateTo) {
    where.createdAt = {}
    if (dateFrom) where.createdAt.gte = dateFrom
    if (dateTo) where.createdAt.lte = dateTo
  }

  const invoices = await db.invoice.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    select: {
      invoiceNumber: true,
      totalAmount: true,
      status: true,
      createdAt: true,
      paidAt: true,
      dealer: {
        select: {
          name: true,
          email: true,
        },
      },
      _count: {
        select: {
          items: true,
        },
      },
    },
  })

  return invoices.map((invoice) => ({
    invoiceNumber: invoice.invoiceNumber,
    dealerName: invoice.dealer.name,
    dealerEmail: invoice.dealer.email,
    totalAmount: Number(invoice.totalAmount),
    status: invoice.status,
    itemCount: invoice._count.items,
    createdAt: invoice.createdAt,
    paidAt: invoice.paidAt,
  }))
}
