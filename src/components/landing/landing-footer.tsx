'use client'

import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { Car, Mail, Phone, MapPin } from 'lucide-react'

export function LandingFooter() {
  const t = useTranslations('landing')
  const currentYear = new Date().getFullYear()

  return (
    <footer id="contact" className="bg-sidebar text-sidebar-foreground">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand Column */}
          <div className="md:col-span-2">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
                <Car className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="text-lg font-bold">AutoDealer</span>
            </Link>
            <p className="text-sidebar-foreground/70 max-w-md mb-6">{t('footer.description')}</p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-semibold mb-4">{t('footer.quickLinks')}</h3>
            <ul className="space-y-2">
              <li>
                <a
                  href="#services"
                  className="text-sidebar-foreground/70 hover:text-sidebar-foreground transition-colors"
                >
                  {t('nav.services')}
                </a>
              </li>
              <li>
                <a
                  href="#how-it-works"
                  className="text-sidebar-foreground/70 hover:text-sidebar-foreground transition-colors"
                >
                  {t('nav.howItWorks')}
                </a>
              </li>
              <li>
                <a
                  href="#calculator"
                  className="text-sidebar-foreground/70 hover:text-sidebar-foreground transition-colors"
                >
                  {t('nav.calculator')}
                </a>
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="font-semibold mb-4">{t('footer.contactUs')}</h3>
            <ul className="space-y-3">
              <li className="flex items-center gap-2 text-sidebar-foreground/70">
                <Mail className="h-4 w-4" />
                <span>info@autodealer.ge</span>
              </li>
              <li className="flex items-center gap-2 text-sidebar-foreground/70">
                <Phone className="h-4 w-4" />
                <span>+995 555 123 456</span>
              </li>
              <li className="flex items-start gap-2 text-sidebar-foreground/70">
                <MapPin className="h-4 w-4 mt-0.5" />
                <span>{t('footer.address')}</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-sidebar-accent mt-8 pt-8 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-sm text-sidebar-foreground/60">
            {t('footer.copyright', { year: currentYear })}
          </p>
          <div className="flex gap-6">
            <Link
              href="/login"
              className="text-sm text-sidebar-foreground/60 hover:text-sidebar-foreground transition-colors"
            >
              {t('nav.login')}
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
