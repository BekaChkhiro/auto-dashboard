'use server'

import { db } from '@/lib/db'
import { requireAdmin } from '@/lib/auth'
import { revalidatePath } from 'next/cache'
import type { BalanceRequestStatus } from '@/generated/prisma'

// ============================================================================
// TYPES
// ============================================================================

export interface BalanceRequestListParams {
  search?: string
  status?: 'all' | BalanceRequestStatus
  sortBy?: 'createdAt' | 'amount' | 'dealerName'
  sortOrder?: 'asc' | 'desc'
  page?: number
  pageSize?: number
}

export interface BalanceRequestListItem {
  id: string
  amount: number
  receiptUrl: string
  comment: string | null
  status: BalanceRequestStatus
  adminComment: string | null
  processedAt: Date | null
  createdAt: Date
  dealer: {
    id: string
    name: string
    email: string
    companyName: string | null
  }
  processedBy: {
    id: string
    name: string
  } | null
}

export interface BalanceRequestsResult {
  requests: BalanceRequestListItem[]
  totalCount: number
  totalPages: number
  currentPage: number
}

export interface BalanceRequestDetail {
  id: string
  amount: number
  receiptUrl: string
  comment: string | null
  status: BalanceRequestStatus
  adminComment: string | null
  processedAt: Date | null
  createdAt: Date
  dealer: {
    id: string
    name: string
    email: string
    phone: string
    companyName: string | null
    balance: number
  }
  processedBy: {
    id: string
    name: string
    email: string
  } | null
}

export interface ProcessBalanceRequestResult {
  success: boolean
  message: string
}

export interface BalanceRequestStats {
  pendingCount: number
  pendingTotal: number
  approvedCount: number
  approvedTotal: number
  rejectedCount: number
}

// ============================================================================
// GET BALANCE REQUESTS (LIST)
// ============================================================================

