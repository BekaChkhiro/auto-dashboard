'use client'

import { useTransition, useEffect } from 'react'
import { useForm } from 'react-hook-form'
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
import { toast } from '@/hooks/use-toast'
import { citySchema, type CityInput } from '@/lib/validations/settings'
import { createCity, updateCity, type CityItem } from '@/lib/actions/settings'

interface CityFormDialogProps {
  open: boolean
  onClose: () => void
  onSuccess: () => void
  city?: CityItem | null
  stateId: string
}

export function CityFormDialog({
  open,
  onClose,
  onSuccess,
  city,
  stateId,
}: CityFormDialogProps) {
  const [isPending, startTransition] = useTransition()
  const isEdit = !!city

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CityInput>({
    resolver: zodResolver(citySchema),
    defaultValues: {
      name: '',
      stateId: '',
    },
  })

  useEffect(() => {
    if (open) {
      reset({
        name: city?.name || '',
        stateId: city?.stateId || stateId,
      })
    }
  }, [open, city, stateId, reset])

  const onSubmit = (data: CityInput) => {
    startTransition(async () => {
      const result = isEdit
        ? await updateCity(city.id, data)
        : await createCity(data)

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

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit City' : 'Add City'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <input type="hidden" {...register('stateId')} />

          <div className="space-y-2">
            <Label htmlFor="name">City Name *</Label>
            <Input
              id="name"
              {...register('name')}
              placeholder="Enter city name"
            />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name.message}</p>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={isPending}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? 'Saving...' : isEdit ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
