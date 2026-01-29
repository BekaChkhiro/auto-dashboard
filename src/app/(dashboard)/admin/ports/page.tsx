import { Suspense } from 'react'
import { PageHeader } from '@/components/layout/page-header'
import { PortsDashboard, PortsDashboardSkeleton } from '@/components/ports'
import { requireAdmin } from '@/lib/auth'
import { getTranslations } from 'next-intl/server'

export default async function PortsPage() {
  await requireAdmin()
  const t = await getTranslations('ports')

  return (
    <>
      <PageHeader
        title={t('title')}
        description={t('description')}
      />

      <Suspense fallback={<PortsDashboardSkeleton />}>
        <PortsDashboard />
      </Suspense>
    </>
  )
}
