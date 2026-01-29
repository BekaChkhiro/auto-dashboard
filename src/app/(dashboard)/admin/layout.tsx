import type { ReactNode } from 'react'
import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import { Sidebar } from '@/components/layout/sidebar'
import { Header } from '@/components/layout/header'
import { DashboardShell } from '@/components/layout/dashboard-shell'

interface AdminLayoutProps {
  children: ReactNode
}

export default async function AdminLayout({ children }: AdminLayoutProps) {
  const session = await getSession()

  if (!session) {
    redirect('/login')
  }

  if (session.user.role !== 'ADMIN') {
    redirect('/dealer')
  }

  return (
    <div className="min-h-screen">
      <Sidebar variant="admin" />
      <div className="flex min-h-screen flex-col lg:pl-64">
        <Header variant="admin" />
        <DashboardShell>{children}</DashboardShell>
      </div>
    </div>
  )
}
