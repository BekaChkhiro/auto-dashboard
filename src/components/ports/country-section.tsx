'use client'

import { useState } from 'react'
import { ChevronDown, ChevronRight } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { StateSection } from './state-section'
import { useTranslations } from 'next-intl'
import type { CountryWithStates } from '@/lib/actions/ports-dashboard'

interface CountrySectionProps {
  country: CountryWithStates
  statusColors: Record<string, string>
  defaultExpanded?: boolean
}

export function CountrySection({ country, statusColors, defaultExpanded = false }: CountrySectionProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded)
  const t = useTranslations('ports')

  const hasStates = country.states.length > 0

  return (
    <div className="rounded-lg border">
      <button
        onClick={() => hasStates && setIsExpanded(!isExpanded)}
        className="flex w-full items-center justify-between rounded-lg bg-muted/50 p-3 text-left hover:bg-muted/70 transition-colors"
        disabled={!hasStates}
      >
        <div className="flex items-center gap-2">
          {hasStates ? (
            isExpanded ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )
          ) : (
            <div className="h-4 w-4" />
          )}
          <span className="font-semibold">
            {country.countryName} ({country.countryCode})
          </span>
          <span className="text-sm text-muted-foreground">
            {country.states.length} {t('states')}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className="hidden sm:flex items-center gap-1">
            <Badge variant="outline" style={{ borderColor: statusColors.enRoute, color: statusColors.enRoute }}>
              {country.totals.enRoute}
            </Badge>
            <Badge variant="outline" style={{ borderColor: statusColors.atPort, color: statusColors.atPort }}>
              {country.totals.atPort}
            </Badge>
            <Badge variant="outline" style={{ borderColor: statusColors.loaded, color: statusColors.loaded }}>
              {country.totals.loaded}
            </Badge>
            <Badge variant="outline" style={{ borderColor: statusColors.shipped, color: statusColors.shipped }}>
              {country.totals.shipped}
            </Badge>
          </div>
          <Badge className="min-w-[48px] justify-center">
            {country.totals.total}
          </Badge>
        </div>
      </button>

      {isExpanded && hasStates && (
        <div className="space-y-2 p-3">
          {country.states.map(state => (
            <StateSection
              key={state.stateId}
              state={state}
              statusColors={statusColors}
            />
          ))}
        </div>
      )}
    </div>
  )
}
