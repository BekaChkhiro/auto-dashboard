import { LandingLayout, HeroSection } from '@/components/landing'

export default function HomePage() {
  return (
    <LandingLayout>
      <HeroSection />

      {/* Placeholder sections - will be implemented in T6.2-T6.6 */}
      <section id="services" className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center text-muted-foreground">
            {/* T6.2: Services Section - Coming Soon */}
          </div>
        </div>
      </section>

      <section id="how-it-works" className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center text-muted-foreground">
            {/* T6.3: How It Works Section - Coming Soon */}
          </div>
        </div>
      </section>

      <section id="calculator" className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center text-muted-foreground">
            {/* T6.4: Calculator Integration - Coming Soon */}
          </div>
        </div>
      </section>
    </LandingLayout>
  )
}
