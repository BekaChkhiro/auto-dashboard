'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { Menu, X, Car } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { LanguageSwitcher } from '@/components/layout/header/language-switcher'
import { cn } from '@/lib/utils'

interface NavItem {
  label: string
  href: string
}

export function LandingHeader() {
  const t = useTranslations('landing')
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const navItems: NavItem[] = [
    { label: t('nav.services'), href: '#services' },
    { label: t('nav.howItWorks'), href: '#how-it-works' },
    { label: t('nav.calculator'), href: '#calculator' },
    { label: t('nav.contact'), href: '#contact' },
  ]

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10)
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const scrollToSection = (href: string) => {
    setIsMobileMenuOpen(false)
    const element = document.querySelector(href)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' })
    }
  }

  return (
    <header
      className={cn(
        'fixed top-0 left-0 right-0 z-50 transition-all duration-300',
        isScrolled
          ? 'bg-white/95 backdrop-blur-sm shadow-sm border-b border-border'
          : 'bg-transparent'
      )}
    >
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
              <Car className="h-5 w-5 text-primary-foreground" />
            </div>
            <span
              className={cn(
                'text-lg font-bold transition-colors',
                isScrolled ? 'text-foreground' : 'text-white'
              )}
            >
              AutoDealer
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => (
              <button
                key={item.href}
                onClick={() => scrollToSection(item.href)}
                className={cn(
                  'px-4 py-2 text-sm font-medium rounded-md transition-colors',
                  isScrolled
                    ? 'text-muted-foreground hover:text-foreground hover:bg-muted'
                    : 'text-white/80 hover:text-white hover:bg-white/10'
                )}
              >
                {item.label}
              </button>
            ))}
          </nav>

          {/* Right Section */}
          <div className="flex items-center gap-2">
            <LanguageSwitcher />
            <Link href="/login" className="hidden sm:block">
              <Button
                variant={isScrolled ? 'default' : 'secondary'}
                size="sm"
                className={cn(!isScrolled && 'bg-white text-primary hover:bg-white/90')}
              >
                {t('nav.login')}
              </Button>
            </Link>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className={cn(
                'md:hidden p-2 rounded-md transition-colors',
                isScrolled ? 'text-foreground hover:bg-muted' : 'text-white hover:bg-white/10'
              )}
            >
              {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-border/50 bg-white/95 backdrop-blur-sm rounded-b-lg">
            <nav className="flex flex-col gap-1">
              {navItems.map((item) => (
                <button
                  key={item.href}
                  onClick={() => scrollToSection(item.href)}
                  className="px-4 py-3 text-left text-sm font-medium text-foreground hover:bg-muted rounded-md"
                >
                  {item.label}
                </button>
              ))}
              <Link href="/login" className="mt-2 px-4">
                <Button className="w-full">{t('nav.login')}</Button>
              </Link>
            </nav>
          </div>
        )}
      </div>
    </header>
  )
}
