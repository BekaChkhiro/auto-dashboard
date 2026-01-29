'use client'

import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface SortableHeaderProps {
  column: string
  label: string
  currentSortBy: string
  currentSortOrder: 'asc' | 'desc'
}

export function SortableHeader({
  column,
  label,
  currentSortBy,
  currentSortOrder,
}: SortableHeaderProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const isActive = currentSortBy === column

  const handleClick = () => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('sortBy', column)
    params.set('sortOrder', isActive && currentSortOrder === 'asc' ? 'desc' : 'asc')
    params.delete('page') // Reset to first page when sorting changes
    router.push(`${pathname}?${params.toString()}`)
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      className="-ml-3 h-8 data-[state=open]:bg-accent"
      onClick={handleClick}
    >
      {label}
      {isActive ? (
        currentSortOrder === 'asc' ? (
          <ArrowUp className="ml-2 h-4 w-4" />
        ) : (
          <ArrowDown className="ml-2 h-4 w-4" />
        )
      ) : (
        <ArrowUpDown className="ml-2 h-4 w-4 opacity-50" />
      )}
    </Button>
  )
}
