'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { Car, Loader2, ArrowLeft, Mail, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { requestPasswordReset } from '@/lib/actions/password-reset'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { forgotPasswordSchema, type ForgotPasswordInput } from '@/lib/validations/auth'

export default function ForgotPasswordPage() {
  const [isSuccess, setIsSuccess] = useState(false)
  const [submittedEmail, setSubmittedEmail] = useState('')
  const t = useTranslations('auth')

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
    reset,
  } = useForm<ForgotPasswordInput>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: '',
    },
  })

  const onSubmit = async (data: ForgotPasswordInput) => {
    try {
      // Get locale from document or default to 'en'
      const locale = document.documentElement.lang || 'en'
      const result = await requestPasswordReset(data.email, locale)

      if (result.success) {
        setSubmittedEmail(data.email)
        setIsSuccess(true)
      } else {
        setError('root', { message: result.message })
      }
    } catch {
      setError('root', { message: t('invalidCredentials') })
    }
  }

  if (isSuccess) {
    return (
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
            <CheckCircle className="h-6 w-6 text-green-600" />
          </div>
          <CardTitle className="text-2xl">{t('checkYourEmail')}</CardTitle>
          <CardDescription>
            {t('resetEmailSent').replace('{email}', submittedEmail)}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-md bg-muted p-4 text-sm text-muted-foreground">
            <p className="mb-2">
              <strong>{t('didntReceiveEmail')}</strong>
            </p>
            <ul className="list-disc pl-4 space-y-1">
              <li>{t('checkSpam')}</li>
              <li>{t('correctEmail')}</li>
              <li>{t('waitAndRetry')}</li>
            </ul>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-2">
          <Button
            variant="outline"
            className="w-full"
            onClick={() => {
              setIsSuccess(false)
              setSubmittedEmail('')
              reset()
            }}
          >
            {t('tryDifferentEmail')}
          </Button>
          <Link href="/login" className="w-full">
            <Button variant="ghost" className="w-full">
              <ArrowLeft className="mr-2 h-4 w-4" />
              {t('backToLogin')}
            </Button>
          </Link>
        </CardFooter>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="space-y-1 text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary">
          <Car className="h-6 w-6 text-primary-foreground" />
        </div>
        <CardTitle className="text-2xl">{t('forgotPasswordTitle')}</CardTitle>
        <CardDescription>{t('forgotPasswordDescription')}</CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit(onSubmit)}>
        <CardContent className="space-y-4">
          {errors.root && (
            <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              {errors.root.message}
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="email">{t('email')}</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                {...register('email')}
                disabled={isSubmitting}
                className="pl-10"
                aria-invalid={!!errors.email}
              />
            </div>
            {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-2">
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {t('sendResetLink')}
          </Button>
          <Link href="/login" className="w-full">
            <Button variant="ghost" className="w-full">
              <ArrowLeft className="mr-2 h-4 w-4" />
              {t('backToLogin')}
            </Button>
          </Link>
        </CardFooter>
      </form>
    </Card>
  )
}
