'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ChevronDown, ChevronRight, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useTranslations } from 'next-intl'
import type { StateWithPorts } from '@/lib/actions/ports-dashboard'

interface StateSectionProps {
  state: StateWithPorts
  statusColors: Record<string, string>
}

export function StateSection({ state, statusColors }: StateSectionProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const t = useTranslations('ports')

  const hasPorts = state.ports.length > 0

  return (
    <div className="ml-4 border-l pl-4">
      <button
        onClick={() => hasPorts && setIsExpanded(!isExpanded)}
        className="flex w-full items-center justify-between rounded-lg bg-muted/30 p-2 text-left hover:bg-muted/50 transition-colors"
        disabled={!hasPorts}
      >
        <div className="flex items-center gap-2">
          {hasPorts ? (
            isExpanded ? (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            )
          ) : (
            <div className="h-4 w-4" />
          )}
          <span className="font-medium">
            {state.stateName} ({state.stateCode})
          </span>
          <span className="text-xs text-muted-foreground">
            {state.ports.length} {t('ports')}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className="hidden sm:flex items-center gap-1">
            <Badge variant="outline" style={{ borderColor: statusColors.enRoute, color: statusColors.enRoute }}>
              {state.totals.enRoute}
            </Badge>
            <Badge variant="outline" style={{ borderColor: statusColors.atPort, color: statusColors.atPort }}>
              {state.totals.atPort}
            </Badge>
            <Badge variant="outline" style={{ borderColor: statusColors.loaded, color: statusColors.loaded }}>
              {state.totals.loaded}
            </Badge>
            <Badge variant="outline" style={{ borderColor: statusColors.shipped, color: statusColors.shipped }}>
              {state.totals.shipped}
            </Badge>
          </div>
          <Badge variant="secondary" className="min-w-[40px] justify-center">
            {state.totals.total}
          </Badge>
        </div>
      </button>

      {isExpanded && hasPorts && (
        <div className="mt-2 rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('portName')}</TableHead>
                <TableHead className="text-center w-16">{t('enRoute')}</TableHead>
                <TableHead className="text-center w-16">{t('atPort')}</TableHead>
                <TableHead className="text-center w-16">{t('loaded')}</TableHead>
                <TableHead className="text-center w-16">{t('shipped')}</TableHead>
                <TableHead className="text-center w-16">{t('total')}</TableHead>
                <TableHead className="w-10"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {state.ports.map(port => (
                <TableRow key={port.portId}>
                  <TableCell className="font-medium">{port.portName}</TableCell>
                  <TableCell className="text-center">
                    <span style={{ color: port.enRoute > 0 ? statusColors.enRoute : undefined }}>
                      {port.enRoute}
                    </span>
                  </TableCell>
                  <TableCell className="text-center">
                    <span style={{ color: port.atPort > 0 ? statusColors.atPort : undefined }}>
                      {port.atPort}
                    </span>
                  </TableCell>
                  <TableCell className="text-center">
                    <span style={{ color: port.loaded > 0 ? statusColors.loaded : undefined }}>
                      {port.loaded}
                    </span>
                  </TableCell>
                  <TableCell className="text-center">
                    <span style={{ color: port.shipped > 0 ? statusColors.shipped : undefined }}>
                      {port.shipped}
                    </span>
                  </TableCell>
                  <TableCell className="text-center font-medium">{port.total}</TableCell>
                  <TableCell>
                    {port.total > 0 ? (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        asChild
                        title={t('viewVehicles')}
                      >
                        <Link href={`/admin/vehicles?portId=${port.portId}`}>
                          <ExternalLink className="h-4 w-4" />
                        </Link>
                      </Button>
                    ) : (
                      <span className="text-xs text-muted-foreground">{t('noVehicles')}</span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}
