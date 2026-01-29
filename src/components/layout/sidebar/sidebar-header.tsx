import Link from 'next/link'
import { Car } from 'lucide-react'

interface SidebarHeaderProps {
  href: string
}

export function SidebarHeader({ href }: SidebarHeaderProps) {
  return (
    <div className="flex h-16 items-center border-b border-sidebar-foreground/10 px-6">
      <Link href={href} className="flex items-center gap-2">
        <Car className="h-6 w-6 text-primary" />
        <span className="text-lg font-semibold text-sidebar-foreground">
          AutoDealer
        </span>
      </Link>
    </div>
  )
}
