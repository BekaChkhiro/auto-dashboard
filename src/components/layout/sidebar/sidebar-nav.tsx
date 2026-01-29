import { SidebarNavItem } from './sidebar-nav-item'
import type { Navigation } from '@/config/navigation-types'

interface SidebarNavProps {
  navigation: Navigation
}

export function SidebarNav({ navigation }: SidebarNavProps) {
  return (
    <nav className="flex-1 space-y-6 overflow-y-auto px-4 py-4">
      {navigation.map((section, index) => (
        <div key={section.title || index} className="space-y-1">
          {section.title && (
            <h4 className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-sidebar-foreground/50">
              {section.title}
            </h4>
          )}
          {section.items.map((item) => (
            <SidebarNavItem key={item.href} item={item} />
          ))}
        </div>
      ))}
    </nav>
  )
}
