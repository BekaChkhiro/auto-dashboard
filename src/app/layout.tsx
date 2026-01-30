import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { getLocale, getMessages } from 'next-intl/server'
import { IntlProvider } from '@/components/providers/intl-provider'
import { Toaster } from '@/components/ui/toaster'
import './globals.css'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: 'Auto Dealer Platform',
  description: 'Vehicle transportation tracking platform for dealers',
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const locale = await getLocale()
  const messages = await getMessages()

  return (
    <html lang={locale}>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        suppressHydrationWarning
      >
        <IntlProvider locale={locale} messages={messages}>
          {children}
          <Toaster />
        </IntlProvider>
      </body>
    </html>
  )
}
