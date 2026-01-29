'use server'

import { db } from '@/lib/db'
import { requireDealer } from '@/lib/auth'
import { revalidatePath } from 'next/cache'
import type { InvoiceStatus } from '@/generated/prisma'

// ============================================================================
// TYPES
// ============================================================================

export interface DealerInvoiceListParams {
  status?: 'all' | InvoiceStatus
  page?: number
  pageSize?: number
}

export interface DealerInvoiceListItem {
  id: string
  invoiceNumber: string
  totalAmount: number
  status: InvoiceStatus
  paidAt: Date | null
  paidFromBalance: boolean
  createdAt: Date
  itemCount: number
}

export interface DealerInvoicesResult {
  invoices: DealerInvoiceListItem[]
  totalCount: number
  totalPages: number
  currentPage: number
}

export interface DealerInvoiceItemDetail {
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

export interface DealerInvoiceDetail {
  id: string
  invoiceNumber: string
  totalAmount: number
  status: InvoiceStatus
  paidAt: Date | null
  paidFromBalance: boolean
  createdAt: Date
  currentBalance: number
  items: DealerInvoiceItemDetail[]
}

export interface PayInvoiceResult {
  success: boolean
  message: string
}

export interface DealerInvoiceStats {
  pendingCount: number
  pendingTotal: number
  paidCount: number
  paidTotal: number
}

// ============================================================================
// GET DEALER INVOICES (LIST)
// ============================================================================

export async function getDealerInvoices(
  params: DealerInvoiceListParams = {}
): Promise<DealerInvoicesResult> {
  const session = await requireDealer()
  const dealerId = session.user.id

  const { status = 'all', page = 1, pageSize = 10 } = params

  // Build where clause
  type WhereClause = {
    dealerId: string
    status?: InvoiceStatus
  }

  const where: WhereClause = { dealerId }

  // Status filter
  if (status !== 'all') {
    where.status = status
  }

  // Get total count
  const totalCount = await db.invoice.count({ where })

  // Calculate pagination
  const totalPages = Math.ceil(totalCount / pageSize)
  const skip = (page - 1) * pageSize

  // Fetch invoices with relations
  const invoices = await db.invoice.findMany({
    where,
    orderBy: { createdAt: 'desc' },
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
    })),
    totalCount,
    totalPages,
    currentPage: page,
  }
}

// ============================================================================
// GET DEALER INVOICE BY ID
// ============================================================================

export async function getDealerInvoiceById(id: string): Promise<DealerInvoiceDetail | null> {
  const session = await requireDealer()
  const dealerId = session.user.id

  const invoice = await db.invoice.findFirst({
    where: {
      id,
      dealerId, // Ownership check
    },
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
          balance: true,
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
    id: invoice.id,
    invoiceNumber: invoice.invoiceNumber,
    totalAmount: Number(invoice.totalAmount),
    status: invoice.status,
    paidAt: invoice.paidAt,
    paidFromBalance: invoice.paidFromBalance,
    createdAt: invoice.createdAt,
    currentBalance: Number(invoice.dealer.balance),
    items: invoice.items.map((item) => ({
      ...item,
      amount: Number(item.amount),
    })),
  }
}

// ============================================================================
// PAY DEALER INVOICE FROM BALANCE
// ============================================================================

export async function payDealerInvoiceFromBalance(id: string): Promise<PayInvoiceResult> {
  const session = await requireDealer()
  const dealerId = session.user.id

  try {
    // Get the invoice with ownership check
    const invoice = await db.invoice.findFirst({
      where: {
        id,
        dealerId, // Ownership check
      },
      select: {
        id: true,
        invoiceNumber: true,
        totalAmount: true,
        status: true,
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

    // Check if dealer has sufficient balance
    if (currentBalance < invoiceAmount) {
      return {
        success: false,
        message: `Insufficient balance. Current balance: $${currentBalance.toLocaleString()}, Invoice amount: $${invoiceAmount.toLocaleString()}`,
      }
    }

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
        where: { id: dealerId },
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
          dealerId,
          createdById: dealerId,
        },
      })

      // 4. Create notification for dealer (confirmation)
      await tx.notification.create({
        data: {
          titleKa: 'ინვოისი გადახდილია',
          titleEn: 'Invoice Paid',
          messageKa: `თქვენ გადაიხადეთ ინვოისი ${invoice.invoiceNumber} ბალანსიდან. ახალი ბალანსი: $${newBalance.toLocaleString()}.`,
          messageEn: `You have paid invoice ${invoice.invoiceNumber} from your balance. New balance: $${newBalance.toLocaleString()}.`,
          type: 'INVOICE',
          referenceType: 'Invoice',
          referenceId: id,
          userId: dealerId,
        },
      })
    })

    revalidatePath('/dealer/invoices')
    revalidatePath(`/dealer/invoices/${id}`)
    revalidatePath('/dealer/balance')
    revalidatePath('/dealer')
    revalidatePath('/admin/invoices')
    revalidatePath(`/admin/invoices/${id}`)
    revalidatePath('/admin/dealers')
    revalidatePath('/admin')

    return {
      success: true,
      message: `Invoice ${invoice.invoiceNumber} paid successfully. New balance: $${newBalance.toLocaleString()}`,
    }
  } catch (error) {
    console.error('Error paying invoice from balance:', error)
    return { success: false, message: 'Failed to process payment' }
  }
}

// ============================================================================
// GET DEALER INVOICE STATS
// ============================================================================

export async function getDealerInvoiceStats(): Promise<DealerInvoiceStats> {
  const session = await requireDealer()
  const dealerId = session.user.id

  const [pendingInvoices, paidInvoices] = await Promise.all([
    db.invoice.findMany({
      where: { dealerId, status: 'PENDING' },
      select: { totalAmount: true },
    }),
    db.invoice.findMany({
      where: { dealerId, status: 'PAID' },
      select: { totalAmount: true },
    }),
  ])

  return {
    pendingCount: pendingInvoices.length,
    pendingTotal: pendingInvoices.reduce((sum, i) => sum + Number(i.totalAmount), 0),
    paidCount: paidInvoices.length,
    paidTotal: paidInvoices.reduce((sum, i) => sum + Number(i.totalAmount), 0),
  }
}
