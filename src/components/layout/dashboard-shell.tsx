import { cn } from '@/lib/utils'
import type { ReactNode } from 'react'

interface DashboardShellProps {
  children: ReactNode
  className?: string
}

export function DashboardShell({ children, className }: DashboardShellProps) {
  return (
    <main
      className={cn(
        'flex-1 overflow-y-auto bg-muted/30 p-4 lg:p-6',
        className
      )}
    >
      {children}
    </main>
  )
}
