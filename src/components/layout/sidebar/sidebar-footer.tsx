'use client'

import { useSession } from 'next-auth/react'
import { User } from 'lucide-react'

export function SidebarFooter() {
  const { data: session } = useSession()

  if (!session?.user) {
    return null
  }

  return (
    <div className="border-t border-sidebar-foreground/10 p-4">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-sidebar-foreground/10">
          <User className="h-4 w-4 text-sidebar-foreground/70" />
        </div>
        <div className="flex-1 overflow-hidden">
          <p className="truncate text-sm font-medium text-sidebar-foreground">
            {session.user.name}
          </p>
          <p className="truncate text-xs text-sidebar-foreground/50">
            {session.user.email}
          </p>
        </div>
      </div>
    </div>
  )
}
