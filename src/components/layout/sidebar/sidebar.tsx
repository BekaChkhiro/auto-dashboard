'use client'

import { SidebarHeader } from './sidebar-header'
import { SidebarNav } from './sidebar-nav'
import { SidebarFooter } from './sidebar-footer'
import { adminNavigation } from '@/config/admin-navigation'
import { dealerNavigation } from '@/config/dealer-navigation'

interface SidebarProps {
  variant: 'admin' | 'dealer'
}

export function Sidebar({ variant }: SidebarProps) {
  const navigation = variant === 'admin' ? adminNavigation : dealerNavigation
  const homeHref = variant === 'admin' ? '/admin' : '/dealer'

  return (
    <aside className="fixed inset-y-0 left-0 z-50 hidden w-64 flex-col bg-sidebar lg:flex">
      <SidebarHeader href={homeHref} />
      <SidebarNav navigation={navigation} />
      <SidebarFooter />
    </aside>
  )
}
