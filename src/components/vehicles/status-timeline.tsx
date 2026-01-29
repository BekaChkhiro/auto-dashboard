'use client'

import * as React from 'react'
import { useTranslations, useLocale } from 'next-intl'
import { formatDistanceToNow } from 'date-fns'
import { cn } from '@/lib/utils'

interface StatusHistoryItem {
  id: string
  changedAt: Date
  status: {
    id: string
    nameEn: string
    nameKa: string
    color: string | null
  }
  changedBy: {
    id: string
    name: string
  }
}

interface StatusTimelineProps {
  history: StatusHistoryItem[]
  className?: string
}

export function StatusTimeline({ history, className }: StatusTimelineProps) {
  const t = useTranslations('vehicles')
  const locale = useLocale()

  if (history.length === 0) {
    return (
      <div className="text-center text-sm text-muted-foreground py-4">
        {t('noStatusHistory')}
      </div>
    )
  }

  return (
    <div className={cn('relative space-y-0', className)}>
      {history.map((item, index) => {
        const statusName = locale === 'ka' ? item.status.nameKa : item.status.nameEn
        const isFirst = index === 0
        const isLast = index === history.length - 1

        return (
          <div key={item.id} className="relative flex gap-4 pb-6 last:pb-0">
            {/* Timeline line */}
            {!isLast && (
              <div
                className="absolute left-[9px] top-5 h-full w-0.5 bg-border"
                aria-hidden="true"
              />
            )}

            {/* Timeline dot */}
            <div
              className={cn(
                'relative z-10 mt-1 h-5 w-5 flex-shrink-0 rounded-full border-2',
                isFirst
                  ? 'border-primary bg-primary'
                  : 'border-muted-foreground/30 bg-background'
              )}
              style={{
                borderColor: item.status.color || undefined,
                backgroundColor: isFirst ? (item.status.color || undefined) : undefined,
              }}
            />

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={cn(
                    'font-medium',
                    isFirst ? 'text-foreground' : 'text-muted-foreground'
                  )}
                >
                  {statusName}
                </span>
                {isFirst && (
                  <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                    {t('currentStatus')}
                  </span>
                )}
              </div>
              <div className="mt-1 flex flex-wrap gap-x-3 text-sm text-muted-foreground">
                <span>
                  {formatDistanceToNow(new Date(item.changedAt), {
                    addSuffix: true,
                  })}
                </span>
                <span className="hidden sm:inline">•</span>
                <span className="hidden sm:inline">{item.changedBy.name}</span>
              </div>
              <div className="mt-1 text-xs text-muted-foreground sm:hidden">
                {item.changedBy.name}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
