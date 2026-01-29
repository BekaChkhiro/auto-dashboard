'use client'

import { useState } from 'react'
import { Menu } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { SidebarHeader } from './sidebar-header'
import { SidebarNav } from './sidebar-nav'
import { SidebarFooter } from './sidebar-footer'
import { adminNavigation } from '@/config/admin-navigation'
import { dealerNavigation } from '@/config/dealer-navigation'

interface MobileSidebarProps {
  variant: 'admin' | 'dealer'
}

export function MobileSidebar({ variant }: MobileSidebarProps) {
  const [open, setOpen] = useState(false)
  const navigation = variant === 'admin' ? adminNavigation : dealerNavigation
  const homeHref = variant === 'admin' ? '/admin' : '/dealer'

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        className="lg:hidden"
        onClick={() => setOpen(true)}
        aria-label="Open menu"
      >
        <Menu className="h-5 w-5" />
      </Button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="left" className="w-64 bg-sidebar p-0">
          <SheetHeader className="sr-only">
            <SheetTitle>Navigation Menu</SheetTitle>
          </SheetHeader>
          <div className="flex h-full flex-col">
            <SidebarHeader href={homeHref} />
            <SidebarNav navigation={navigation} />
            <SidebarFooter />
          </div>
        </SheetContent>
      </Sheet>
    </>
  )
}
