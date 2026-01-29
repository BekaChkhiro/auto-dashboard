import { notFound } from 'next/navigation'
import { format } from 'date-fns'
import { requireAdmin } from '@/lib/auth'
import { PageHeader } from '@/components/layout/page-header'
import { Card, CardContent } from '@/components/ui/card'
import { VehicleForm } from '@/components/vehicles/vehicle-form'
import {
  getVehicleById,
  getVehicleFormOptions,
  getModelsByMake,
  getStatesByCountry,
  getCitiesByState,
  getPortsByState,
} from '@/lib/actions/vehicles'

interface VehicleEditPageProps {
  params: Promise<{ id: string }>
}

export default async function VehicleEditPage({ params }: VehicleEditPageProps) {
  await requireAdmin()

  const { id } = await params

  const [vehicle, options] = await Promise.all([
    getVehicleById(id),
    getVehicleFormOptions(),
  ])

  if (!vehicle) {
    notFound()
  }

  // Pre-fetch cascading select data for existing vehicle values
  const [models, states, citiesAndPorts] = await Promise.all([
    getModelsByMake(vehicle.make.id),
    getStatesByCountry(vehicle.country.id),
    Promise.all([
      getCitiesByState(vehicle.state.id),
      getPortsByState(vehicle.state.id),
    ]),
  ])

  const [cities, ports] = citiesAndPorts

  // Transform vehicle data to match form input shape
  const vehicleFormData = {
    id: vehicle.id,
    dealerId: vehicle.dealer.id,
    vin: vehicle.vin,
    makeId: vehicle.make.id,
    modelId: vehicle.model.id,
    year: vehicle.year,
    color: vehicle.color || '',
    damageType: vehicle.damageType,
    hasKeys: vehicle.hasKeys,
    auctionId: vehicle.auction.id,
    lotNumber: vehicle.lotNumber,
    auctionLink: vehicle.auctionLink || '',
    countryId: vehicle.country.id,
    stateId: vehicle.state.id,
    cityId: vehicle.city?.id || '',
    portId: vehicle.port?.id || '',
    transportationPrice: vehicle.transportationPrice,
    statusId: vehicle.status.id,
    shipName: vehicle.shipName || '',
    containerNumber: vehicle.containerNumber || '',
    eta: vehicle.eta ? format(new Date(vehicle.eta), 'yyyy-MM-dd') : '',
    photos: vehicle.photos,
  }

  // Extend options with pre-fetched cascading data
  const extendedOptions = {
    ...options,
    models,
    states,
    cities,
    ports,
  }

  return (
    <>
      <PageHeader
        title={`Edit ${vehicle.year} ${vehicle.make.name} ${vehicle.model.name}`}
        description={`VIN: ${vehicle.vin}`}
      />

      <Card>
        <CardContent className="pt-6">
          <VehicleForm
            mode="edit"
            options={extendedOptions}
            vehicle={vehicleFormData}
          />
        </CardContent>
      </Card>
    </>
  )
}
