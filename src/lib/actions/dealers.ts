'use server'

import { db } from '@/lib/db'
import { requireAdmin, hashPassword } from '@/lib/auth'
import { revalidatePath } from 'next/cache'
import type { UserStatus } from '@/generated/prisma'
import { createDealerSchema, updateDealerSchema } from '@/lib/validations/dealer'
import type { CreateDealerInput, UpdateDealerInput } from '@/lib/validations/dealer'

export interface DealerListParams {
  search?: string
  status?: 'all' | 'ACTIVE' | 'BLOCKED'
  sortBy?: 'name' | 'email' | 'createdAt' | 'balance'
  sortOrder?: 'asc' | 'desc'
  page?: number
  pageSize?: number
}

export interface DealerListItem {
  id: string
  name: string
  email: string
  phone: string
  companyName: string | null
  status: UserStatus
  balance: number
  vehicleCount: number
  createdAt: Date
}

export interface DealersResult {
  dealers: DealerListItem[]
  totalCount: number
  totalPages: number
  currentPage: number
}

export async function getDealers(params: DealerListParams = {}): Promise<DealersResult> {
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
  const where: {
    role: 'DEALER'
    status?: UserStatus
    OR?: Array<{
      name?: { contains: string; mode: 'insensitive' }
      email?: { contains: string; mode: 'insensitive' }
      phone?: { contains: string }
    }>
  } = {
    role: 'DEALER',
  }

  // Status filter
  if (status !== 'all') {
    where.status = status
  }

  // Search filter (name, email, or phone)
  if (search.trim()) {
    where.OR = [
      { name: { contains: search.trim(), mode: 'insensitive' } },
      { email: { contains: search.trim(), mode: 'insensitive' } },
      { phone: { contains: search.trim() } },
    ]
  }

  // Build orderBy
  const orderBy: Record<string, 'asc' | 'desc'> = {}
  orderBy[sortBy] = sortOrder

  // Get total count
  const totalCount = await db.user.count({ where })

  // Calculate pagination
  const totalPages = Math.ceil(totalCount / pageSize)
  const skip = (page - 1) * pageSize

  // Fetch dealers with vehicle count
  const dealers = await db.user.findMany({
    where,
    orderBy,
    skip,
    take: pageSize,
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      companyName: true,
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

  return {
    dealers: dealers.map((dealer) => ({
      id: dealer.id,
      name: dealer.name,
      email: dealer.email,
      phone: dealer.phone,
      companyName: dealer.companyName,
      status: dealer.status,
      balance: Number(dealer.balance),
      vehicleCount: dealer._count.vehicles,
      createdAt: dealer.createdAt,
    })),
    totalCount,
    totalPages,
    currentPage: page,
  }
}

export interface ToggleDealerStatusResult {
  success: boolean
  message: string
  newStatus?: UserStatus
}

export async function toggleDealerStatus(
  dealerId: string,
  newStatus: UserStatus
): Promise<ToggleDealerStatusResult> {
  await requireAdmin()

  try {
    // Verify dealer exists
    const dealer = await db.user.findUnique({
      where: { id: dealerId },
      select: { id: true, role: true, name: true },
    })

    if (!dealer) {
      return { success: false, message: 'Dealer not found' }
    }

    if (dealer.role !== 'DEALER') {
      return { success: false, message: 'User is not a dealer' }
    }

    // Update status
    await db.user.update({
      where: { id: dealerId },
      data: { status: newStatus },
    })

    revalidatePath('/admin/dealers')

    return {
      success: true,
      message: `Dealer ${dealer.name} has been ${newStatus === 'BLOCKED' ? 'blocked' : 'unblocked'}`,
      newStatus,
    }
  } catch {
    return { success: false, message: 'Failed to update dealer status' }
  }
}

export interface DealerDetail {
  id: string
  email: string
  name: string
  phone: string
  address: string
  companyName: string | null
  identificationNumber: string | null
  balance: number
  discount: number
  status: UserStatus
  createdAt: Date
}

export async function getDealerById(id: string): Promise<DealerDetail | null> {
  await requireAdmin()

  const dealer = await db.user.findUnique({
    where: { id, role: 'DEALER' },
    select: {
      id: true,
      email: true,
      name: true,
      phone: true,
      address: true,
      companyName: true,
      identificationNumber: true,
      balance: true,
      discount: true,
      status: true,
      createdAt: true,
    },
  })

  if (!dealer) return null

  return {
    ...dealer,
    balance: Number(dealer.balance),
    discount: Number(dealer.discount),
  }
}

export interface CreateDealerResult {
  success: boolean
  message: string
  dealerId?: string
}

export async function createDealer(data: CreateDealerInput): Promise<CreateDealerResult> {
  await requireAdmin()

  const validation = createDealerSchema.safeParse(data)
  if (!validation.success) {
    return {
      success: false,
      message: validation.error.issues[0]?.message || 'Validation failed',
    }
  }

  const { email, password, name, phone, address, companyName, identificationNumber, discount, balance, status } =
    validation.data

  try {
    // Check if email already exists
    const existingUser = await db.user.findUnique({
      where: { email },
      select: { id: true },
    })

    if (existingUser) {
      return { success: false, message: 'A user with this email already exists' }
    }

    // Hash password
    const hashedPassword = await hashPassword(password)

    // Create dealer
    const dealer = await db.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        phone,
        address,
        companyName: companyName || null,
        identificationNumber: identificationNumber || null,
        discount,
        balance,
        status,
        role: 'DEALER',
      },
    })

    revalidatePath('/admin/dealers')

    return {
      success: true,
      message: `Dealer ${name} has been created successfully`,
      dealerId: dealer.id,
    }
  } catch {
    return { success: false, message: 'Failed to create dealer' }
  }
}

export interface UpdateDealerResult {
  success: boolean
  message: string
}

export async function updateDealer(id: string, data: UpdateDealerInput): Promise<UpdateDealerResult> {
  await requireAdmin()

  const validation = updateDealerSchema.safeParse(data)
  if (!validation.success) {
    return {
      success: false,
      message: validation.error.issues[0]?.message || 'Validation failed',
    }
  }

  const { email, password, name, phone, address, companyName, identificationNumber, discount, balance, status } =
    validation.data

  try {
    // Verify dealer exists
    const dealer = await db.user.findUnique({
      where: { id, role: 'DEALER' },
      select: { id: true, email: true },
    })

    if (!dealer) {
      return { success: false, message: 'Dealer not found' }
    }

    // Check if email is being changed and if it's already in use
    if (email !== dealer.email) {
      const existingUser = await db.user.findUnique({
        where: { email },
        select: { id: true },
      })

      if (existingUser) {
        return { success: false, message: 'A user with this email already exists' }
      }
    }

    // Build update data
    const updateData: {
      email: string
      name: string
      phone: string
      address: string
      companyName: string | null
      identificationNumber: string | null
      discount: number
      balance: number
      status: UserStatus
      password?: string
    } = {
      email,
      name,
      phone,
      address,
      companyName: companyName || null,
      identificationNumber: identificationNumber || null,
      discount,
      balance,
      status,
    }

    // Only update password if provided
    if (password && password.length > 0) {
      updateData.password = await hashPassword(password)
    }

    await db.user.update({
      where: { id },
      data: updateData,
    })

    revalidatePath('/admin/dealers')
    revalidatePath(`/admin/dealers/${id}`)

    return {
      success: true,
      message: `Dealer ${name} has been updated successfully`,
    }
  } catch {
    return { success: false, message: 'Failed to update dealer' }
  }
}
