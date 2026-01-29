import Link from 'next/link'
import { Plus } from 'lucide-react'
import { PageHeader } from '@/components/layout/page-header'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { InvoicesTableSkeleton } from '@/components/invoices'

export default function InvoicesLoading() {
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
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <Skeleton className="h-9 w-full max-w-sm" />
            <Skeleton className="h-9 w-full sm:w-[150px]" />
          </div>
        </CardHeader>
        <CardContent>
          <InvoicesTableSkeleton />
        </CardContent>
      </Card>
    </>
  )
}
