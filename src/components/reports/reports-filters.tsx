'use client'

import * as React from 'react'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import {
  startOfMonth,
  endOfMonth,
  subDays,
  subMonths,
  format,
} from 'date-fns'
import type { DateRange } from 'react-day-picker'

import { Button } from '@/components/ui/button'
import { DateRangePicker } from './date-range-picker'

type PresetKey = '7d' | '30d' | 'month' | '3m' | '6m' | 'custom'

interface PresetOption {
  key: PresetKey
  label: string
  getRange: () => DateRange
}

const presets: PresetOption[] = [
  {
    key: '7d',
    label: 'Last 7 days',
    getRange: () => ({
      from: subDays(new Date(), 7),
      to: new Date(),
    }),
  },
  {
    key: '30d',
    label: 'Last 30 days',
    getRange: () => ({
      from: subDays(new Date(), 30),
      to: new Date(),
    }),
  },
  {
    key: 'month',
    label: 'This Month',
    getRange: () => ({
      from: startOfMonth(new Date()),
      to: endOfMonth(new Date()),
    }),
  },
  {
    key: '3m',
    label: 'Last 3 months',
    getRange: () => ({
      from: subMonths(new Date(), 3),
      to: new Date(),
    }),
  },
  {
    key: '6m',
    label: 'Last 6 months',
    getRange: () => ({
      from: subMonths(new Date(), 6),
      to: new Date(),
    }),
  },
]

interface ReportsFiltersProps {
  initialFrom?: string
  initialTo?: string
  initialPreset?: string
}

export function ReportsFilters({
  initialFrom,
  initialTo,
  initialPreset,
}: ReportsFiltersProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = React.useTransition()
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  // Determine current selection
  const getCurrentRange = (): DateRange | undefined => {
    if (initialPreset && initialPreset !== 'custom') {
      const preset = presets.find((p) => p.key === initialPreset)
      if (preset) return preset.getRange()
    }
    if (initialFrom && initialTo) {
      return {
        from: new Date(initialFrom),
        to: new Date(initialTo),
      }
    }
    // Default to last 30 days
    return presets[1].getRange()
  }

  const [dateRange, setDateRange] = React.useState<DateRange | undefined>(
    getCurrentRange()
  )
  const [activePreset, setActivePreset] = React.useState<PresetKey>(
    (initialPreset as PresetKey) || '30d'
  )

  const updateUrl = React.useCallback(
    (range: DateRange | undefined, preset?: PresetKey) => {
      const params = new URLSearchParams(searchParams.toString())

      if (preset && preset !== 'custom') {
        params.set('preset', preset)
        params.delete('from')
        params.delete('to')
      } else if (range?.from && range?.to) {
        params.set('from', format(range.from, 'yyyy-MM-dd'))
        params.set('to', format(range.to, 'yyyy-MM-dd'))
        params.delete('preset')
      }

      startTransition(() => {
        router.push(`${pathname}?${params.toString()}`)
      })
    },
    [pathname, router, searchParams]
  )

  const handlePresetClick = (preset: PresetOption) => {
    const range = preset.getRange()
    setDateRange(range)
    setActivePreset(preset.key)
    updateUrl(range, preset.key)
  }

  const handleCustomRangeChange = (range: DateRange | undefined) => {
    setDateRange(range)
    setActivePreset('custom')
    if (range?.from && range?.to) {
      updateUrl(range, 'custom')
    }
  }

  if (!mounted) {
    return (
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2">
          {presets.map((preset) => (
            <div key={preset.key} className="h-9 w-24 animate-pulse rounded-md bg-muted" />
          ))}
        </div>
        <div className="h-9 w-[280px] animate-pulse rounded-md bg-muted" />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-wrap gap-2">
        {presets.map((preset) => (
          <Button
            key={preset.key}
            variant={activePreset === preset.key ? 'default' : 'outline'}
            size="sm"
            onClick={() => handlePresetClick(preset)}
            disabled={isPending}
          >
            {preset.label}
          </Button>
        ))}
      </div>
      <DateRangePicker
        value={dateRange}
        onChange={handleCustomRangeChange}
      />
    </div>
  )
}
