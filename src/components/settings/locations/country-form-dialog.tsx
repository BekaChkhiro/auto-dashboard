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
import { countrySchema, type CountryInput } from '@/lib/validations/settings'
import { createCountry, updateCountry, type CountryItem } from '@/lib/actions/settings'

interface CountryFormDialogProps {
  open: boolean
  onClose: () => void
  onSuccess: () => void
  country?: CountryItem | null
}

export function CountryFormDialog({ open, onClose, onSuccess, country }: CountryFormDialogProps) {
  const [isPending, startTransition] = useTransition()
  const isEdit = !!country

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CountryInput>({
    resolver: zodResolver(countrySchema),
    defaultValues: {
      nameKa: '',
      nameEn: '',
      code: '',
    },
  })

  useEffect(() => {
    if (open) {
      reset({
        nameKa: country?.nameKa || '',
        nameEn: country?.nameEn || '',
        code: country?.code || '',
      })
    }
  }, [open, country, reset])

  const onSubmit = (data: CountryInput) => {
    startTransition(async () => {
      const result = isEdit
        ? await updateCountry(country.id, data)
        : await createCountry(data)

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
          <DialogTitle>{isEdit ? 'Edit Country' : 'Add Country'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="nameKa">Georgian Name *</Label>
              <Input
                id="nameKa"
                {...register('nameKa')}
                placeholder="ქვეყანა"
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
                placeholder="Country"
              />
              {errors.nameEn && (
                <p className="text-sm text-destructive">{errors.nameEn.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="code">Country Code *</Label>
            <Input
              id="code"
              {...register('code')}
              placeholder="US"
              maxLength={3}
              className="uppercase"
            />
            <p className="text-xs text-muted-foreground">2-3 letter country code (e.g., US, USA)</p>
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
