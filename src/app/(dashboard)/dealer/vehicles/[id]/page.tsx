import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { requireDealer } from '@/lib/auth'
import { PageHeader } from '@/components/layout/page-header'
import { Button } from '@/components/ui/button'
import { DealerVehicleDetail } from '@/components/dealer'
import { getDealerVehicleById } from '@/lib/actions/dealer-dashboard'

interface DealerVehicleDetailPageProps {
  params: Promise<{ id: string }>
}

export default async function DealerVehicleDetailPage({
  params,
}: DealerVehicleDetailPageProps) {
  await requireDealer()

  const { id } = await params

  const vehicle = await getDealerVehicleById(id)

  if (!vehicle) {
    notFound()
  }

  return (
    <>
      <PageHeader
        title={`${vehicle.year} ${vehicle.make.name} ${vehicle.model.name}`}
        description={`VIN: ${vehicle.vin}`}
        actions={
          <Button variant="outline" asChild>
            <Link href="/dealer/vehicles">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Vehicles
            </Link>
          </Button>
        }
      />

      <DealerVehicleDetail vehicle={vehicle} />
    </>
  )
}
