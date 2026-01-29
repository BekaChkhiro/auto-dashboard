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
import { stateSchema, type StateInput } from '@/lib/validations/settings'
import { createState, updateState, type StateItem } from '@/lib/actions/settings'

interface StateFormDialogProps {
  open: boolean
  onClose: () => void
  onSuccess: () => void
  state?: StateItem | null
  countryId: string
}

export function StateFormDialog({
  open,
  onClose,
  onSuccess,
  state,
  countryId,
}: StateFormDialogProps) {
  const [isPending, startTransition] = useTransition()
  const isEdit = !!state

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<StateInput>({
    resolver: zodResolver(stateSchema),
    defaultValues: {
      nameKa: '',
      nameEn: '',
      code: '',
      countryId: '',
    },
  })

  useEffect(() => {
    if (open) {
      reset({
        nameKa: state?.nameKa || '',
        nameEn: state?.nameEn || '',
        code: state?.code || '',
        countryId: state?.countryId || countryId,
      })
    }
  }, [open, state, countryId, reset])

  const onSubmit = (data: StateInput) => {
    startTransition(async () => {
      const result = isEdit
        ? await updateState(state.id, data)
        : await createState(data)

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
          <DialogTitle>{isEdit ? 'Edit State' : 'Add State'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <input type="hidden" {...register('countryId')} />

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="nameKa">Georgian Name *</Label>
              <Input
                id="nameKa"
                {...register('nameKa')}
                placeholder="შტატი"
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
                placeholder="State"
              />
              {errors.nameEn && (
                <p className="text-sm text-destructive">{errors.nameEn.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="code">State Code *</Label>
            <Input
              id="code"
              {...register('code')}
              placeholder="CA"
              className="uppercase"
            />
            <p className="text-xs text-muted-foreground">State abbreviation (e.g., CA, NY, TX)</p>
            {errors.code && (
              <p className="text-sm text-destructive">{errors.code.message}</p>
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
