import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Pencil } from 'lucide-react'
import { requireAdmin } from '@/lib/auth'
import { PageHeader } from '@/components/layout/page-header'
import { Button } from '@/components/ui/button'
import { VehicleDetail } from '@/components/vehicles/vehicle-detail'
import { getVehicleById, getVehicleFormOptions } from '@/lib/actions/vehicles'

interface VehicleDetailPageProps {
  params: Promise<{ id: string }>
}

export default async function VehicleDetailPage({
  params,
}: VehicleDetailPageProps) {
  await requireAdmin()

  const { id } = await params

  const [vehicle, options] = await Promise.all([
    getVehicleById(id),
    getVehicleFormOptions(),
  ])

  if (!vehicle) {
    notFound()
  }

  return (
    <>
      <PageHeader
        title={`${vehicle.year} ${vehicle.make.name} ${vehicle.model.name}`}
        description={`VIN: ${vehicle.vin}`}
        actions={
          <Button asChild>
            <Link href={`/admin/vehicles/${vehicle.id}/edit`}>
              <Pencil className="mr-2 h-4 w-4" />
              Edit Vehicle
            </Link>
          </Button>
        }
      />

      <VehicleDetail vehicle={vehicle} statuses={options.statuses} />
    </>
  )
}
