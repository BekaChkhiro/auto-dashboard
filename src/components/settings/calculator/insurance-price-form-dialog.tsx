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
import { insurancePriceSchema, type InsurancePriceInput } from '@/lib/validations/settings'
import {
  createInsurancePrice,
  updateInsurancePrice,
  type InsurancePriceItem,
} from '@/lib/actions/settings'

interface InsurancePriceFormDialogProps {
  open: boolean
  onClose: () => void
  onSuccess: () => void
  insurancePrice?: InsurancePriceItem | null
}

export function InsurancePriceFormDialog({
  open,
  onClose,
  onSuccess,
  insurancePrice,
}: InsurancePriceFormDialogProps) {
  const [isPending, startTransition] = useTransition()
  const isEdit = !!insurancePrice

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<InsurancePriceInput>({
    resolver: zodResolver(insurancePriceSchema),
    defaultValues: {
      minValue: 0,
      maxValue: 0,
      price: 0,
    },
  })

  useEffect(() => {
    if (open) {
      reset({
        minValue: insurancePrice?.minValue || 0,
        maxValue: insurancePrice?.maxValue || 0,
        price: insurancePrice?.price || 0,
      })
    }
  }, [open, insurancePrice, reset])

  const onSubmit = (data: InsurancePriceInput) => {
    startTransition(async () => {
      const result = isEdit
        ? await updateInsurancePrice(insurancePrice.id, data)
        : await createInsurancePrice(data)

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
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Insurance Price' : 'Add Insurance Price'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="minValue">Min Vehicle Value (USD) *</Label>
              <Input
                id="minValue"
                type="number"
                step="0.01"
                min="0"
                {...register('minValue', { valueAsNumber: true })}
                placeholder="0.00"
              />
              {errors.minValue && (
                <p className="text-sm text-destructive">{errors.minValue.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="maxValue">Max Vehicle Value (USD) *</Label>
              <Input
                id="maxValue"
                type="number"
                step="0.01"
                min="0"
                {...register('maxValue', { valueAsNumber: true })}
                placeholder="0.00"
              />
              {errors.maxValue && (
                <p className="text-sm text-destructive">{errors.maxValue.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="price">Insurance Price (USD) *</Label>
            <p className="text-xs text-muted-foreground">
              The insurance cost for vehicles within this value range
            </p>
            <Input
              id="price"
              type="number"
              step="0.01"
              min="0"
              {...register('price', { valueAsNumber: true })}
              placeholder="Enter insurance price"
            />
            {errors.price && (
              <p className="text-sm text-destructive">{errors.price.message}</p>
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