export async function getBalanceRequests(
  params: BalanceRequestListParams = {}
): Promise<BalanceRequestsResult> {
  await requireAdmin()

  const {
    search = '',
    status = 'all',
    sortBy = 'createdAt',
    sortOrder = 'desc',
    page = 1,
    pageSize = 10,
  } = params

  // Build where clause
  type WhereClause = {
    status?: BalanceRequestStatus
    OR?: Array<{
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

  // Search filter (dealer name, email, or company name)
  if (search.trim()) {
    where.OR = [
      { dealer: { name: { contains: search.trim(), mode: 'insensitive' } } },
      { dealer: { email: { contains: search.trim(), mode: 'insensitive' } } },
      { dealer: { companyName: { contains: search.trim(), mode: 'insensitive' } } },
    ]
  }

  // Build orderBy
  type OrderByType =
    | { createdAt: 'asc' | 'desc' }
    | { amount: 'asc' | 'desc' }
    | { dealer: { name: 'asc' | 'desc' } }

  let orderBy: OrderByType

  if (sortBy === 'dealerName') {
    orderBy = { dealer: { name: sortOrder } }
  } else {
    orderBy = { [sortBy]: sortOrder } as { createdAt: 'asc' | 'desc' } | { amount: 'asc' | 'desc' }
  }

  // Get total count
  const totalCount = await db.balanceRequest.count({ where })

  // Calculate pagination
  const totalPages = Math.ceil(totalCount / pageSize)
  const skip = (page - 1) * pageSize

  // Fetch balance requests with relations
  const requests = await db.balanceRequest.findMany({
    where,
    orderBy,
    skip,
    take: pageSize,
    select: {
      id: true,
      amount: true,
      receiptUrl: true,
      comment: true,
      status: true,
      adminComment: true,
      processedAt: true,
      createdAt: true,
      dealer: {
        select: {
          id: true,
          name: true,
          email: true,
          companyName: true,
        },
      },
      processedBy: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  })

  return {
    requests: requests.map((request) => ({
      id: request.id,
      amount: Number(request.amount),
      receiptUrl: request.receiptUrl,
      comment: request.comment,
      status: request.status,
      adminComment: request.adminComment,
      processedAt: request.processedAt,
      createdAt: request.createdAt,
      dealer: request.dealer,
      processedBy: request.processedBy,
    })),
    totalCount,
    totalPages,
    currentPage: page,
  }
}

// ============================================================================
// GET BALANCE REQUEST BY ID
// ============================================================================

export async function getBalanceRequestById(id: string): Promise<BalanceRequestDetail | null> {
  await requireAdmin()

  const request = await db.balanceRequest.findUnique({
    where: { id },
    select: {
      id: true,
      amount: true,
      receiptUrl: true,
      comment: true,
      status: true,
      adminComment: true,
      processedAt: true,
      createdAt: true,
      dealer: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          companyName: true,
          balance: true,
        },
      },
      processedBy: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  })

  if (!request) return null

  return {
    ...request,
    amount: Number(request.amount),
    dealer: {
      ...request.dealer,
      balance: Number(request.dealer.balance),
    },
  }
}

// ============================================================================
// APPROVE BALANCE REQUEST
// ============================================================================

export async function approveBalanceRequest(
  id: string,
  adminComment?: string
): Promise<ProcessBalanceRequestResult> {
  const session = await requireAdmin()

  try {
    // Get the balance request
    const request = await db.balanceRequest.findUnique({
      where: { id },
      select: {
        id: true,
        amount: true,
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

    if (!request) {
      return { success: false, message: 'Balance request not found' }
    }

    if (request.status !== 'PENDING') {
      return { success: false, message: 'Balance request has already been processed' }
    }

    const requestAmount = Number(request.amount)
    const currentBalance = Number(request.dealer.balance)
    const newBalance = currentBalance + requestAmount

    // Use transaction to ensure atomic operation
    await db.$transaction(async (tx) => {
      // 1. Update the balance request status
      await tx.balanceRequest.update({
        where: { id },
        data: {
          status: 'APPROVED',
          adminComment: adminComment || null,
          processedAt: new Date(),
          processedById: session.user.id,
        },
      })

      // 2. Update dealer's balance
      await tx.user.update({
        where: { id: request.dealerId },
        data: {
          balance: newBalance,
        },
      })

      // 3. Create transaction record
      await tx.transaction.create({
        data: {
          type: 'DEPOSIT',
          amount: requestAmount,
          balanceAfter: newBalance,
          referenceType: 'BalanceRequest',
          referenceId: id,
          description: `Balance top-up approved${adminComment ? `: ${adminComment}` : ''}`,
          dealerId: request.dealerId,
          createdById: session.user.id,
        },
      })

      // 4. Create notification for dealer
      await tx.notification.create({
        data: {
          titleKa: 'ბალანსის შევსება დამტკიცებულია',
          titleEn: 'Balance Top-up Approved',
          messageKa: `თქვენი მოთხოვნა $${requestAmount.toLocaleString()} თანხის შევსებაზე დამტკიცებულია.`,
          messageEn: `Your request to top up $${requestAmount.toLocaleString()} has been approved.`,
          type: 'BALANCE',
          referenceType: 'BalanceRequest',
          referenceId: id,
          userId: request.dealerId,
        },
      })
    })

    revalidatePath('/admin/balance-requests')
    revalidatePath(`/admin/balance-requests/${id}`)
    revalidatePath('/admin/dealers')
    revalidatePath('/admin')

    return {
      success: true,
      message: `Balance request approved. $${requestAmount.toLocaleString()} added to ${request.dealer.name}'s balance.`,
    }
  } catch (error) {
    console.error('Error approving balance request:', error)
    return { success: false, message: 'Failed to approve balance request' }
  }
}

// ============================================================================
// REJECT BALANCE REQUEST
// ============================================================================

export async function rejectBalanceRequest(
  id: string,
  adminComment?: string
): Promise<ProcessBalanceRequestResult> {
  const session = await requireAdmin()

  try {
    // Get the balance request
    const request = await db.balanceRequest.findUnique({
      where: { id },
      select: {
        id: true,
        amount: true,
        status: true,
        dealerId: true,
        dealer: {
          select: {
            name: true,
          },
        },
      },
    })

    if (!request) {
      return { success: false, message: 'Balance request not found' }
    }

    if (request.status !== 'PENDING') {
      return { success: false, message: 'Balance request has already been processed' }
    }

    const requestAmount = Number(request.amount)

    // Update the balance request status and create notification
    await db.$transaction(async (tx) => {
      // 1. Update the balance request status
      await tx.balanceRequest.update({
        where: { id },
        data: {
          status: 'REJECTED',
          adminComment: adminComment || null,
          processedAt: new Date(),
          processedById: session.user.id,
        },
      })

      // 2. Create notification for dealer
      await tx.notification.create({
        data: {
          titleKa: 'ბალანსის შევსება უარყოფილია',
          titleEn: 'Balance Top-up Rejected',
          messageKa: `თქვენი მოთხოვნა $${requestAmount.toLocaleString()} თანხის შევსებაზე უარყოფილია.${adminComment ? ` მიზეზი: ${adminComment}` : ''}`,
          messageEn: `Your request to top up $${requestAmount.toLocaleString()} has been rejected.${adminComment ? ` Reason: ${adminComment}` : ''}`,
          type: 'BALANCE',
          referenceType: 'BalanceRequest',
          referenceId: id,
          userId: request.dealerId,
        },
      })
    })

    revalidatePath('/admin/balance-requests')
    revalidatePath(`/admin/balance-requests/${id}`)
    revalidatePath('/admin')

    return {
      success: true,
      message: `Balance request from ${request.dealer.name} has been rejected.`,
    }
  } catch (error) {
    console.error('Error rejecting balance request:', error)
    return { success: false, message: 'Failed to reject balance request' }
  }
}

// ============================================================================
// GET BALANCE REQUEST STATS
// ============================================================================

export async function getBalanceRequestStats(): Promise<BalanceRequestStats> {
  await requireAdmin()

  const [pendingRequests, approvedRequests, rejectedCount] = await Promise.all([
    db.balanceRequest.findMany({
      where: { status: 'PENDING' },
      select: { amount: true },
    }),
    db.balanceRequest.findMany({
      where: { status: 'APPROVED' },
      select: { amount: true },
    }),
    db.balanceRequest.count({
      where: { status: 'REJECTED' },
    }),
  ])

  return {
    pendingCount: pendingRequests.length,
    pendingTotal: pendingRequests.reduce((sum, r) => sum + Number(r.amount), 0),
    approvedCount: approvedRequests.length,
    approvedTotal: approvedRequests.reduce((sum, r) => sum + Number(r.amount), 0),
    rejectedCount,
  }
}

// ============================================================================
// DEALER BALANCE MANAGEMENT
// ============================================================================

import { requireDealer } from '@/lib/auth'
import type { TransactionType } from '@/generated/prisma'

export interface DealerBalanceOverview {
  currentBalance: number
  pendingRequestsCount: number
  pendingRequestsTotal: number
  totalDeposits: number
  totalWithdrawals: number
}

export interface DealerBalanceRequestListItem {
  id: string
  amount: number
  receiptUrl: string
  comment: string | null
  status: BalanceRequestStatus
  adminComment: string | null
  processedAt: Date | null
  createdAt: Date
}

export interface DealerBalanceRequestsResult {
  requests: DealerBalanceRequestListItem[]
  totalCount: number
  totalPages: number
  currentPage: number
}

export interface DealerTransactionListItem {
  id: string
  type: TransactionType
  amount: number
  balanceAfter: number
  description: string | null
  referenceType: string | null
  referenceId: string | null
  createdAt: Date
}

export interface DealerTransactionsResult {
  transactions: DealerTransactionListItem[]
  totalCount: number
  totalPages: number
  currentPage: number
}

export interface CreateBalanceRequestResult {
  success: boolean
  message: string
  requestId?: string
}

// Get dealer's balance overview
export async function getDealerBalanceOverview(): Promise<DealerBalanceOverview> {
  const session = await requireDealer()
  const dealerId = session.user.id

  const [dealer, pendingRequests, transactions] = await Promise.all([
    db.user.findUnique({
      where: { id: dealerId },
      select: { balance: true },
    }),
    db.balanceRequest.aggregate({
      where: { dealerId, status: 'PENDING' },
      _count: true,
      _sum: { amount: true },
    }),
    db.transaction.findMany({
      where: { dealerId },
      select: { type: true, amount: true },
    }),
  ])

  const totalDeposits = transactions
    .filter((t) => t.type === 'DEPOSIT')
    .reduce((sum, t) => sum + Number(t.amount), 0)

  const totalWithdrawals = transactions
    .filter((t) => t.type === 'WITHDRAWAL' || t.type === 'INVOICE_PAYMENT')
    .reduce((sum, t) => sum + Number(t.amount), 0)

  return {
    currentBalance: Number(dealer?.balance || 0),
    pendingRequestsCount: pendingRequests._count,
    pendingRequestsTotal: Number(pendingRequests._sum.amount || 0),
    totalDeposits,
    totalWithdrawals,
  }
}

// Get dealer's balance requests
export async function getDealerBalanceRequests(params: {
  status?: 'all' | BalanceRequestStatus
  page?: number
  pageSize?: number
} = {}): Promise<DealerBalanceRequestsResult> {
  const session = await requireDealer()
  const dealerId = session.user.id

  const { status = 'all', page = 1, pageSize = 10 } = params

  // Build where clause
  type WhereClause = {
    dealerId: string
    status?: BalanceRequestStatus
  }

  const where: WhereClause = { dealerId }

  if (status !== 'all') {
    where.status = status
  }

  const totalCount = await db.balanceRequest.count({ where })
  const totalPages = Math.ceil(totalCount / pageSize)
  const skip = (page - 1) * pageSize

  const requests = await db.balanceRequest.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    skip,
    take: pageSize,
    select: {
      id: true,
      amount: true,
      receiptUrl: true,
      comment: true,
      status: true,
      adminComment: true,
      processedAt: true,
      createdAt: true,
    },
  })

  return {
    requests: requests.map((r) => ({
      id: r.id,
      amount: Number(r.amount),
      receiptUrl: r.receiptUrl,
      comment: r.comment,
      status: r.status,
      adminComment: r.adminComment,
      processedAt: r.processedAt,
      createdAt: r.createdAt,
    })),
    totalCount,
    totalPages,
    currentPage: page,
  }
}

// Get dealer's transactions
export async function getDealerTransactions(params: {
  type?: 'all' | TransactionType
  page?: number
  pageSize?: number
} = {}): Promise<DealerTransactionsResult> {
  const session = await requireDealer()
  const dealerId = session.user.id

  const { type = 'all', page = 1, pageSize = 10 } = params

  // Build where clause
  type WhereClause = {
    dealerId: string
    type?: TransactionType
  }

  const where: WhereClause = { dealerId }

  if (type !== 'all') {
    where.type = type
  }

  const totalCount = await db.transaction.count({ where })
  const totalPages = Math.ceil(totalCount / pageSize)
  const skip = (page - 1) * pageSize

  const transactions = await db.transaction.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    skip,
    take: pageSize,
    select: {
      id: true,
      type: true,
      amount: true,
      balanceAfter: true,
      description: true,
      referenceType: true,
      referenceId: true,
      createdAt: true,
    },
  })

  return {
    transactions: transactions.map((t) => ({
      id: t.id,
      type: t.type,
      amount: Number(t.amount),
      balanceAfter: Number(t.balanceAfter),
      description: t.description,
      referenceType: t.referenceType,
      referenceId: t.referenceId,
      createdAt: t.createdAt,
    })),
    totalCount,
    totalPages,
    currentPage: page,
  }
}

// Create a new balance request
export async function createBalanceRequest(data: {
  amount: number
  receiptUrl: string
  comment?: string
}): Promise<CreateBalanceRequestResult> {
  const session = await requireDealer()
  const dealerId = session.user.id

  try {
    // Validate amount
    if (data.amount <= 0) {
      return { success: false, message: 'Amount must be greater than 0' }
    }

    if (data.amount > 1000000) {
      return { success: false, message: 'Amount exceeds maximum allowed' }
    }

    // Check if receipt URL is provided
    if (!data.receiptUrl || data.receiptUrl.trim() === '') {
      return { success: false, message: 'Receipt is required' }
    }

    // Create the balance request
    const request = await db.balanceRequest.create({
      data: {
        amount: data.amount,
        receiptUrl: data.receiptUrl,
        comment: data.comment || null,
        status: 'PENDING',
        dealerId,
      },
    })

    // Create notification for admin
    await db.notification.create({
      data: {
        titleKa: 'ახალი ბალანსის შევსების მოთხოვნა',
        titleEn: 'New Balance Top-up Request',
        messageKa: `დილერმა მოითხოვა $${data.amount.toLocaleString()} თანხის შევსება.`,
        messageEn: `A dealer has requested a balance top-up of $${data.amount.toLocaleString()}.`,
        type: 'BALANCE',
        referenceType: 'BalanceRequest',
        referenceId: request.id,
        // Find admin user to notify
        userId: (await db.user.findFirst({ where: { role: 'ADMIN' } }))?.id || dealerId,
      },
    })

    revalidatePath('/dealer/balance')
    revalidatePath('/dealer')
    revalidatePath('/admin/balance-requests')
    revalidatePath('/admin')

    return {
      success: true,
      message: 'Balance request submitted successfully',
      requestId: request.id,
    }
  } catch (error) {
    console.error('Error creating balance request:', error)
    return { success: false, message: 'Failed to submit balance request' }
  }
}
