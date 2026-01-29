import type { ReactNode } from 'react'
import { SessionProvider } from '@/components/providers/session-provider'
import { auth } from '@/lib/auth'

interface DashboardLayoutProps {
  children: ReactNode
}

export default async function DashboardLayout({ children }: DashboardLayoutProps) {
  const session = await auth()

  return <SessionProvider session={session}>{children}</SessionProvider>
}
