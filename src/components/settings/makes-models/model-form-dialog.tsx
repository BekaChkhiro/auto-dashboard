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
import { modelSchema, type ModelInput } from '@/lib/validations/settings'
import { createModel, updateModel, type ModelItem } from '@/lib/actions/settings'

interface ModelFormDialogProps {
  open: boolean
  onClose: () => void
  onSuccess: (makeId: string) => void
  model?: ModelItem | null
  makeId: string
}

export function ModelFormDialog({ open, onClose, onSuccess, model, makeId }: ModelFormDialogProps) {
  const [isPending, startTransition] = useTransition()
  const isEdit = !!model

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ModelInput>({
    resolver: zodResolver(modelSchema),
    defaultValues: {
      name: '',
      makeId: '',
    },
  })

  useEffect(() => {
    if (open) {
      reset({
        name: model?.name || '',
        makeId: model?.makeId || makeId,
      })
    }
  }, [open, model, makeId, reset])

  const onSubmit = (data: ModelInput) => {
    startTransition(async () => {
      const result = isEdit
        ? await updateModel(model.id, data)
        : await createModel(data)

      if (result.success) {
        toast({
          title: 'Success',
          description: result.message,
          variant: 'success',
        })
        onSuccess(data.makeId)
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
          <DialogTitle>{isEdit ? 'Edit Model' : 'Add Model'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <input type="hidden" {...register('makeId')} />

          <div className="space-y-2">
            <Label htmlFor="name">Name *</Label>
            <Input
              id="name"
              {...register('name')}
              placeholder="Enter model name (e.g., Camry)"
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
