'use server'

import { db } from '@/lib/db'
import { requireAdmin } from '@/lib/auth'
import { revalidatePath } from 'next/cache'
import type { InvoiceStatus } from '@/generated/prisma'

// ============================================================================
// TYPES
// ============================================================================

export interface InvoiceListParams {
  search?: string
  status?: 'all' | InvoiceStatus
  dealerId?: string
  sortBy?: 'createdAt' | 'totalAmount' | 'invoiceNumber' | 'dealerName'
  sortOrder?: 'asc' | 'desc'
  page?: number
  pageSize?: number
}

export interface InvoiceListItem {
  id: string
  invoiceNumber: string
  totalAmount: number
  status: InvoiceStatus
  paidAt: Date | null
  paidFromBalance: boolean
  createdAt: Date
  itemCount: number
  dealer: {
    id: string
    name: string
    email: string
    companyName: string | null
  }
  createdBy: {
    id: string
    name: string
  }
}

export interface InvoicesResult {
  invoices: InvoiceListItem[]
  totalCount: number
  totalPages: number
  currentPage: number
}

export interface InvoiceItemDetail {
  id: string
  amount: number
  description: string | null
  vehicle: {
    id: string
    vin: string
    year: number
    make: { name: string }
    model: { name: string }
    lotNumber: string | null
  }
}

export interface InvoiceDetail {
  id: string
  invoiceNumber: string
  totalAmount: number
  status: InvoiceStatus
  paidAt: Date | null
  paidFromBalance: boolean
  createdAt: Date
  dealer: {
    id: string
    name: string
    email: string
    phone: string
    companyName: string | null
    address: string
    balance: number
  }
  createdBy: {
    id: string
    name: string
    email: string
  }
  items: InvoiceItemDetail[]
}

export interface CreateInvoiceInput {
  dealerId: string
  vehicleIds: string[]
}

export interface CreateInvoiceResult {
  success: boolean
  message: string
  invoiceId?: string
}

export interface ProcessInvoiceResult {
  success: boolean
  message: string
}

export interface InvoiceStats {
  pendingCount: number
  pendingTotal: number
  paidCount: number
  paidTotal: number
  cancelledCount: number
}

export interface DealerForInvoice {
  id: string
  name: string
  email: string
  companyName: string | null
  balance: number
}

export interface VehicleForInvoice {
  id: string
  vin: string
  year: number
  make: string
  model: string
  lotNumber: string | null
  transportationPrice: number
  status: { name: string }
}

// ============================================================================
// GET INVOICES (LIST)
// ============================================================================

