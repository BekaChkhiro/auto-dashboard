import {
  LayoutDashboard,
  Car,
  Wallet,
  FileText,
  Bell,
  User,
} from 'lucide-react'
import type { Navigation } from './navigation-types'

export const dealerNavigation: Navigation = [
  {
    items: [
      {
        title: 'Dashboard',
        href: '/dealer',
        icon: LayoutDashboard,
      },
    ],
  },
  {
    title: 'Vehicles',
    items: [
      {
        title: 'My Vehicles',
        href: '/dealer/vehicles',
        icon: Car,
      },
    ],
  },
  {
    title: 'Finance',
    items: [
      {
        title: 'Balance',
        href: '/dealer/balance',
        icon: Wallet,
      },
      {
        title: 'Invoices',
        href: '/dealer/invoices',
        icon: FileText,
      },
    ],
  },
  {
    title: 'Account',
    items: [
      {
        title: 'Notifications',
        href: '/dealer/notifications',
        icon: Bell,
      },
      {
        title: 'Profile',
        href: '/dealer/profile',
        icon: User,
      },
    ],
  },
]
