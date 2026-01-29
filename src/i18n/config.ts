export const locales = ['en', 'ka'] as const
export type Locale = (typeof locales)[number]

export const defaultLocale: Locale = 'en'

export const localeNames: Record<Locale, string> = {
  en: 'English',
  ka: 'ქართული',
}

export const localeFlags: Record<Locale, string> = {
  en: 'EN',
  ka: 'KA',
}
