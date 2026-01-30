'use client'

import { useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { AlertTriangle, RefreshCcw, Home } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  const t = useTranslations('errorPages')

  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Application error:', error)
  }, [error])

  return (
    <div className="flex min-h-screen items-center justify-center p-4 bg-background">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
            <AlertTriangle className="h-8 w-8 text-destructive" />
          </div>
          <CardTitle className="text-2xl">{t('somethingWentWrong')}</CardTitle>
          <CardDescription>{t('unexpectedError')}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg bg-muted p-4">
            <p className="text-sm font-mono text-muted-foreground break-all">
              {error.message || t('unknownError')}
            </p>
            {error.digest && (
              <p className="mt-2 text-xs text-muted-foreground">
                {t('errorId')}: {error.digest}
              </p>
            )}
          </div>
        </CardContent>
        <CardFooter className="flex justify-center gap-4">
          <Button onClick={reset} variant="outline">
            <RefreshCcw className="mr-2 h-4 w-4" />
            {t('tryAgain')}
          </Button>
          <Button onClick={() => (window.location.href = '/')}>
            <Home className="mr-2 h-4 w-4" />
            {t('goHome')}
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
