'use client'

import { NextIntlClientProvider, AbstractIntlMessages } from 'next-intl'
import { ReactNode } from 'react'

interface IntlProviderProps {
  children: ReactNode
  locale: string
  messages: AbstractIntlMessages
}

export function IntlProvider({ children, locale, messages }: IntlProviderProps) {
  return (
    <NextIntlClientProvider locale={locale} messages={messages} timeZone="Asia/Tbilisi">
      {children}
    </NextIntlClientProvider>
  )
}
