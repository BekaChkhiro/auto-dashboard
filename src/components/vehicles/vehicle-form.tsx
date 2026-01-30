'use client'

import { useState, useEffect, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast } from '@/hooks/use-toast'
import {
  createVehicle,
  updateVehicle,
  getModelsByMake,
  getStatesByCountry,
  getCitiesByState,
  getPortsByState,
  type VehicleFormOptions,
  type ModelOption,
  type StateOption,
  type CityOption,
  type PortOption,
} from '@/lib/actions/vehicles'
import {
  createVehicleSchema,
  damageTypeOptions,
  type CreateVehicleInput,
  type DamageTypeValue,
} from '@/lib/validations/vehicle'
import { PhotoManager } from './photo-manager'
import { AlertCircle } from 'lucide-react'
import type { PhotoStage } from '@/generated/prisma'

interface VehiclePhoto {
  id: string
  url: string
  stage: PhotoStage
  order: number
}

interface ExtendedFormOptions extends VehicleFormOptions {
  models?: ModelOption[]
  states?: StateOption[]
  cities?: CityOption[]
  ports?: PortOption[]
}

interface VehicleFormProps {
  mode: 'create' | 'edit'
  options: ExtendedFormOptions
  vehicle?: CreateVehicleInput & { id: string; photos?: VehiclePhoto[] }
}

