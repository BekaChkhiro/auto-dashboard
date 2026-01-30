import * as React from 'react'
import { cn } from '@/lib/utils'
import { LucideIcon, Inbox } from 'lucide-react'
import { Button } from './button'

interface EmptyStateProps {
  icon?: LucideIcon
  title: string
  description?: string
  action?: {
    label: string
    onClick: () => void
  }
  className?: string
  children?: React.ReactNode
}

/**
 * Empty state component for displaying when there's no data
 */
export function EmptyState({
  icon: Icon = Inbox,
  title,
  description,
  action,
  className,
  children,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex min-h-[400px] flex-col items-center justify-center p-8 text-center',
        className
      )}
    >
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-muted">
        <Icon className="h-8 w-8 text-muted-foreground" />
      </div>
      <h3 className="mt-4 text-lg font-semibold">{title}</h3>
      {description && <p className="mt-2 max-w-sm text-sm text-muted-foreground">{description}</p>}
      {action && (
        <Button onClick={action.onClick} className="mt-6">
          {action.label}
        </Button>
      )}
      {children && <div className="mt-6">{children}</div>}
    </div>
  )
}

interface TableEmptyStateProps {
  icon?: LucideIcon
  title: string
  description?: string
  action?: {
    label: string
    onClick: () => void
  }
  colSpan?: number
}

/**
 * Empty state for table rows
 */
export function TableEmptyState({
  icon: Icon = Inbox,
  title,
  description,
  action,
  colSpan = 1,
}: TableEmptyStateProps) {
  return (
    <tr>
      <td colSpan={colSpan} className="h-48">
        <div className="flex flex-col items-center justify-center text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
            <Icon className="h-6 w-6 text-muted-foreground" />
          </div>
          <h3 className="mt-3 text-sm font-semibold">{title}</h3>
          {description && (
            <p className="mt-1 max-w-xs text-sm text-muted-foreground">{description}</p>
          )}
          {action && (
            <Button onClick={action.onClick} size="sm" className="mt-4">
              {action.label}
            </Button>
          )}
        </div>
      </td>
    </tr>
  )
}

interface CardEmptyStateProps {
  icon?: LucideIcon
  title: string
  description?: string
  className?: string
}

/**
 * Compact empty state for cards/sections
 */
export function CardEmptyState({
  icon: Icon = Inbox,
  title,
  description,
  className,
}: CardEmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center p-6 text-center', className)}>
      <Icon className="h-8 w-8 text-muted-foreground" />
      <p className="mt-2 text-sm font-medium">{title}</p>
      {description && <p className="mt-1 text-xs text-muted-foreground">{description}</p>}
    </div>
  )
}
