'use client'

import { useLocale } from 'next-intl'
import { useCallback, useMemo } from 'react'
import {
  formatDate,
  formatDateTime,
  formatRelativeTime,
  formatCurrency,
  formatNumber,
  formatPercent,
  type DateStyle,
} from '@/lib/formatting'

export function useFormatting() {
  const locale = useLocale()

  const date = useCallback(
    (value: Date | string | number, style?: DateStyle) => formatDate(value, locale, style),
    [locale]
  )

  const dateTime = useCallback(
    (value: Date | string | number, dateStyle?: DateStyle, timeStyle?: DateStyle) =>
      formatDateTime(value, locale, dateStyle, timeStyle),
    [locale]
  )

  const relativeTime = useCallback(
    (value: Date | string | number) => formatRelativeTime(value, locale),
    [locale]
  )

  const currency = useCallback(
    (value: number, currencyCode?: string) => formatCurrency(value, locale, currencyCode),
    [locale]
  )

  const number = useCallback(
    (value: number, options?: Intl.NumberFormatOptions) => formatNumber(value, locale, options),
    [locale]
  )

  const percent = useCallback(
    (value: number, decimals?: number) => formatPercent(value, locale, decimals),
    [locale]
  )

  return useMemo(
    () => ({
      date,
      dateTime,
      relativeTime,
      currency,
      number,
      percent,
      locale,
    }),
    [date, dateTime, relativeTime, currency, number, percent, locale]
  )
}
