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
import { auctionSchema, type AuctionInput } from '@/lib/validations/settings'
import { createAuction, updateAuction, type AuctionItem } from '@/lib/actions/settings'

interface AuctionFormDialogProps {
  open: boolean
  onClose: () => void
  onSuccess: () => void
  auction?: AuctionItem | null
}

export function AuctionFormDialog({ open, onClose, onSuccess, auction }: AuctionFormDialogProps) {
  const [isPending, startTransition] = useTransition()
  const isEdit = !!auction

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<AuctionInput>({
    resolver: zodResolver(auctionSchema),
    defaultValues: {
      name: '',
    },
  })

  useEffect(() => {
    if (open) {
      reset({
        name: auction?.name || '',
      })
    }
  }, [open, auction, reset])

  const onSubmit = (data: AuctionInput) => {
    startTransition(async () => {
      const result = isEdit
        ? await updateAuction(auction.id, data)
        : await createAuction(data)

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
          <DialogTitle>{isEdit ? 'Edit Auction' : 'Add Auction'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name *</Label>
            <Input
              id="name"
              {...register('name')}
              placeholder="Enter auction name"
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
