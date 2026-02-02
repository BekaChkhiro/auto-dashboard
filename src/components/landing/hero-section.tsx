'use client'

import { useTranslations } from 'next-intl'
import { ArrowRight, Ship, MapPin, Shield } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function HeroSection() {
  const t = useTranslations('landing')

  const scrollToCalculator = () => {
    const element = document.querySelector('#calculator')
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' })
    }
  }

  const scrollToServices = () => {
    const element = document.querySelector('#services')
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' })
    }
  }

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background with gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary/90 to-primary-hover" />

      {/* Pattern overlay */}
      <div
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
      />

      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 py-32">
        <div className="max-w-4xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-white/90 text-sm font-medium mb-8">
            <Ship className="h-4 w-4" />
            {t('hero.badge')}
          </div>

          {/* Headline */}
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-white mb-6 leading-tight">
            {t('hero.headline')}
          </h1>

          {/* Subheadline */}
          <p className="text-lg sm:text-xl text-white/80 mb-10 max-w-2xl mx-auto leading-relaxed">
            {t('hero.subheadline')}
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            <Button
              size="lg"
              onClick={scrollToCalculator}
              className="bg-white text-primary hover:bg-white/90 font-semibold px-8 h-12"
            >
              {t('hero.cta.primary')}
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={scrollToServices}
              className="border-white/30 text-white hover:bg-white/10 font-semibold px-8 h-12"
            >
              {t('hero.cta.secondary')}
            </Button>
          </div>

          {/* Stats/Features */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-3xl mx-auto">
            <div className="flex flex-col items-center p-6 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20">
              <div className="flex items-center justify-center w-12 h-12 rounded-full bg-white/20 mb-4">
                <Ship className="h-6 w-6 text-white" />
              </div>
              <span className="text-3xl font-bold text-white mb-1">
                {t('hero.stats.vehicles.value')}
              </span>
              <span className="text-sm text-white/70">{t('hero.stats.vehicles.label')}</span>
            </div>
            <div className="flex flex-col items-center p-6 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20">
              <div className="flex items-center justify-center w-12 h-12 rounded-full bg-white/20 mb-4">
                <MapPin className="h-6 w-6 text-white" />
              </div>
              <span className="text-3xl font-bold text-white mb-1">
                {t('hero.stats.ports.value')}
              </span>
              <span className="text-sm text-white/70">{t('hero.stats.ports.label')}</span>
            </div>
            <div className="flex flex-col items-center p-6 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20">
              <div className="flex items-center justify-center w-12 h-12 rounded-full bg-white/20 mb-4">
                <Shield className="h-6 w-6 text-white" />
              </div>
              <span className="text-3xl font-bold text-white mb-1">
                {t('hero.stats.experience.value')}
              </span>
              <span className="text-sm text-white/70">{t('hero.stats.experience.label')}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom wave decoration */}
      <div className="absolute bottom-0 left-0 right-0">
        <svg
          viewBox="0 0 1440 120"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-auto"
          preserveAspectRatio="none"
        >
          <path
            d="M0 120L60 110C120 100 240 80 360 70C480 60 600 60 720 65C840 70 960 80 1080 85C1200 90 1320 90 1380 90L1440 90V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z"
            fill="white"
          />
        </svg>
      </div>
    </section>
  )
}
