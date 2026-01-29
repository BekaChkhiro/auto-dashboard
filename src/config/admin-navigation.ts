import {
  LayoutDashboard,
  Users,
  Car,
  CreditCard,
  FileText,
  Anchor,
  Calculator,
  BarChart3,
  Settings,
} from 'lucide-react'
import type { Navigation } from './navigation-types'

export const adminNavigation: Navigation = [
  {
    items: [
      {
        title: 'Dashboard',
        href: '/admin',
        icon: LayoutDashboard,
      },
    ],
  },
  {
    title: 'Management',
    items: [
      {
        title: 'Dealers',
        href: '/admin/dealers',
        icon: Users,
      },
      {
        title: 'Vehicles',
        href: '/admin/vehicles',
        icon: Car,
      },
    ],
  },
  {
    title: 'Finance',
    items: [
      {
        title: 'Balance Requests',
        href: '/admin/balance-requests',
        icon: CreditCard,
      },
      {
        title: 'Invoices',
        href: '/admin/invoices',
        icon: FileText,
      },
    ],
  },
  {
    title: 'Operations',
    items: [
      {
        title: 'Ports',
        href: '/admin/ports',
        icon: Anchor,
      },
      {
        title: 'Calculator',
        href: '/admin/calculator',
        icon: Calculator,
      },
      {
        title: 'Reports',
        href: '/admin/reports',
        icon: BarChart3,
      },
    ],
  },
  {
    title: 'System',
    items: [
      {
        title: 'Settings',
        href: '/admin/settings',
        icon: Settings,
      },
    ],
  },
]
