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
import { makeSchema, type MakeInput } from '@/lib/validations/settings'
import { createMake, updateMake, type MakeItem } from '@/lib/actions/settings'

interface MakeFormDialogProps {
  open: boolean
  onClose: () => void
  onSuccess: () => void
  make?: MakeItem | null
}

export function MakeFormDialog({ open, onClose, onSuccess, make }: MakeFormDialogProps) {
  const [isPending, startTransition] = useTransition()
  const isEdit = !!make

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<MakeInput>({
    resolver: zodResolver(makeSchema),
    defaultValues: {
      name: '',
    },
  })

  useEffect(() => {
    if (open) {
      reset({
        name: make?.name || '',
      })
    }
  }, [open, make, reset])

  const onSubmit = (data: MakeInput) => {
    startTransition(async () => {
      const result = isEdit
        ? await updateMake(make.id, data)
        : await createMake(data)

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
          <DialogTitle>{isEdit ? 'Edit Make' : 'Add Make'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name *</Label>
            <Input
              id="name"
              {...register('name')}
              placeholder="Enter make name (e.g., Toyota)"
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
