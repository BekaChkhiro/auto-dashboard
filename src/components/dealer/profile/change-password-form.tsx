'use client'

import { useState, useTransition } from 'react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { changePassword } from '@/lib/actions/dealer-profile'
import { Loader2, Eye, EyeOff } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { changePasswordSchema, type ChangePasswordInput } from '@/lib/validations/dealer-profile'

export function ChangePasswordForm() {
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isPending, startTransition] = useTransition()
  const { toast } = useToast()
  const t = useTranslations('forms')
  const tToasts = useTranslations('toasts')

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    reset,
  } = useForm<ChangePasswordInput>({
    resolver: zodResolver(changePasswordSchema),
    mode: 'onChange',
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  })

  const onSubmit = (data: ChangePasswordInput) => {
    startTransition(async () => {
      const result = await changePassword(data)

      if (result.success) {
        toast({
          title: tToasts('passwordChanged'),
          description: result.message,
        })
        // Reset form
        reset()
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
        <Label htmlFor="currentPassword">{t('currentPassword')}</Label>
        <div className="relative">
          <Input
            id="currentPassword"
            type={showCurrentPassword ? 'text' : 'password'}
            placeholder={t('enterCurrentPassword')}
            {...register('currentPassword')}
            disabled={isPending}
            className="pr-10"
            aria-invalid={!!errors.currentPassword}
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
            onClick={() => setShowCurrentPassword(!showCurrentPassword)}
          >
            {showCurrentPassword ? (
              <EyeOff className="h-4 w-4 text-muted-foreground" />
            ) : (
              <Eye className="h-4 w-4 text-muted-foreground" />
            )}
          </Button>
        </div>
        {errors.currentPassword && (
          <p className="text-xs text-red-600">{errors.currentPassword.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="newPassword">{t('newPassword')}</Label>
        <div className="relative">
          <Input
            id="newPassword"
            type={showNewPassword ? 'text' : 'password'}
            placeholder={t('enterYourNewPassword')}
            {...register('newPassword')}
            disabled={isPending}
            className="pr-10"
            aria-invalid={!!errors.newPassword}
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
            onClick={() => setShowNewPassword(!showNewPassword)}
          >
            {showNewPassword ? (
              <EyeOff className="h-4 w-4 text-muted-foreground" />
            ) : (
              <Eye className="h-4 w-4 text-muted-foreground" />
            )}
          </Button>
        </div>
        {errors.newPassword && <p className="text-xs text-red-600">{errors.newPassword.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="confirmPassword">{t('confirmNewPassword')}</Label>
        <div className="relative">
          <Input
            id="confirmPassword"
            type={showConfirmPassword ? 'text' : 'password'}
            placeholder={t('confirmYourNewPassword')}
            {...register('confirmPassword')}
            disabled={isPending}
            className="pr-10"
            aria-invalid={!!errors.confirmPassword}
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
          >
            {showConfirmPassword ? (
              <EyeOff className="h-4 w-4 text-muted-foreground" />
            ) : (
              <Eye className="h-4 w-4 text-muted-foreground" />
            )}
          </Button>
        </div>
        {errors.confirmPassword && (
          <p className="text-xs text-red-600">{errors.confirmPassword.message}</p>
        )}
      </div>

      <Button type="submit" disabled={isPending || !isValid}>
        {isPending ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            {t('changingPassword')}
          </>
        ) : (
          t('changePassword')
        )}
      </Button>
    </form>
  )
}
