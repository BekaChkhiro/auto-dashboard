'use client'

import { useState, useTransition, useEffect } from 'react'
import Link from 'next/link'
import { MoreHorizontal, Eye, Pencil, Archive, ArchiveRestore } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { toast } from '@/hooks/use-toast'
import { archiveVehicle, restoreVehicle } from '@/lib/actions/vehicles'

interface VehicleRowActionsProps {
  vehicleId: string
  vehicleVin: string
  isArchived: boolean
}

export function VehicleRowActions({
  vehicleId,
  vehicleVin,
  isArchived,
}: VehicleRowActionsProps) {
  const [isPending, startTransition] = useTransition()
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleArchiveToggle = () => {
    setShowConfirmDialog(true)
  }

  const confirmArchiveToggle = () => {
    startTransition(async () => {
      const action = isArchived ? restoreVehicle : archiveVehicle
      const result = await action(vehicleId)

      if (result.success) {
        toast({
          title: 'Success',
          description: result.message,
          variant: 'success',
        })
      } else {
        toast({
          title: 'Error',
          description: result.message,
          variant: 'destructive',
        })
      }

      setShowConfirmDialog(false)
    })
  }

  // Prevent hydration mismatch with Radix UI dynamic IDs
  if (!mounted) {
    return (
      <Button variant="ghost" size="icon" className="h-8 w-8" disabled>
        <MoreHorizontal className="h-4 w-4" />
        <span className="sr-only">Open menu</span>
      </Button>
    )
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <MoreHorizontal className="h-4 w-4" />
            <span className="sr-only">Open menu</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem asChild>
            <Link href={`/admin/vehicles/${vehicleId}`}>
              <Eye className="mr-2 h-4 w-4" />
              View Details
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href={`/admin/vehicles/${vehicleId}/edit`}>
              <Pencil className="mr-2 h-4 w-4" />
              Edit
            </Link>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          {isArchived ? (
            <DropdownMenuItem
              className="text-success focus:text-success"
              onClick={handleArchiveToggle}
            >
              <ArchiveRestore className="mr-2 h-4 w-4" />
              Restore Vehicle
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              onClick={handleArchiveToggle}
            >
              <Archive className="mr-2 h-4 w-4" />
              Archive Vehicle
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {isArchived ? 'Restore Vehicle' : 'Archive Vehicle'}
            </DialogTitle>
            <DialogDescription>
              {isArchived
                ? `Are you sure you want to restore vehicle ${vehicleVin}? It will appear in the main vehicles list again.`
                : `Are you sure you want to archive vehicle ${vehicleVin}? It will be hidden from the main list but can be restored later.`}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowConfirmDialog(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button
              variant={isArchived ? 'default' : 'destructive'}
              onClick={confirmArchiveToggle}
              disabled={isPending}
            >
              {isPending ? 'Processing...' : isArchived ? 'Restore' : 'Archive'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
