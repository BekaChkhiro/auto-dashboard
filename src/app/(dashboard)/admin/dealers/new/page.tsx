import { requireAdmin } from '@/lib/auth'
import { PageHeader } from '@/components/layout/page-header'
import { Card, CardContent } from '@/components/ui/card'
import { DealerForm } from '@/components/dealers'

export default async function NewDealerPage() {
  await requireAdmin()

  return (
    <>
      <PageHeader
        title="Add New Dealer"
        description="Create a new dealer account"
      />

      <Card>
        <CardContent className="pt-6">
          <DealerForm mode="create" />
        </CardContent>
      </Card>
    </>
  )
}