export async function getInvoices(
  params: InvoiceListParams = {}
): Promise<InvoicesResult> {
  await requireAdmin()

  const {
    search = '',
    status = 'all',
    dealerId,
    sortBy = 'createdAt',
    sortOrder = 'desc',
    page = 1,
    pageSize = 10,
  } = params

  // Build where clause
  type WhereClause = {
    status?: InvoiceStatus
    dealerId?: string
    OR?: Array<{
      invoiceNumber?: { contains: string; mode: 'insensitive' }
      dealer?: {
        name?: { contains: string; mode: 'insensitive' }
        email?: { contains: string; mode: 'insensitive' }
        companyName?: { contains: string; mode: 'insensitive' }
      }
    }>
  }

  const where: WhereClause = {}

  // Status filter
  if (status !== 'all') {
    where.status = status
  }

  // Dealer filter
  if (dealerId) {
    where.dealerId = dealerId
  }

  // Search filter (invoice number, dealer name, email, or company)
  if (search.trim()) {
    where.OR = [
      { invoiceNumber: { contains: search.trim(), mode: 'insensitive' } },
      { dealer: { name: { contains: search.trim(), mode: 'insensitive' } } },
      { dealer: { email: { contains: search.trim(), mode: 'insensitive' } } },
      { dealer: { companyName: { contains: search.trim(), mode: 'insensitive' } } },
    ]
  }

  // Build orderBy
  type OrderByType =
    | { createdAt: 'asc' | 'desc' }
    | { totalAmount: 'asc' | 'desc' }
    | { invoiceNumber: 'asc' | 'desc' }
    | { dealer: { name: 'asc' | 'desc' } }

  let orderBy: OrderByType

  if (sortBy === 'dealerName') {
    orderBy = { dealer: { name: sortOrder } }
  } else {
    orderBy = { [sortBy]: sortOrder } as OrderByType
  }

  // Get total count
  const totalCount = await db.invoice.count({ where })

  // Calculate pagination
  const totalPages = Math.ceil(totalCount / pageSize)
  const skip = (page - 1) * pageSize

  // Fetch invoices with relations
  const invoices = await db.invoice.findMany({
    where,
    orderBy,
    skip,
    take: pageSize,
    select: {
      id: true,
      invoiceNumber: true,
      totalAmount: true,
      status: true,
      paidAt: true,
      paidFromBalance: true,
      createdAt: true,
      dealer: {
        select: {
          id: true,
          name: true,
          email: true,
          companyName: true,
        },
      },
      createdBy: {
        select: {
          id: true,
          name: true,
        },
      },
      _count: {
        select: {
          items: true,
        },
      },
    },
  })

  return {
    invoices: invoices.map((invoice) => ({
      id: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      totalAmount: Number(invoice.totalAmount),
      status: invoice.status,
      paidAt: invoice.paidAt,
      paidFromBalance: invoice.paidFromBalance,
      createdAt: invoice.createdAt,
      itemCount: invoice._count.items,
      dealer: invoice.dealer,
      createdBy: invoice.createdBy,
    })),
    totalCount,
    totalPages,
    currentPage: page,
  }
}

// ============================================================================
// GET INVOICE BY ID
// ============================================================================

export async function getInvoiceById(id: string): Promise<InvoiceDetail | null> {
  await requireAdmin()

  const invoice = await db.invoice.findUnique({
    where: { id },
    select: {
      id: true,
      invoiceNumber: true,
      totalAmount: true,
      status: true,
      paidAt: true,
      paidFromBalance: true,
      createdAt: true,
      dealer: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          companyName: true,
          address: true,
          balance: true,
        },
      },
      createdBy: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      items: {
        select: {
          id: true,
          amount: true,
          description: true,
          vehicle: {
            select: {
              id: true,
              vin: true,
              year: true,
              make: { select: { name: true } },
              model: { select: { name: true } },
              lotNumber: true,
            },
          },
        },
      },
    },
  })

  if (!invoice) return null

  return {
    ...invoice,
    totalAmount: Number(invoice.totalAmount),
    dealer: {
      ...invoice.dealer,
      balance: Number(invoice.dealer.balance),
    },
    items: invoice.items.map((item) => ({
      ...item,
      amount: Number(item.amount),
    })),
  }
}

// ============================================================================
// GENERATE INVOICE NUMBER
// ============================================================================

async function generateInvoiceNumber(): Promise<string> {
  const year = new Date().getFullYear()
  const prefix = `INV-${year}-`

  // Get the latest invoice for this year
  const latestInvoice = await db.invoice.findFirst({
    where: {
      invoiceNumber: {
        startsWith: prefix,
      },
    },
    orderBy: {
      invoiceNumber: 'desc',
    },
    select: {
      invoiceNumber: true,
    },
  })

  let nextNumber = 1
  if (latestInvoice) {
    const currentNumber = parseInt(latestInvoice.invoiceNumber.replace(prefix, ''), 10)
    nextNumber = currentNumber + 1
  }

  return `${prefix}${nextNumber.toString().padStart(5, '0')}`
}

// ============================================================================
// CREATE INVOICE
// ============================================================================

