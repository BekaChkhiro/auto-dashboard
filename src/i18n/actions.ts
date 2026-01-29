'use server'

import { cookies } from 'next/headers'
import { type Locale, locales, defaultLocale } from './config'

const COOKIE_NAME = 'NEXT_LOCALE'

export async function setLocale(locale: Locale) {
  if (!locales.includes(locale)) {
    throw new Error(`Invalid locale: ${locale}`)
  }

  const cookieStore = await cookies()
  cookieStore.set(COOKIE_NAME, locale, {
    path: '/',
    maxAge: 60 * 60 * 24 * 365, // 1 year
    sameSite: 'lax',
  })
}

export async function getLocale(): Promise<Locale> {
  const cookieStore = await cookies()
  const locale = cookieStore.get(COOKIE_NAME)?.value

  if (locale && locales.includes(locale as Locale)) {
    return locale as Locale
  }

  return defaultLocale
}
