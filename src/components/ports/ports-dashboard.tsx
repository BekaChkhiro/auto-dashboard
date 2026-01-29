import { getPortsDashboardData } from '@/lib/actions/ports-dashboard'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { StatsSummaryCard } from './stats-summary-card'
import { CountrySection } from './country-section'
import { getTranslations } from 'next-intl/server'

export async function PortsDashboard() {
  const t = await getTranslations('ports')
  const data = await getPortsDashboardData()

  const hasCountries = data.countries.length > 0

  return (
    <div className="space-y-6">
      {/* Summary Statistics */}
      <StatsSummaryCard
        enRoute={data.grandTotals.enRoute}
        atPort={data.grandTotals.atPort}
        loaded={data.grandTotals.loaded}
        shipped={data.grandTotals.shipped}
        total={data.grandTotals.total}
        statusColors={data.statusColors}
      />

      {/* Ports by Location */}
      <Card>
        <CardHeader>
          <CardTitle>{t('portsByLocation')}</CardTitle>
        </CardHeader>
        <CardContent>
          {hasCountries ? (
            <div className="space-y-4">
              {data.countries.map((country, index) => (
                <CountrySection
                  key={country.countryId}
                  country={country}
                  statusColors={data.statusColors}
                  defaultExpanded={index === 0}
                />
              ))}
            </div>
          ) : (
            <div className="py-8 text-center text-muted-foreground">
              {t('noPorts')}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
