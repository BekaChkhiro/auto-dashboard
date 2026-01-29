'use client'

import { useState } from 'react'
import { Download, FileSpreadsheet, FileText, Loader2, Users, Car, Receipt } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useToast } from '@/hooks/use-toast'

type ExportType = 'dealers' | 'vehicles' | 'transactions'
type ExportFormat = 'excel' | 'pdf'

interface ExportDropdownProps {
  dateFrom?: string
  dateTo?: string
}

export function ExportDropdown({ dateFrom, dateTo }: ExportDropdownProps) {
  const [loading, setLoading] = useState<string | null>(null)
  const { toast } = useToast()

  const handleExport = async (type: ExportType, format: ExportFormat) => {
    const key = `${type}-${format}`
    setLoading(key)

    try {
      // Build URL with query params
      const params = new URLSearchParams()
      params.set('format', format)
      if (dateFrom) params.set('dateFrom', dateFrom)
      if (dateTo) params.set('dateTo', dateTo)

      const url = `/api/export/${type}?${params.toString()}`

      // Fetch the file
      const response = await fetch(url)

      if (!response.ok) {
        throw new Error('Export failed')
      }

      // Get filename from Content-Disposition header or generate one
      const contentDisposition = response.headers.get('Content-Disposition')
      let filename = `${type}-export.${format === 'excel' ? 'xlsx' : 'pdf'}`
      if (contentDisposition) {
        const match = contentDisposition.match(/filename="(.+)"/)
        if (match) {
          filename = match[1]
        }
      }

      // Download the file
      const blob = await response.blob()
      const downloadUrl = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = downloadUrl
      link.download = filename
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(downloadUrl)

      toast({
        title: 'Export successful',
        description: `${type.charAt(0).toUpperCase() + type.slice(1)} exported as ${format.toUpperCase()}`,
      })
    } catch (error) {
      console.error('Export error:', error)
      toast({
        title: 'Export failed',
        description: 'There was an error exporting the data. Please try again.',
        variant: 'destructive',
      })
    } finally {
      setLoading(null)
    }
  }

  const isLoading = loading !== null

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" disabled={isLoading}>
          {isLoading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Download className="mr-2 h-4 w-4" />
          )}
          Export
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>Export Data</DropdownMenuLabel>
        <DropdownMenuSeparator />

        {/* Dealers */}
        <DropdownMenuGroup>
          <DropdownMenuLabel className="flex items-center text-xs font-normal text-muted-foreground">
            <Users className="mr-2 h-3 w-3" />
            Dealers
          </DropdownMenuLabel>
          <DropdownMenuItem
            onClick={() => handleExport('dealers', 'excel')}
            disabled={loading === 'dealers-excel'}
          >
            <FileSpreadsheet className="mr-2 h-4 w-4 text-green-600" />
            <span>Excel (.xlsx)</span>
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => handleExport('dealers', 'pdf')}
            disabled={loading === 'dealers-pdf'}
          >
            <FileText className="mr-2 h-4 w-4 text-red-600" />
            <span>PDF (.pdf)</span>
          </DropdownMenuItem>
        </DropdownMenuGroup>

        <DropdownMenuSeparator />

        {/* Vehicles */}
        <DropdownMenuGroup>
          <DropdownMenuLabel className="flex items-center text-xs font-normal text-muted-foreground">
            <Car className="mr-2 h-3 w-3" />
            Vehicles
          </DropdownMenuLabel>
          <DropdownMenuItem
            onClick={() => handleExport('vehicles', 'excel')}
            disabled={loading === 'vehicles-excel'}
          >
            <FileSpreadsheet className="mr-2 h-4 w-4 text-green-600" />
            <span>Excel (.xlsx)</span>
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => handleExport('vehicles', 'pdf')}
            disabled={loading === 'vehicles-pdf'}
          >
            <FileText className="mr-2 h-4 w-4 text-red-600" />
            <span>PDF (.pdf)</span>
          </DropdownMenuItem>
        </DropdownMenuGroup>

        <DropdownMenuSeparator />

        {/* Transactions */}
        <DropdownMenuGroup>
          <DropdownMenuLabel className="flex items-center text-xs font-normal text-muted-foreground">
            <Receipt className="mr-2 h-3 w-3" />
            Transactions
          </DropdownMenuLabel>
          <DropdownMenuItem
            onClick={() => handleExport('transactions', 'excel')}
            disabled={loading === 'transactions-excel'}
          >
            <FileSpreadsheet className="mr-2 h-4 w-4 text-green-600" />
            <span>Excel (.xlsx)</span>
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => handleExport('transactions', 'pdf')}
            disabled={loading === 'transactions-pdf'}
          >
            <FileText className="mr-2 h-4 w-4 text-red-600" />
            <span>PDF (.pdf)</span>
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
