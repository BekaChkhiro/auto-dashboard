import { Suspense } from 'react'
import { requireAdmin } from '@/lib/auth'
import { PageHeader } from '@/components/layout/page-header'
import { Card, CardContent } from '@/components/ui/card'
import { SettingsTabs } from '@/components/settings/settings-tabs'
import { LocationsTab } from '@/components/settings/locations/locations-tab'
import { MakesModelsTab } from '@/components/settings/makes-models/makes-models-tab'
import { AuctionsTab } from '@/components/settings/auctions/auctions-tab'
import { StatusesTab } from '@/components/settings/statuses/statuses-tab'
import { CalculatorTab } from '@/components/settings/calculator/calculator-tab'
import { Skeleton } from '@/components/ui/skeleton'

interface SettingsPageProps {
  searchParams: Promise<{
    tab?: string
  }>
}

function TabSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-64 w-full" />
    </div>
  )
}

export default async function SettingsPage({ searchParams }: SettingsPageProps) {
  await requireAdmin()

  const params = await searchParams
  const activeTab = params.tab || 'locations'

  return (
    <>
      <PageHeader
        title="System Settings"
        description="Manage locations, vehicle makes & models, auctions, statuses, and calculator prices"
      />

      <Card>
        <CardContent className="p-6">
          <SettingsTabs activeTab={activeTab}>
            <Suspense key="locations" fallback={<TabSkeleton />}>
              <LocationsTab />
            </Suspense>
            <Suspense key="makes-models" fallback={<TabSkeleton />}>
              <MakesModelsTab />
            </Suspense>
            <Suspense key="auctions" fallback={<TabSkeleton />}>
              <AuctionsTab />
            </Suspense>
            <Suspense key="statuses" fallback={<TabSkeleton />}>
              <StatusesTab />
            </Suspense>
            <Suspense key="calculator" fallback={<TabSkeleton />}>
              <CalculatorTab />
            </Suspense>
          </SettingsTabs>
        </CardContent>
      </Card>
    </>
  )
}
