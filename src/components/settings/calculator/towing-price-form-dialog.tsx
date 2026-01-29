'use client'

import { useTransition, useEffect, useState } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from '@/hooks/use-toast'
import { towingPriceSchema, type TowingPriceInput } from '@/lib/validations/settings'
import {
  createTowingPrice,
  updateTowingPrice,
  getAllCities,
  getAllPorts,
  type TowingPriceItem,
  type CityOption,
  type PortOption,
} from '@/lib/actions/settings'

interface TowingPriceFormDialogProps {
  open: boolean
  onClose: () => void
  onSuccess: () => void
  towingPrice?: TowingPriceItem | null
}

export function TowingPriceFormDialog({
  open,
  onClose,
  onSuccess,
  towingPrice,
}: TowingPriceFormDialogProps) {
  const [isPending, startTransition] = useTransition()
  const [cities, setCities] = useState<CityOption[]>([])
  const [ports, setPorts] = useState<PortOption[]>([])
  const [isLoadingOptions, setIsLoadingOptions] = useState(true)
  const isEdit = !!towingPrice

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors },
  } = useForm<TowingPriceInput>({
    resolver: zodResolver(towingPriceSchema),
    defaultValues: {
      price: 0,
      cityId: '',
      portId: '',
    },
  })

  useEffect(() => {
    const loadOptions = async () => {
      setIsLoadingOptions(true)
      try {
        const [citiesData, portsData] = await Promise.all([getAllCities(), getAllPorts()])
        setCities(citiesData)
        // Only show non-destination ports (origin ports in US/Canada)
        setPorts(portsData.filter((p) => !p.isDestination))
      } catch {
        toast({
          title: 'Error',
          description: 'Failed to load options',
          variant: 'destructive',
        })
      } finally {
        setIsLoadingOptions(false)
      }
    }

    if (open) {
      loadOptions()
    }
  }, [open])

  useEffect(() => {
    if (open) {
      reset({
        price: towingPrice?.price || 0,
        cityId: towingPrice?.cityId || '',
        portId: towingPrice?.portId || '',
      })
    }
  }, [open, towingPrice, reset])

  const onSubmit = (data: TowingPriceInput) => {
    startTransition(async () => {
      const result = isEdit
        ? await updateTowingPrice(towingPrice.id, data)
        : await createTowingPrice(data)

      if (result.success) {
        toast({
          title: 'Success',
          description: result.message,
          variant: 'success',
        })
        onSuccess()
      } else {
        toast({
          title: 'Error',
          description: result.message,
          variant: 'destructive',
        })
      }
    })
  }

  // Group cities by country/state
  const groupedCities = cities.reduce(
    (acc, city) => {
      const key = `${city.countryName} - ${city.stateName}`
      if (!acc[key]) {
        acc[key] = []
      }
      acc[key].push(city)
      return acc
    },
    {} as Record<string, CityOption[]>
  )

  // Group ports by country/state
  const groupedPorts = ports.reduce(
    (acc, port) => {
      const key = `${port.countryName} - ${port.stateName}`
      if (!acc[key]) {
        acc[key] = []
      }
      acc[key].push(port)
      return acc
    },
    {} as Record<string, PortOption[]>
  )

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Towing Price' : 'Add Towing Price'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="cityId">City (Origin) *</Label>
            <Controller
              name="cityId"
              control={control}
              render={({ field }) => (
                <Select
                  value={field.value}
                  onValueChange={field.onChange}
                  disabled={isLoadingOptions}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={isLoadingOptions ? 'Loading...' : 'Select city'} />
                  </SelectTrigger>
                  <SelectContent className="max-h-60">
                    {Object.entries(groupedCities).map(([group, groupCities]) => (
                      <div key={group}>
                        <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                          {group}
                        </div>
                        {groupCities.map((city) => (
                          <SelectItem key={city.id} value={city.id}>
                            {city.name}
                          </SelectItem>
                        ))}
                      </div>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.cityId && (
              <p className="text-sm text-destructive">{errors.cityId.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="portId">Port (Destination) *</Label>
            <Controller
              name="portId"
              control={control}
              render={({ field }) => (
                <Select
                  value={field.value}
                  onValueChange={field.onChange}
                  disabled={isLoadingOptions}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={isLoadingOptions ? 'Loading...' : 'Select port'} />
                  </SelectTrigger>
                  <SelectContent className="max-h-60">
                    {Object.entries(groupedPorts).map(([group, groupPorts]) => (
                      <div key={group}>
                        <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                          {group}
                        </div>
                        {groupPorts.map((port) => (
                          <SelectItem key={port.id} value={port.id}>
                            {port.name}
                          </SelectItem>
                        ))}
                      </div>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.portId && (
              <p className="text-sm text-destructive">{errors.portId.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="price">Price (USD) *</Label>
            <Input
              id="price"
              type="number"
              step="0.01"
              min="0"
              {...register('price', { valueAsNumber: true })}
              placeholder="Enter price"
            />
            {errors.price && (
              <p className="text-sm text-destructive">{errors.price.message}</p>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={isPending}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending || isLoadingOptions}>
              {isPending ? 'Saving...' : isEdit ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
