import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { requireAdmin } from '@/lib/auth'
import { PageHeader } from '@/components/layout/page-header'
import { Button } from '@/components/ui/button'
import { InvoiceCreateForm } from '@/components/invoices'
import { getDealersForInvoice } from '@/lib/actions/invoices'

export default async function NewInvoicePage() {
  await requireAdmin()

  const dealers = await getDealersForInvoice()

  return (
    <>
      <PageHeader
        title="Create Invoice"
        description="Create a new invoice for a dealer"
        actions={
          <Button variant="outline" asChild>
            <Link href="/admin/invoices">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Invoices
            </Link>
          </Button>
        }
      />

      <InvoiceCreateForm dealers={dealers} />
    </>
  )
}
