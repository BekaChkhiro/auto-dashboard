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
import { statusSchema, type StatusInput } from '@/lib/validations/settings'
import { createStatus, updateStatus, type StatusItem } from '@/lib/actions/settings'

interface StatusFormDialogProps {
  open: boolean
  onClose: () => void
  onSuccess: () => void
  status?: StatusItem | null
  nextOrder: number
}

export function StatusFormDialog({
  open,
  onClose,
  onSuccess,
  status,
  nextOrder,
}: StatusFormDialogProps) {
  const [isPending, startTransition] = useTransition()
  const isEdit = !!status

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<StatusInput>({
    resolver: zodResolver(statusSchema),
    defaultValues: {
      nameKa: '',
      nameEn: '',
      order: nextOrder,
      color: '',
    },
  })

  const colorValue = watch('color')

  useEffect(() => {
    if (open) {
      reset({
        nameKa: status?.nameKa || '',
        nameEn: status?.nameEn || '',
        order: status?.order || nextOrder,
        color: status?.color || '',
      })
    }
  }, [open, status, nextOrder, reset])

  const onSubmit = (data: StatusInput) => {
    startTransition(async () => {
      const result = isEdit
        ? await updateStatus(status.id, data)
        : await createStatus(data)

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

  // Predefined color palette
  const colorPresets = [
    '#ef4444', // red
    '#f97316', // orange
    '#eab308', // yellow
    '#22c55e', // green
    '#14b8a6', // teal
    '#3b82f6', // blue
    '#8b5cf6', // violet
    '#ec4899', // pink
    '#6b7280', // gray
    '#1f2937', // dark
  ]

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Status' : 'Add Status'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="nameKa">Georgian Name *</Label>
              <Input
                id="nameKa"
                {...register('nameKa')}
                placeholder="სტატუსი"
              />
              {errors.nameKa && (
                <p className="text-sm text-destructive">{errors.nameKa.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="nameEn">English Name *</Label>
              <Input
                id="nameEn"
                {...register('nameEn')}
                placeholder="Status"
              />
              {errors.nameEn && (
                <p className="text-sm text-destructive">{errors.nameEn.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="order">Order</Label>
            <Input
              id="order"
              type="number"
              min="0"
              {...register('order', { valueAsNumber: true })}
            />
            {errors.order && (
              <p className="text-sm text-destructive">{errors.order.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Color</Label>
            <div className="flex items-center gap-2">
              <div className="flex gap-1 flex-wrap">
                {colorPresets.map((color) => (
                  <button
                    key={color}
                    type="button"
                    className="h-6 w-6 rounded border-2 transition-all hover:scale-110"
                    style={{
                      backgroundColor: color,
                      borderColor: colorValue === color ? 'black' : 'transparent',
                    }}
                    onClick={() => setValue('color', color)}
                  />
                ))}
              </div>
              <Input
                type="color"
                className="h-8 w-12 cursor-pointer p-0"
                value={colorValue || '#000000'}
                onChange={(e) => setValue('color', e.target.value)}
              />
              {colorValue && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setValue('color', '')}
                >
                  Clear
                </Button>
              )}
            </div>
            <Input
              {...register('color')}
              placeholder="#000000"
              className="mt-2"
            />
            {errors.color && (
              <p className="text-sm text-destructive">{errors.color.message}</p>
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
