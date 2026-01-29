import { requireAdmin } from '@/lib/auth'
import { PageHeader } from '@/components/layout/page-header'
import { Card, CardContent } from '@/components/ui/card'
import { VehicleForm } from '@/components/vehicles'
import { getVehicleFormOptions } from '@/lib/actions/vehicles'

export default async function NewVehiclePage() {
  await requireAdmin()

  const options = await getVehicleFormOptions()

  return (
    <>
      <PageHeader
        title="Add New Vehicle"
        description="Create a new vehicle record"
      />

      <Card>
        <CardContent className="pt-6">
          <VehicleForm mode="create" options={options} />
        </CardContent>
      </Card>
    </>
  )
}