export async function createInvoice(input: CreateInvoiceInput): Promise<CreateInvoiceResult> {
  const session = await requireAdmin()

  const { dealerId, vehicleIds } = input

  if (!dealerId) {
    return { success: false, message: 'Please select a dealer' }
  }

  if (!vehicleIds || vehicleIds.length === 0) {
    return { success: false, message: 'Please select at least one vehicle' }
  }

  try {
    // Verify dealer exists
    const dealer = await db.user.findUnique({
      where: { id: dealerId, role: 'DEALER' },
      select: { id: true, name: true },
    })

    if (!dealer) {
      return { success: false, message: 'Dealer not found' }
    }

    // Get vehicles and verify they belong to the dealer and are not already invoiced
    const vehicles = await db.vehicle.findMany({
      where: {
        id: { in: vehicleIds },
        dealerId: dealerId,
        isArchived: false,
      },
      select: {
        id: true,
        vin: true,
        year: true,
        transportationPrice: true,
        make: { select: { name: true } },
        model: { select: { name: true } },
        invoiceItems: {
          where: {
            invoice: {
              status: { in: ['PENDING', 'PAID'] },
            },
          },
          select: { id: true },
        },
      },
    })

    if (vehicles.length !== vehicleIds.length) {
      return { success: false, message: 'Some vehicles were not found or do not belong to this dealer' }
    }

    // Check if any vehicles are already invoiced
    const alreadyInvoicedVehicles = vehicles.filter((v) => v.invoiceItems.length > 0)
    if (alreadyInvoicedVehicles.length > 0) {
      const vins = alreadyInvoicedVehicles.map((v) => v.vin).join(', ')
      return { success: false, message: `The following vehicles already have active invoices: ${vins}` }
    }

    // Calculate total amount
    const totalAmount = vehicles.reduce((sum, v) => sum + Number(v.transportationPrice), 0)

    // Generate invoice number
    const invoiceNumber = await generateInvoiceNumber()

    // Create invoice with items
    const invoice = await db.invoice.create({
      data: {
        invoiceNumber,
        totalAmount,
        status: 'PENDING',
        dealerId,
        createdById: session.user.id,
        items: {
          create: vehicles.map((vehicle) => ({
            amount: vehicle.transportationPrice,
            description: `${vehicle.year} ${vehicle.make.name} ${vehicle.model.name} - VIN: ${vehicle.vin}`,
            vehicleId: vehicle.id,
          })),
        },
      },
    })

    // Create notification for dealer
    await db.notification.create({
      data: {
        titleKa: 'ახალი ინვოისი',
        titleEn: 'New Invoice',
        messageKa: `თქვენ გაქვთ ახალი ინვოისი ${invoiceNumber} თანხით $${totalAmount.toLocaleString()}.`,
        messageEn: `You have a new invoice ${invoiceNumber} for $${totalAmount.toLocaleString()}.`,
        type: 'INVOICE',
        referenceType: 'Invoice',
        referenceId: invoice.id,
        userId: dealerId,
      },
    })

    revalidatePath('/admin/invoices')
    revalidatePath('/admin')
    revalidatePath('/dealer/invoices')
    revalidatePath('/dealer')

    return {
      success: true,
      message: `Invoice ${invoiceNumber} created successfully for ${dealer.name}`,
      invoiceId: invoice.id,
    }
  } catch (error) {
    console.error('Error creating invoice:', error)
    return { success: false, message: 'Failed to create invoice' }
  }
}

// ============================================================================
// MARK INVOICE AS PAID
// ============================================================================

