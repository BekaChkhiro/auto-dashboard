import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { requireAdmin } from '@/lib/auth'
import { PageHeader } from '@/components/layout/page-header'
import { Button } from '@/components/ui/button'
import { BalanceRequestDetail } from '@/components/balance-requests'
import { getBalanceRequestById } from '@/lib/actions/balance-requests'
import { formatCurrency } from '@/lib/formatting'

interface BalanceRequestDetailPageProps {
  params: Promise<{ id: string }>
}

export default async function BalanceRequestDetailPage({
  params,
}: BalanceRequestDetailPageProps) {
  await requireAdmin()

  const { id } = await params

  const request = await getBalanceRequestById(id)

  if (!request) {
    notFound()
  }

  return (
    <>
      <PageHeader
        title={`Balance Request - ${formatCurrency(request.amount, 'en')}`}
        description={`Request from ${request.dealer.name}`}
        actions={
          <Button variant="outline" asChild>
            <Link href="/admin/balance-requests">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Requests
            </Link>
          </Button>
        }
      />

      <BalanceRequestDetail request={request} />
    </>
  )
}
