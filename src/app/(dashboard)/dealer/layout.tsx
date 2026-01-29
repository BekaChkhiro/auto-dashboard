import type { ReactNode } from 'react'
import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import { Sidebar } from '@/components/layout/sidebar'
import { Header } from '@/components/layout/header'
import { DashboardShell } from '@/components/layout/dashboard-shell'

interface DealerLayoutProps {
  children: ReactNode
}

export default async function DealerLayout({ children }: DealerLayoutProps) {
  const session = await getSession()

  if (!session) {
    redirect('/login')
  }

  if (session.user.role !== 'DEALER') {
    redirect('/admin')
  }

  return (
    <div className="min-h-screen">
      <Sidebar variant="dealer" />
      <div className="flex min-h-screen flex-col lg:pl-64">
        <Header variant="dealer" />
        <DashboardShell>{children}</DashboardShell>
      </div>
    </div>
  )
}