export async function markInvoiceAsPaid(
  id: string,
  fromBalance: boolean = true
): Promise<ProcessInvoiceResult> {
  const session = await requireAdmin()

  try {
    // Get the invoice
    const invoice = await db.invoice.findUnique({
      where: { id },
      select: {
        id: true,
        invoiceNumber: true,
        totalAmount: true,
        status: true,
        dealerId: true,
        dealer: {
          select: {
            id: true,
            name: true,
            balance: true,
          },
        },
      },
    })

    if (!invoice) {
      return { success: false, message: 'Invoice not found' }
    }

    if (invoice.status !== 'PENDING') {
      return { success: false, message: 'Invoice is not pending' }
    }

    const invoiceAmount = Number(invoice.totalAmount)
    const currentBalance = Number(invoice.dealer.balance)

    if (fromBalance) {
      const newBalance = currentBalance - invoiceAmount

      // Use transaction to ensure atomic operation
      await db.$transaction(async (tx) => {
        // 1. Update the invoice status
        await tx.invoice.update({
          where: { id },
          data: {
            status: 'PAID',
            paidAt: new Date(),
            paidFromBalance: true,
          },
        })

        // 2. Update dealer's balance
        await tx.user.update({
          where: { id: invoice.dealerId },
          data: {
            balance: newBalance,
          },
        })

        // 3. Create transaction record
        await tx.transaction.create({
          data: {
            type: 'INVOICE_PAYMENT',
            amount: -invoiceAmount,
            balanceAfter: newBalance,
            referenceType: 'Invoice',
            referenceId: id,
            description: `Payment for invoice ${invoice.invoiceNumber}`,
            dealerId: invoice.dealerId,
            createdById: session.user.id,
          },
        })

        // 4. Create notification for dealer
        await tx.notification.create({
          data: {
            titleKa: 'ინვოისი გადახდილია',
            titleEn: 'Invoice Paid',
            messageKa: `ინვოისი ${invoice.invoiceNumber} გადახდილია ბალანსიდან. ახალი ბალანსი: $${newBalance.toLocaleString()}.`,
            messageEn: `Invoice ${invoice.invoiceNumber} has been paid from your balance. New balance: $${newBalance.toLocaleString()}.`,
            type: 'INVOICE',
            referenceType: 'Invoice',
            referenceId: id,
            userId: invoice.dealerId,
          },
        })
      })
    } else {
      // Mark as paid without deducting from balance (external payment)
      await db.$transaction(async (tx) => {
        await tx.invoice.update({
          where: { id },
          data: {
            status: 'PAID',
            paidAt: new Date(),
            paidFromBalance: false,
          },
        })

        await tx.notification.create({
          data: {
            titleKa: 'ინვოისი გადახდილია',
            titleEn: 'Invoice Paid',
            messageKa: `ინვოისი ${invoice.invoiceNumber} მონიშნულია როგორც გადახდილი.`,
            messageEn: `Invoice ${invoice.invoiceNumber} has been marked as paid.`,
            type: 'INVOICE',
            referenceType: 'Invoice',
            referenceId: id,
            userId: invoice.dealerId,
          },
        })
      })
    }

    revalidatePath('/admin/invoices')
    revalidatePath(`/admin/invoices/${id}`)
    revalidatePath('/admin/dealers')
    revalidatePath('/admin')
    revalidatePath('/dealer/invoices')
    revalidatePath(`/dealer/invoices/${id}`)
    revalidatePath('/dealer/balance')
    revalidatePath('/dealer')

    return {
      success: true,
      message: `Invoice ${invoice.invoiceNumber} marked as paid${fromBalance ? ' (deducted from balance)' : ''}`,
    }
  } catch (error) {
    console.error('Error marking invoice as paid:', error)
    return { success: false, message: 'Failed to mark invoice as paid' }
  }
}

// ============================================================================
// CANCEL INVOICE
// ============================================================================

