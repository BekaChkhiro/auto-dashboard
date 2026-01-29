'use client'

import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { useCallback, useState, useTransition, useEffect } from 'react'
import { useDebouncedCallback } from 'use-debounce'
import { Search, X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { VehicleFilterOptions } from '@/lib/actions/vehicles'

interface VehicleSearchFiltersProps {
  initialSearch: string
  initialStatusId: string
  initialDealerId: string
  initialMakeId: string
  initialYear: string
  initialShowArchived: boolean
  filterOptions: VehicleFilterOptions
}

export function VehicleSearchFilters({
  initialSearch,
  initialStatusId,
  initialDealerId,
  initialMakeId,
  initialYear,
  initialShowArchived,
  filterOptions,
}: VehicleSearchFiltersProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()
  const [searchValue, setSearchValue] = useState(initialSearch)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const updateParams = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString())
      if (value && value !== 'all') {
        params.set(key, value)
      } else {
        params.delete(key)
      }
      params.delete('page') // Reset to first page when filters change
      startTransition(() => {
        router.push(`${pathname}?${params.toString()}`)
      })
    },
    [pathname, router, searchParams]
  )

  const debouncedSearch = useDebouncedCallback((value: string) => {
    updateParams('search', value)
  }, 300)

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setSearchValue(value)
    debouncedSearch(value)
  }

  const handleFilterChange = (key: string) => (value: string) => {
    updateParams(key, value)
  }

  const handleArchivedToggle = (checked: boolean) => {
    updateParams('showArchived', checked ? 'true' : '')
  }

  const clearSearch = () => {
    setSearchValue('')
    updateParams('search', '')
  }

  // Prevent hydration mismatch by showing skeleton until mounted
  if (!mounted) {
    return (
      <div className="space-y-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <Skeleton className="h-9 w-full max-w-sm" />
          <Skeleton className="h-9 w-full sm:w-[150px]" />
          <Skeleton className="h-9 w-full sm:w-[150px]" />
        </div>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <Skeleton className="h-9 w-full sm:w-[150px]" />
          <Skeleton className="h-9 w-full sm:w-[120px]" />
          <Skeleton className="h-6 w-32" />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center flex-wrap">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by VIN or lot number..."
            value={searchValue}
            onChange={handleSearchChange}
            className="pl-9 pr-9"
          />
          {searchValue && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
              onClick={clearSearch}
            >
              <X className="h-4 w-4" />
              <span className="sr-only">Clear search</span>
            </Button>
          )}
        </div>

        <Select value={initialStatusId || 'all'} onValueChange={handleFilterChange('statusId')}>
          <SelectTrigger className="w-full sm:w-[150px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {filterOptions.statuses.map((status) => (
              <SelectItem key={status.id} value={status.id}>
                {status.nameEn}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={initialDealerId || 'all'} onValueChange={handleFilterChange('dealerId')}>
          <SelectTrigger className="w-full sm:w-[150px]">
            <SelectValue placeholder="Dealer" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Dealers</SelectItem>
            {filterOptions.dealers.map((dealer) => (
              <SelectItem key={dealer.id} value={dealer.id}>
                {dealer.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center flex-wrap">
        <Select value={initialMakeId || 'all'} onValueChange={handleFilterChange('makeId')}>
          <SelectTrigger className="w-full sm:w-[150px]">
            <SelectValue placeholder="Make" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Makes</SelectItem>
            {filterOptions.makes.map((make) => (
              <SelectItem key={make.id} value={make.id}>
                {make.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={initialYear || 'all'} onValueChange={handleFilterChange('year')}>
          <SelectTrigger className="w-full sm:w-[120px]">
            <SelectValue placeholder="Year" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Years</SelectItem>
            {filterOptions.years.map((year) => (
              <SelectItem key={year} value={year.toString()}>
                {year}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="flex items-center space-x-2">
          <Switch
            id="show-archived"
            checked={initialShowArchived}
            onCheckedChange={handleArchivedToggle}
          />
          <Label htmlFor="show-archived" className="text-sm text-muted-foreground cursor-pointer">
            Show Archived
          </Label>
        </div>

        {isPending && (
          <div className="flex items-center text-sm text-muted-foreground">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent mr-2" />
            Loading...
          </div>
        )}
      </div>
    </div>
  )
}
