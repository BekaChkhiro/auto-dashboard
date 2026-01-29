import { Suspense } from 'react'
import { MobileSidebar } from '../sidebar'
import { UserMenu } from './user-menu'
import { LanguageSwitcher } from './language-switcher'
import { NotificationBellWrapper } from './notification-bell-wrapper'
import { Breadcrumbs } from '../breadcrumbs/breadcrumbs'

interface HeaderProps {
  variant: 'admin' | 'dealer'
}

export function Header({ variant }: HeaderProps) {
  const homeHref = variant === 'admin' ? '/admin' : '/dealer'

  return (
    <header className="sticky top-0 z-40 flex h-16 items-center gap-4 border-b bg-background px-4 lg:px-6">
      <MobileSidebar variant={variant} />

      <div className="hidden flex-1 lg:block">
        <Breadcrumbs homeHref={homeHref} />
      </div>

      <div className="flex flex-1 items-center justify-end gap-2 lg:flex-none">
        <LanguageSwitcher />
        {variant === 'dealer' && (
          <Suspense fallback={null}>
            <NotificationBellWrapper />
          </Suspense>
        )}
        <UserMenu />
      </div>
    </header>
  )
}