export function VehicleForm({ mode, options, vehicle }: VehicleFormProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const isEdit = mode === 'edit'

  // Cascading data state - initialize with pre-fetched data if available
  const [models, setModels] = useState<ModelOption[]>(options.models || [])
  const [states, setStates] = useState<StateOption[]>(options.states || [])
  const [cities, setCities] = useState<CityOption[]>(options.cities || [])
  const [ports, setPorts] = useState<PortOption[]>(options.ports || [])
  const [isLoadingModels, setIsLoadingModels] = useState(false)
  const [isLoadingStates, setIsLoadingStates] = useState(false)
  const [isLoadingCities, setIsLoadingCities] = useState(false)
  const [isLoadingPorts, setIsLoadingPorts] = useState(false)

  // Track if this is the initial mount to skip redundant fetches
  const [initialLoadDone, setInitialLoadDone] = useState(false)

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CreateVehicleInput>({
    resolver: zodResolver(createVehicleSchema),
    defaultValues: vehicle ?? {
      dealerId: '',
      vin: '',
      makeId: '',
      modelId: '',
      year: new Date().getFullYear(),
      color: '',
      damageType: 'CLEAN',
      hasKeys: true,
      auctionId: '',
      lotNumber: '',
      auctionLink: '',
      countryId: '',
      stateId: '',
      cityId: '',
      portId: '',
      transportationPrice: 0,
      statusId: '',
      shipName: '',
      containerNumber: '',
      eta: '',
    },
  })

  // Watch values for cascading selects
  const makeId = watch('makeId')
  const countryId = watch('countryId')
  const stateId = watch('stateId')
  const dealerId = watch('dealerId')
  const selectedModelId = watch('modelId')
  const auctionId = watch('auctionId')
  const statusId = watch('statusId')
  const selectedStateId = watch('stateId')
  const selectedCityId = watch('cityId')
  const selectedPortId = watch('portId')
  const selectedDamageType = watch('damageType')
  const hasKeys = watch('hasKeys')

  // Fetch models when make changes
  useEffect(() => {
    if (makeId) {
      // Skip fetch if we have pre-fetched data for the initial value
      if (
        !initialLoadDone &&
        options.models &&
        options.models.length > 0 &&
        vehicle?.makeId === makeId
      ) {
        setInitialLoadDone(true)
        return
      }

      setIsLoadingModels(true)
      getModelsByMake(makeId)
        .then((data) => {
          setModels(data)
          // Only clear modelId if we're not in edit mode with initial data
          if (!vehicle || vehicle.makeId !== makeId) {
            setValue('modelId', '')
          }
        })
        .finally(() => setIsLoadingModels(false))
    } else {
      setModels([])
      setValue('modelId', '')
    }
  }, [makeId, setValue, vehicle, initialLoadDone, options.models])

  // Fetch states when country changes
  useEffect(() => {
    if (countryId) {
      // Skip fetch if we have pre-fetched data for the initial value
      if (options.states && options.states.length > 0 && vehicle?.countryId === countryId) {
        return
      }

      setIsLoadingStates(true)
      getStatesByCountry(countryId)
        .then((data) => {
          setStates(data)
          if (!vehicle || vehicle.countryId !== countryId) {
            setValue('stateId', '')
            setValue('cityId', '')
            setValue('portId', '')
          }
        })
        .finally(() => setIsLoadingStates(false))
    } else {
      setStates([])
      setValue('stateId', '')
      setValue('cityId', '')
      setValue('portId', '')
    }
  }, [countryId, setValue, vehicle, options.states])

  // Fetch cities and ports when state changes
  useEffect(() => {
    if (stateId) {
      // Skip fetch if we have pre-fetched data for the initial value
      if (options.cities && options.ports && vehicle?.stateId === stateId) {
        return
      }

      setIsLoadingCities(true)
      setIsLoadingPorts(true)

      Promise.all([getCitiesByState(stateId), getPortsByState(stateId)])
        .then(([citiesData, portsData]) => {
          setCities(citiesData)
          setPorts(portsData)
          if (!vehicle || vehicle.stateId !== stateId) {
            setValue('cityId', '')
            setValue('portId', '')
          }
        })
        .finally(() => {
          setIsLoadingCities(false)
          setIsLoadingPorts(false)
        })
    } else {
      setCities([])
      setPorts([])
      setValue('cityId', '')
      setValue('portId', '')
    }
  }, [stateId, setValue, vehicle, options.cities, options.ports])

  const onSubmit = (data: CreateVehicleInput) => {
    startTransition(async () => {
      let result

      if (isEdit && vehicle) {
        result = await updateVehicle(vehicle.id, data)
      } else {
        result = await createVehicle(data)
      }

      if (result.success) {
        toast({
          title: 'Success',
          description: result.message,
          variant: 'success',
        })
        // Redirect to detail page or list page
        if (isEdit && vehicle) {
          router.push(`/admin/vehicles/${vehicle.id}`)
        } else if ('vehicleId' in result && result.vehicleId) {
          router.push(`/admin/vehicles/${result.vehicleId}`)
        } else {
          router.push('/admin/vehicles')
        }
      } else {
        toast({
          title: 'Error',
          description: result.message,
          variant: 'destructive',
        })
      }
    })
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Tabs defaultValue="basic" className="w-full">
        <TabsList className="mb-6 flex-nowrap">
          <TabsTrigger value="basic" className="min-w-fit">
            Basic Info
          </TabsTrigger>
          <TabsTrigger value="auction" className="min-w-fit">
            Auction
          </TabsTrigger>
          <TabsTrigger value="location" className="min-w-fit">
            Location
          </TabsTrigger>
          <TabsTrigger value="transportation" className="min-w-fit">
            Transport
          </TabsTrigger>
          <TabsTrigger value="photos" className="min-w-fit">
            Photos
          </TabsTrigger>
        </TabsList>

        {/* Basic Info Tab */}
        <TabsContent value="basic" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Dealer */}
            <div className="space-y-2">
              <Label htmlFor="dealerId">Dealer *</Label>
              <Select value={dealerId} onValueChange={(value) => setValue('dealerId', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select dealer" />
                </SelectTrigger>
                <SelectContent>
                  {options.dealers.map((dealer) => (
                    <SelectItem key={dealer.id} value={dealer.id}>
                      {dealer.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.dealerId && (
                <p className="text-sm text-destructive">{errors.dealerId.message}</p>
              )}
            </div>

            {/* VIN */}
            <div className="space-y-2">
              <Label htmlFor="vin">VIN *</Label>
              <Input
                id="vin"
                {...register('vin')}
                placeholder="17-character VIN"
                maxLength={17}
                className="uppercase"
              />
              {errors.vin && <p className="text-sm text-destructive">{errors.vin.message}</p>}
            </div>

            {/* Make */}
            <div className="space-y-2">
              <Label htmlFor="makeId">Make *</Label>
              <Select value={makeId} onValueChange={(value) => setValue('makeId', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select make" />
                </SelectTrigger>
                <SelectContent>
                  {options.makes.map((make) => (
                    <SelectItem key={make.id} value={make.id}>
                      {make.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.makeId && <p className="text-sm text-destructive">{errors.makeId.message}</p>}
            </div>

            {/* Model */}
            <div className="space-y-2">
              <Label htmlFor="modelId">Model *</Label>
              <Select
                value={selectedModelId}
                onValueChange={(value) => setValue('modelId', value)}
                disabled={!makeId || isLoadingModels}
              >
                <SelectTrigger>
                  <SelectValue
                    placeholder={
                      isLoadingModels
                        ? 'Loading...'
                        : !makeId
                          ? 'Select make first'
                          : 'Select model'
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {models.map((model) => (
                    <SelectItem key={model.id} value={model.id}>
                      {model.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.modelId && (
                <p className="text-sm text-destructive">{errors.modelId.message}</p>
              )}
            </div>

            {/* Year */}
            <div className="space-y-2">
              <Label htmlFor="year">Year *</Label>
              <Input
                id="year"
                type="number"
                {...register('year', { valueAsNumber: true })}
                placeholder="2024"
                min={1900}
                max={new Date().getFullYear() + 1}
              />
              {errors.year && <p className="text-sm text-destructive">{errors.year.message}</p>}
            </div>

            {/* Color */}
            <div className="space-y-2">
              <Label htmlFor="color">Color</Label>
              <Input id="color" {...register('color')} placeholder="e.g., White, Black, Silver" />
              {errors.color && <p className="text-sm text-destructive">{errors.color.message}</p>}
            </div>

            {/* Damage Type */}
            <div className="space-y-2">
              <Label htmlFor="damageType">Damage Type</Label>
              <Select
                value={selectedDamageType}
                onValueChange={(value) => setValue('damageType', value as DamageTypeValue)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select damage type" />
                </SelectTrigger>
                <SelectContent>
                  {damageTypeOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.damageType && (
                <p className="text-sm text-destructive">{errors.damageType.message}</p>
              )}
            </div>

            {/* Has Keys */}
            <div className="space-y-2">
              <Label>Has Keys</Label>
              <div className="flex items-center space-x-2 pt-2">
                <Checkbox
                  id="hasKeys"
                  checked={hasKeys}
                  onCheckedChange={(checked) => setValue('hasKeys', checked === true)}
                />
                <label
                  htmlFor="hasKeys"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Vehicle has keys
                </label>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* Auction Tab */}
        <TabsContent value="auction" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Auction */}
            <div className="space-y-2">
              <Label htmlFor="auctionId">Auction *</Label>
              <Select value={auctionId} onValueChange={(value) => setValue('auctionId', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select auction" />
                </SelectTrigger>
                <SelectContent>
                  {options.auctions.map((auction) => (
                    <SelectItem key={auction.id} value={auction.id}>
                      {auction.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.auctionId && (
                <p className="text-sm text-destructive">{errors.auctionId.message}</p>
              )}
            </div>

            {/* Lot Number */}
            <div className="space-y-2">
              <Label htmlFor="lotNumber">Lot Number *</Label>
              <Input id="lotNumber" {...register('lotNumber')} placeholder="Enter lot number" />
              {errors.lotNumber && (
                <p className="text-sm text-destructive">{errors.lotNumber.message}</p>
              )}
            </div>

            {/* Auction Link */}
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="auctionLink">Auction Link</Label>
              <Input
                id="auctionLink"
                {...register('auctionLink')}
                placeholder="https://..."
                type="url"
              />
              {errors.auctionLink && (
                <p className="text-sm text-destructive">{errors.auctionLink.message}</p>
              )}
            </div>
          </div>
        </TabsContent>

        {/* Location Tab */}
        <TabsContent value="location" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Country */}
            <div className="space-y-2">
              <Label htmlFor="countryId">Country *</Label>
              <Select value={countryId} onValueChange={(value) => setValue('countryId', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select country" />
                </SelectTrigger>
                <SelectContent>
                  {options.countries.map((country) => (
                    <SelectItem key={country.id} value={country.id}>
                      {country.nameEn}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.countryId && (
                <p className="text-sm text-destructive">{errors.countryId.message}</p>
              )}
            </div>

            {/* State */}
            <div className="space-y-2">
              <Label htmlFor="stateId">State *</Label>
              <Select
                value={selectedStateId}
                onValueChange={(value) => setValue('stateId', value)}
                disabled={!countryId || isLoadingStates}
              >
                <SelectTrigger>
                  <SelectValue
                    placeholder={
                      isLoadingStates
                        ? 'Loading...'
                        : !countryId
                          ? 'Select country first'
                          : 'Select state'
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {states.map((state) => (
                    <SelectItem key={state.id} value={state.id}>
                      {state.nameEn}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.stateId && (
                <p className="text-sm text-destructive">{errors.stateId.message}</p>
              )}
            </div>

            {/* City */}
            <div className="space-y-2">
              <Label htmlFor="cityId">City</Label>
              <Select
                value={selectedCityId || ''}
                onValueChange={(value) => setValue('cityId', value)}
                disabled={!stateId || isLoadingCities}
              >
                <SelectTrigger>
                  <SelectValue
                    placeholder={
                      isLoadingCities
                        ? 'Loading...'
                        : !stateId
                          ? 'Select state first'
                          : 'Select city (optional)'
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {cities.map((city) => (
                    <SelectItem key={city.id} value={city.id}>
                      {city.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.cityId && <p className="text-sm text-destructive">{errors.cityId.message}</p>}
            </div>

            {/* Port */}
            <div className="space-y-2">
              <Label htmlFor="portId">Port</Label>
              <Select
                value={selectedPortId || ''}
                onValueChange={(value) => setValue('portId', value)}
                disabled={!stateId || isLoadingPorts}
              >
                <SelectTrigger>
                  <SelectValue
                    placeholder={
                      isLoadingPorts
                        ? 'Loading...'
                        : !stateId
                          ? 'Select state first'
                          : 'Select port (optional)'
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {ports.map((port) => (
                    <SelectItem key={port.id} value={port.id}>
                      {port.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.portId && <p className="text-sm text-destructive">{errors.portId.message}</p>}
            </div>
          </div>
        </TabsContent>

        {/* Transportation Tab */}
        <TabsContent value="transportation" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Transportation Price */}
            <div className="space-y-2">
              <Label htmlFor="transportationPrice">Transportation Price *</Label>
              <Input
                id="transportationPrice"
                type="number"
                step="0.01"
                min="0"
                {...register('transportationPrice', { valueAsNumber: true })}
                placeholder="0.00"
              />
              {errors.transportationPrice && (
                <p className="text-sm text-destructive">{errors.transportationPrice.message}</p>
              )}
            </div>

            {/* Status */}
            <div className="space-y-2">
              <Label htmlFor="statusId">Status *</Label>
              <Select value={statusId} onValueChange={(value) => setValue('statusId', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  {options.statuses.map((status) => (
                    <SelectItem key={status.id} value={status.id}>
                      {status.nameEn}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.statusId && (
                <p className="text-sm text-destructive">{errors.statusId.message}</p>
              )}
            </div>

            {/* Ship Name */}
            <div className="space-y-2">
              <Label htmlFor="shipName">Ship Name</Label>
              <Input id="shipName" {...register('shipName')} placeholder="Enter ship name" />
              {errors.shipName && (
                <p className="text-sm text-destructive">{errors.shipName.message}</p>
              )}
            </div>

            {/* Container Number */}
            <div className="space-y-2">
              <Label htmlFor="containerNumber">Container Number</Label>
              <Input
                id="containerNumber"
                {...register('containerNumber')}
                placeholder="Enter container number"
              />
              {errors.containerNumber && (
                <p className="text-sm text-destructive">{errors.containerNumber.message}</p>
              )}
            </div>

            {/* ETA */}
            <div className="space-y-2">
              <Label htmlFor="eta">ETA</Label>
              <Input id="eta" type="date" {...register('eta')} />
              {errors.eta && <p className="text-sm text-destructive">{errors.eta.message}</p>}
            </div>
          </div>
        </TabsContent>

        {/* Photos Tab */}
        <TabsContent value="photos" className="space-y-6">
          {isEdit && vehicle ? (
            <PhotoManager vehicleId={vehicle.id} photos={vehicle.photos || []} />
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="rounded-full bg-muted p-4 mb-4">
                <AlertCircle className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium mb-2">Photos Not Available</h3>
              <p className="text-muted-foreground max-w-md">
                Save the vehicle first to add photos. Photo uploads require a saved vehicle record.
              </p>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Form Actions */}
      <div className="flex flex-col-reverse gap-3 mt-8 pt-6 border-t sm:flex-row sm:gap-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push('/admin/vehicles')}
          disabled={isPending}
          className="w-full sm:w-auto"
        >
          Cancel
        </Button>
        <Button type="submit" disabled={isPending} className="w-full sm:w-auto">
          {isPending
            ? isEdit
              ? 'Updating...'
              : 'Creating...'
            : isEdit
              ? 'Update Vehicle'
              : 'Create Vehicle'}
        </Button>
      </div>
    </form>
  )
}
