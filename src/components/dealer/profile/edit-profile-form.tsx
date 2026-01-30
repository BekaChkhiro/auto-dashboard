'use client'

import { useTransition } from 'react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { updateDealerProfile } from '@/lib/actions/dealer-profile'
import { Loader2 } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  updateDealerProfileSchema,
  type UpdateDealerProfileInput,
} from '@/lib/validations/dealer-profile'

interface EditProfileFormProps {
  initialPhone: string
  initialAddress: string
}

export function EditProfileForm({ initialPhone, initialAddress }: EditProfileFormProps) {
  const [isPending, startTransition] = useTransition()
  const { toast } = useToast()
  const t = useTranslations('forms')
  const tToasts = useTranslations('toasts')

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
  } = useForm<UpdateDealerProfileInput>({
    resolver: zodResolver(updateDealerProfileSchema),
    defaultValues: {
      phone: initialPhone,
      address: initialAddress,
    },
  })

  const onSubmit = (data: UpdateDealerProfileInput) => {
    if (!isDirty) {
      toast({
        title: tToasts('noChanges'),
        description: tToasts('noChangesDesc'),
      })
      return
    }

    startTransition(async () => {
      const result = await updateDealerProfile(data)

      if (result.success) {
        toast({
          title: tToasts('profileUpdated'),
          description: result.message,
        })
      } else {
        toast({
          title: tToasts('changeFailed'),
          description: result.message,
          variant: 'destructive',
        })
      }
    })
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="phone">{t('phoneNumber')}</Label>
        <Input
          id="phone"
          type="tel"
          placeholder={t('enterYourPhone')}
          {...register('phone')}
          disabled={isPending}
          aria-invalid={!!errors.phone}
        />
        {errors.phone && <p className="text-xs text-red-600">{errors.phone.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="address">{t('address')}</Label>
        <Input
          id="address"
          type="text"
          placeholder={t('enterYourAddress')}
          {...register('address')}
          disabled={isPending}
          aria-invalid={!!errors.address}
        />
        {errors.address && <p className="text-xs text-red-600">{errors.address.message}</p>}
      </div>

      <Button type="submit" disabled={isPending || !isDirty}>
        {isPending ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            {t('saving')}
          </>
        ) : (
          t('saveChanges')
        )}
      </Button>
    </form>
  )
}
