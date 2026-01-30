'use client'

import { Suspense, useState, useEffect } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { Car, Loader2, ArrowLeft, Lock, CheckCircle, XCircle, Eye, EyeOff } from 'lucide-react'
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
import { Skeleton } from '@/components/ui/skeleton'
import { validateResetToken, resetPassword } from '@/lib/actions/password-reset'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { resetPasswordSchema, type ResetPasswordInput } from '@/lib/validations/auth'

function ResetPasswordForm() {
  const searchParams = useSearchParams()
  const token = searchParams.get('token')
  const t = useTranslations('auth')

  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isValidating, setIsValidating] = useState(true)
  const [isValidToken, setIsValidToken] = useState(false)
  const [tokenError, setTokenError] = useState('')
  const [isSuccess, setIsSuccess] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<ResetPasswordInput>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: '',
      confirmPassword: '',
    },
  })

  useEffect(() => {
    async function checkToken() {
      if (!token) {
        setTokenError(t('invalidLinkDescription'))
        setIsValidating(false)
        return
      }

      const result = await validateResetToken(token)
      setIsValidToken(result.valid)
      if (!result.valid) {
        setTokenError(result.message || t('invalidLinkDescription'))
      }
      setIsValidating(false)
    }

    checkToken()
  }, [token, t])

  const onSubmit = async (data: ResetPasswordInput) => {
    try {
      const result = await resetPassword(token!, data.password, data.confirmPassword)

      if (result.success) {
        setIsSuccess(true)
      } else {
        setError('root', { message: result.message })
      }
    } catch {
      setError('root', { message: t('invalidCredentials') })
    }
  }

  if (isValidating) {
    return (
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <Skeleton className="mx-auto mb-4 h-12 w-12 rounded-full" />
          <Skeleton className="mx-auto h-8 w-48" />
          <Skeleton className="mx-auto h-4 w-64" />
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!isValidToken) {
    return (
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
            <XCircle className="h-6 w-6 text-destructive" />
          </div>
          <CardTitle className="text-2xl">{t('invalidLink')}</CardTitle>
          <CardDescription>{tokenError}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-md bg-muted p-4 text-sm text-muted-foreground">
            <p>{t('invalidLinkDescription')}</p>
            <ul className="list-disc pl-4 mt-2 space-y-1">
              <li>{t('linkExpired')}</li>
              <li>{t('linkUsed')}</li>
              <li>{t('linkIncorrect')}</li>
            </ul>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-2">
          <Link href="/forgot-password" className="w-full">
            <Button className="w-full">{t('requestNewLink')}</Button>
          </Link>
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

  if (isSuccess) {
    return (
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
            <CheckCircle className="h-6 w-6 text-green-600" />
          </div>
          <CardTitle className="text-2xl">{t('passwordResetSuccess')}</CardTitle>
          <CardDescription>{t('passwordResetSuccessMessage')}</CardDescription>
        </CardHeader>
        <CardFooter>
          <Link href="/login" className="w-full">
            <Button className="w-full">{t('continueToLogin')}</Button>
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
        <CardTitle className="text-2xl">{t('resetPasswordTitle')}</CardTitle>
        <CardDescription>{t('resetPasswordDescription')}</CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit(onSubmit)}>
        <CardContent className="space-y-4">
          {errors.root && (
            <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              {errors.root.message}
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="password">{t('newPassword')}</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder={t('enterNewPassword')}
                {...register('password')}
                disabled={isSubmitting}
                className="pl-10 pr-10"
                aria-invalid={!!errors.password}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {errors.password ? (
              <p className="text-xs text-destructive">{errors.password.message}</p>
            ) : (
              <p className="text-xs text-muted-foreground">{t('passwordMinLength')}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">{t('confirmPassword')}</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                placeholder={t('confirmNewPassword')}
                {...register('confirmPassword')}
                disabled={isSubmitting}
                className="pl-10 pr-10"
                aria-invalid={!!errors.confirmPassword}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {errors.confirmPassword && (
              <p className="text-xs text-destructive">{errors.confirmPassword.message}</p>
            )}
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-2">
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {t('resetPassword')}
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

function ResetPasswordFallback() {
  return (
    <Card className="w-full max-w-md">
      <CardHeader className="space-y-1 text-center">
        <Skeleton className="mx-auto mb-4 h-12 w-12 rounded-full" />
        <Skeleton className="mx-auto h-8 w-48" />
        <Skeleton className="mx-auto h-4 w-64" />
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-10 w-full" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-10 w-full" />
        </div>
      </CardContent>
      <CardFooter className="flex flex-col gap-2">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </CardFooter>
    </Card>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<ResetPasswordFallback />}>
      <ResetPasswordForm />
    </Suspense>
  )
}
