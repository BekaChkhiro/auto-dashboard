'use client'

import { Card, CardContent } from '@/components/ui/card'
import { useTranslations } from 'next-intl'

interface StatsSummaryCardProps {
  enRoute: number
  atPort: number
  loaded: number
  shipped: number
  total: number
  statusColors: Record<string, string>
}

export function StatsSummaryCard({
  enRoute,
  atPort,
  loaded,
  shipped,
  total,
  statusColors,
}: StatsSummaryCardProps) {
  const t = useTranslations('ports')

  const stats = [
    { key: 'enRoute', label: t('enRoute'), value: enRoute, color: statusColors.enRoute },
    { key: 'atPort', label: t('atPort'), value: atPort, color: statusColors.atPort },
    { key: 'loaded', label: t('loaded'), value: loaded, color: statusColors.loaded },
    { key: 'shipped', label: t('shipped'), value: shipped, color: statusColors.shipped },
    { key: 'total', label: t('total'), value: total, color: '#6B7280' },
  ]

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
          {stats.map(stat => (
            <div
              key={stat.key}
              className="flex flex-col items-center justify-center rounded-lg border p-4"
            >
              <div
                className="text-3xl font-bold"
                style={{ color: stat.key !== 'total' ? stat.color : undefined }}
              >
                {stat.value}
              </div>
              <div className="mt-1 text-sm text-muted-foreground">{stat.label}</div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
