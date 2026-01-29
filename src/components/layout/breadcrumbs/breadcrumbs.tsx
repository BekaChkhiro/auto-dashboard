'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ChevronRight, Home } from 'lucide-react'
import { cn } from '@/lib/utils'

interface BreadcrumbsProps {
  homeHref: string
}

function formatSegment(segment: string): string {
  return segment
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

export function Breadcrumbs({ homeHref }: BreadcrumbsProps) {
  const pathname = usePathname()

  // Get segments after the role prefix (admin or dealer)
  const segments = pathname.split('/').filter(Boolean)
  const roleSegment = segments[0] // 'admin' or 'dealer'
  const pathSegments = segments.slice(1)

  // Build breadcrumb items
  const breadcrumbs = pathSegments.map((segment, index) => {
    const href = `/${roleSegment}/${pathSegments.slice(0, index + 1).join('/')}`
    const isLast = index === pathSegments.length - 1

    return {
      label: formatSegment(segment),
      href,
      isLast,
    }
  })

  return (
    <nav aria-label="Breadcrumb" className="flex items-center gap-1 text-sm">
      <Link
        href={homeHref}
        className="flex items-center text-muted-foreground hover:text-foreground"
      >
        <Home className="h-4 w-4" />
        <span className="sr-only">Home</span>
      </Link>

      {breadcrumbs.map((crumb) => (
        <div key={crumb.href} className="flex items-center gap-1">
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
          {crumb.isLast ? (
            <span className="font-medium text-foreground">{crumb.label}</span>
          ) : (
            <Link
              href={crumb.href}
              className={cn(
                'text-muted-foreground hover:text-foreground',
                crumb.isLast && 'pointer-events-none font-medium text-foreground'
              )}
            >
              {crumb.label}
            </Link>
          )}
        </div>
      ))}
    </nav>
  )
}
