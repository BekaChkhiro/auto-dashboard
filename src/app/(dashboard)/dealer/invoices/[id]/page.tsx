import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { PageHeader } from '@/components/layout/page-header'
import { Button } from '@/components/ui/button'
import { requireDealer } from '@/lib/auth'
import { getDealerInvoiceById } from '@/lib/actions/dealer-invoices'
import { DealerInvoiceDetail } from '@/components/dealer/invoices'

interface DealerInvoiceDetailPageProps {
  params: Promise<{
    id: string
  }>
}

export default async function DealerInvoiceDetailPage({ params }: DealerInvoiceDetailPageProps) {
  await requireDealer()
  const { id } = await params

  const invoice = await getDealerInvoiceById(id)

  if (!invoice) {
    notFound()
  }

  return (
    <>
      <PageHeader
        title={`Invoice ${invoice.invoiceNumber}`}
        description="View invoice details and make payment"
        actions={
          <Button variant="outline" asChild>
            <Link href="/dealer/invoices">
              <ChevronLeft className="mr-2 h-4 w-4" />
              Back to Invoices
            </Link>
          </Button>
        }
      />

      <DealerInvoiceDetail invoice={invoice} />
    </>
  )
}