export async function cancelInvoice(id: string): Promise<ProcessInvoiceResult> {
  await requireAdmin()

  try {
    const invoice = await db.invoice.findUnique({
      where: { id },
      select: {
        id: true,
        invoiceNumber: true,
        status: true,
        dealerId: true,
        dealer: {
          select: { name: true },
        },
      },
    })

    if (!invoice) {
      return { success: false, message: 'Invoice not found' }
    }

    if (invoice.status !== 'PENDING') {
      return { success: false, message: 'Only pending invoices can be cancelled' }
    }

    await db.$transaction(async (tx) => {
      await tx.invoice.update({
        where: { id },
        data: {
          status: 'CANCELLED',
        },
      })

      await tx.notification.create({
        data: {
          titleKa: 'ინვოისი გაუქმებულია',
          titleEn: 'Invoice Cancelled',
          messageKa: `ინვოისი ${invoice.invoiceNumber} გაუქმებულია.`,
          messageEn: `Invoice ${invoice.invoiceNumber} has been cancelled.`,
          type: 'INVOICE',
          referenceType: 'Invoice',
          referenceId: id,
          userId: invoice.dealerId,
        },
      })
    })

    revalidatePath('/admin/invoices')
    revalidatePath(`/admin/invoices/${id}`)
    revalidatePath('/admin')
    revalidatePath('/dealer/invoices')
    revalidatePath(`/dealer/invoices/${id}`)
    revalidatePath('/dealer')

    return {
      success: true,
      message: `Invoice ${invoice.invoiceNumber} has been cancelled`,
    }
  } catch (error) {
    console.error('Error cancelling invoice:', error)
    return { success: false, message: 'Failed to cancel invoice' }
  }
}

// ============================================================================
// GET INVOICE STATS
// ============================================================================

export async function getInvoiceStats(): Promise<InvoiceStats> {
  await requireAdmin()

  const [pendingInvoices, paidInvoices, cancelledCount] = await Promise.all([
    db.invoice.findMany({
      where: { status: 'PENDING' },
      select: { totalAmount: true },
    }),
    db.invoice.findMany({
      where: { status: 'PAID' },
      select: { totalAmount: true },
    }),
    db.invoice.count({
      where: { status: 'CANCELLED' },
    }),
  ])

  return {
    pendingCount: pendingInvoices.length,
    pendingTotal: pendingInvoices.reduce((sum, i) => sum + Number(i.totalAmount), 0),
    paidCount: paidInvoices.length,
    paidTotal: paidInvoices.reduce((sum, i) => sum + Number(i.totalAmount), 0),
    cancelledCount,
  }
}

// ============================================================================
// GET DEALERS FOR INVOICE CREATION
// ============================================================================

export async function getDealersForInvoice(): Promise<DealerForInvoice[]> {
  await requireAdmin()

  const dealers = await db.user.findMany({
    where: {
      role: 'DEALER',
      status: 'ACTIVE',
    },
    select: {
      id: true,
      name: true,
      email: true,
      companyName: true,
      balance: true,
    },
    orderBy: {
      name: 'asc',
    },
  })

  return dealers.map((d) => ({
    ...d,
    balance: Number(d.balance),
  }))
}

// ============================================================================
// GET VEHICLES FOR INVOICE (Uninvoiced vehicles for a dealer)
// ============================================================================

export async function getVehiclesForInvoice(dealerId: string): Promise<VehicleForInvoice[]> {
  await requireAdmin()

  if (!dealerId) return []

  const vehicles = await db.vehicle.findMany({
    where: {
      dealerId,
      isArchived: false,
      // Exclude vehicles that have pending or paid invoices
      NOT: {
        invoiceItems: {
          some: {
            invoice: {
              status: { in: ['PENDING', 'PAID'] },
            },
          },
        },
      },
    },
    include: {
      make: { select: { name: true } },
      model: { select: { name: true } },
      status: { select: { nameEn: true } },
    },
    orderBy: {
      createdAt: 'desc',
    },
  })

  return vehicles.map((v) => ({
    id: v.id,
    vin: v.vin,
    year: v.year,
    make: v.make.name,
    model: v.model.name,
    lotNumber: v.lotNumber,
    transportationPrice: Number(v.transportationPrice),
    status: { name: v.status.nameEn },
  }))
}
