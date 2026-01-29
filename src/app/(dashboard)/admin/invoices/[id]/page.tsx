import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { requireAdmin } from '@/lib/auth'
import { PageHeader } from '@/components/layout/page-header'
import { Button } from '@/components/ui/button'
import { InvoiceDetail } from '@/components/invoices'
import { getInvoiceById } from '@/lib/actions/invoices'

interface InvoiceDetailPageProps {
  params: Promise<{ id: string }>
}

export default async function InvoiceDetailPage({
  params,
}: InvoiceDetailPageProps) {
  await requireAdmin()

  const { id } = await params

  const invoice = await getInvoiceById(id)

  if (!invoice) {
    notFound()
  }

  return (
    <>
      <PageHeader
        title={`Invoice ${invoice.invoiceNumber}`}
        description={`Invoice for ${invoice.dealer.name}`}
        actions={
          <Button variant="outline" asChild>
            <Link href="/admin/invoices">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Invoices
            </Link>
          </Button>
        }
      />

      <InvoiceDetail invoice={invoice} />
    </>
  )
}
