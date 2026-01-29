import { notFound } from 'next/navigation'
import { requireAdmin } from '@/lib/auth'
import { getDealerById } from '@/lib/actions/dealers'
import { PageHeader } from '@/components/layout/page-header'
import { Card, CardContent } from '@/components/ui/card'
import { DealerForm } from '@/components/dealers'

interface EditDealerPageProps {
  params: Promise<{ id: string }>
}

export default async function EditDealerPage({ params }: EditDealerPageProps) {
  await requireAdmin()

  const { id } = await params
  const dealer = await getDealerById(id)

  if (!dealer) {
    notFound()
  }

  return (
    <>
      <PageHeader
        title="Edit Dealer"
        description={`Edit dealer: ${dealer.name}`}
      />

      <Card>
        <CardContent className="pt-6">
          <DealerForm mode="edit" dealer={dealer} />
        </CardContent>
      </Card>
    </>
  )
}
