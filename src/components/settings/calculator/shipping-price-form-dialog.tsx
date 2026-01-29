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
import { shippingPriceSchema, type ShippingPriceInput } from '@/lib/validations/settings'
import {
  createShippingPrice,
  updateShippingPrice,
  getAllPorts,
  type ShippingPriceItem,
  type PortOption,
} from '@/lib/actions/settings'

interface ShippingPriceFormDialogProps {
  open: boolean
  onClose: () => void
  onSuccess: () => void
  shippingPrice?: ShippingPriceItem | null
}

export function ShippingPriceFormDialog({
  open,
  onClose,
  onSuccess,
  shippingPrice,
}: ShippingPriceFormDialogProps) {
  const [isPending, startTransition] = useTransition()
  const [ports, setPorts] = useState<PortOption[]>([])
  const [isLoadingOptions, setIsLoadingOptions] = useState(true)
  const isEdit = !!shippingPrice

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors },
  } = useForm<ShippingPriceInput>({
    resolver: zodResolver(shippingPriceSchema),
    defaultValues: {
      price: 0,
      originPortId: '',
      destinationPortId: '',
    },
  })

  useEffect(() => {
    const loadOptions = async () => {
      setIsLoadingOptions(true)
      try {
        const portsData = await getAllPorts()
        setPorts(portsData)
      } catch {
        toast({
          title: 'Error',
          description: 'Failed to load ports',
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
        price: shippingPrice?.price || 0,
        originPortId: shippingPrice?.originPortId || '',
        destinationPortId: shippingPrice?.destinationPortId || '',
      })
    }
  }, [open, shippingPrice, reset])

  const onSubmit = (data: ShippingPriceInput) => {
    startTransition(async () => {
      const result = isEdit
        ? await updateShippingPrice(shippingPrice.id, data)
        : await createShippingPrice(data)

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

  // Get origin ports (non-destination - US/Canada ports)
  const originPorts = ports.filter((p) => !p.isDestination)

  // Get destination ports (Georgia ports)
  const destinationPorts = ports.filter((p) => p.isDestination)

  // Group origin ports by country/state
  const groupedOriginPorts = originPorts.reduce(
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

  // Group destination ports by country/state
  const groupedDestinationPorts = destinationPorts.reduce(
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
          <DialogTitle>{isEdit ? 'Edit Shipping Price' : 'Add Shipping Price'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="originPortId">Origin Port (US/Canada) *</Label>
            <Controller
              name="originPortId"
              control={control}
              render={({ field }) => (
                <Select
                  value={field.value}
                  onValueChange={field.onChange}
                  disabled={isLoadingOptions}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={isLoadingOptions ? 'Loading...' : 'Select origin port'} />
                  </SelectTrigger>
                  <SelectContent className="max-h-60">
                    {Object.entries(groupedOriginPorts).map(([group, groupPorts]) => (
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
            {errors.originPortId && (
              <p className="text-sm text-destructive">{errors.originPortId.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="destinationPortId">Destination Port (Georgia) *</Label>
            <Controller
              name="destinationPortId"
              control={control}
              render={({ field }) => (
                <Select
                  value={field.value}
                  onValueChange={field.onChange}
                  disabled={isLoadingOptions}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={isLoadingOptions ? 'Loading...' : 'Select destination port'} />
                  </SelectTrigger>
                  <SelectContent className="max-h-60">
                    {Object.entries(groupedDestinationPorts).map(([group, groupPorts]) => (
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
            {errors.destinationPortId && (
              <p className="text-sm text-destructive">{errors.destinationPortId.message}</p>
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
