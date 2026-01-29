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
import { Checkbox } from '@/components/ui/checkbox'
import { toast } from '@/hooks/use-toast'
import { portSchema, type PortInput } from '@/lib/validations/settings'
import { createPort, updatePort, type PortItem } from '@/lib/actions/settings'

interface PortFormDialogProps {
  open: boolean
  onClose: () => void
  onSuccess: () => void
  port?: PortItem | null
  stateId: string
}

export function PortFormDialog({
  open,
  onClose,
  onSuccess,
  port,
  stateId,
}: PortFormDialogProps) {
  const [isPending, startTransition] = useTransition()
  const isEdit = !!port

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<PortInput>({
    resolver: zodResolver(portSchema),
    defaultValues: {
      name: '',
      isDestination: false,
      stateId: '',
    },
  })

  const isDestination = watch('isDestination')

  useEffect(() => {
    if (open) {
      reset({
        name: port?.name || '',
        isDestination: port?.isDestination || false,
        stateId: port?.stateId || stateId,
      })
    }
  }, [open, port, stateId, reset])

  const onSubmit = (data: PortInput) => {
    startTransition(async () => {
      const result = isEdit
        ? await updatePort(port.id, data)
        : await createPort(data)

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
          <DialogTitle>{isEdit ? 'Edit Port' : 'Add Port'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <input type="hidden" {...register('stateId')} />

          <div className="space-y-2">
            <Label htmlFor="name">Port Name *</Label>
            <Input
              id="name"
              {...register('name')}
              placeholder="Enter port name"
            />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name.message}</p>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="isDestination"
              checked={isDestination}
              onCheckedChange={(checked) => setValue('isDestination', !!checked)}
            />
            <Label htmlFor="isDestination" className="cursor-pointer">
              Destination Port
            </Label>
          </div>
          <p className="text-xs text-muted-foreground">
            Check this if this is a destination port (e.g., Georgian ports)
          </p>

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
