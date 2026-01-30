import { Suspense } from 'react'
import dynamic from 'next/dynamic'
import { requireAdmin } from '@/lib/auth'
import { PageHeader } from '@/components/layout/page-header'
import { Card, CardContent } from '@/components/ui/card'
import { SettingsTabs } from '@/components/settings/settings-tabs'
import { Skeleton } from '@/components/ui/skeleton'

// Dynamic imports for code splitting - tabs are only loaded when selected
const LocationsTab = dynamic(
  () => import('@/components/settings/locations/locations-tab').then((mod) => mod.LocationsTab),
  { ssr: true }
)
const MakesModelsTab = dynamic(
  () =>
    import('@/components/settings/makes-models/makes-models-tab').then((mod) => mod.MakesModelsTab),
  { ssr: true }
)
const AuctionsTab = dynamic(
  () => import('@/components/settings/auctions/auctions-tab').then((mod) => mod.AuctionsTab),
  { ssr: true }
)
const StatusesTab = dynamic(
  () => import('@/components/settings/statuses/statuses-tab').then((mod) => mod.StatusesTab),
  { ssr: true }
)
const CalculatorTab = dynamic(
  () => import('@/components/settings/calculator/calculator-tab').then((mod) => mod.CalculatorTab),
  { ssr: true }
)

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
