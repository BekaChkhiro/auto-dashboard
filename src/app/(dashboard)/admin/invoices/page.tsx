import { Suspense } from 'react'
import Link from 'next/link'
import { Plus } from 'lucide-react'
import { requireAdmin } from '@/lib/auth'
import { PageHeader } from '@/components/layout/page-header'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  InvoicesTable,
  InvoicesTableSkeleton,
  InvoiceSearchFilters,
} from '@/components/invoices'
import type { InvoiceListParams } from '@/lib/actions/invoices'
import type { InvoiceStatus } from '@/generated/prisma'

interface InvoicesPageProps {
  searchParams: Promise<{
    search?: string
    status?: string
    sortBy?: string
    sortOrder?: string
    page?: string
  }>
}

export default async function InvoicesPage({ searchParams }: InvoicesPageProps) {
  await requireAdmin()

  const params = await searchParams

  // Parse search params
  const search = params.search || ''
  const status = (params.status as 'all' | InvoiceStatus) || 'all'
  const sortBy = (params.sortBy as 'createdAt' | 'totalAmount' | 'invoiceNumber' | 'dealerName') || 'createdAt'
  const sortOrder = (params.sortOrder as 'asc' | 'desc') || 'desc'
  const page = parseInt(params.page || '1', 10)

  const tableParams: InvoiceListParams = {
    search,
    status,
    sortBy,
    sortOrder,
    page,
    pageSize: 10,
  }

  // Create a unique key for Suspense based on params to trigger re-fetch
  const suspenseKey = JSON.stringify(tableParams)

  return (
    <>
      <PageHeader
        title="Invoices"
        description="Create and manage dealer invoices"
        actions={
          <Button asChild>
            <Link href="/admin/invoices/new">
              <Plus className="mr-2 h-4 w-4" />
              Create Invoice
            </Link>
          </Button>
        }
      />

      <Card>
        <CardHeader className="pb-4">
          <InvoiceSearchFilters initialSearch={search} initialStatus={status} />
        </CardHeader>
        <CardContent>
          <Suspense key={suspenseKey} fallback={<InvoicesTableSkeleton />}>
            <InvoicesTable params={tableParams} />
          </Suspense>
        </CardContent>
      </Card>
    </>
  )
}
