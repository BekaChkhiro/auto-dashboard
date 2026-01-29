'use client'

import { useTransition, useState, useEffect } from 'react'
import { useLocale } from 'next-intl'
import { Globe, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { setLocale } from '@/i18n/actions'
import { locales, localeNames, localeFlags, type Locale } from '@/i18n/config'

export function LanguageSwitcher() {
  const currentLocale = useLocale() as Locale
  const [isPending, startTransition] = useTransition()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleLocaleChange = (locale: Locale) => {
    startTransition(async () => {
      await setLocale(locale)
      // Refresh the page to apply the new locale
      window.location.reload()
    })
  }

  // Prevent hydration mismatch by only rendering dropdown after mount
  if (!mounted) {
    return (
      <Button variant="ghost" size="sm" className="gap-1.5" disabled>
        <Globe className="h-4 w-4" />
        <span className="hidden sm:inline">{localeFlags[currentLocale]}</span>
      </Button>
    )
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-1.5" disabled={isPending}>
          <Globe className="h-4 w-4" />
          <span className="hidden sm:inline">{localeFlags[currentLocale]}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {locales.map((locale) => (
          <DropdownMenuItem
            key={locale}
            className="cursor-pointer"
            onClick={() => handleLocaleChange(locale)}
          >
            <span className="font-medium">{localeFlags[locale]}</span>
            <span className="ml-2 text-muted-foreground">{localeNames[locale]}</span>
            {locale === currentLocale && <Check className="ml-auto h-4 w-4" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
