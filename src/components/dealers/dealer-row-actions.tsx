'use client'

import { useState, useTransition, useEffect } from 'react'
import Link from 'next/link'
import { MoreHorizontal, Eye, Pencil, Ban, CheckCircle } from 'lucide-react'
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
import { toggleDealerStatus } from '@/lib/actions/dealers'
import type { UserStatus } from '@/generated/prisma'

interface DealerRowActionsProps {
  dealerId: string
  dealerName: string
  status: UserStatus
}

export function DealerRowActions({
  dealerId,
  dealerName,
  status,
}: DealerRowActionsProps) {
  const [isPending, startTransition] = useTransition()
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [pendingAction, setPendingAction] = useState<UserStatus | null>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleStatusToggle = (newStatus: UserStatus) => {
    setPendingAction(newStatus)
    setShowConfirmDialog(true)
  }

  const confirmStatusToggle = () => {
    if (!pendingAction) return

    startTransition(async () => {
      const result = await toggleDealerStatus(dealerId, pendingAction)

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
      setPendingAction(null)
    })
  }

  const isBlocking = pendingAction === 'BLOCKED'

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
            <Link href={`/admin/dealers/${dealerId}`}>
              <Eye className="mr-2 h-4 w-4" />
              View Details
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href={`/admin/dealers/${dealerId}/edit`}>
              <Pencil className="mr-2 h-4 w-4" />
              Edit
            </Link>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          {status === 'ACTIVE' ? (
            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              onClick={() => handleStatusToggle('BLOCKED')}
            >
              <Ban className="mr-2 h-4 w-4" />
              Block Dealer
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem
              className="text-success focus:text-success"
              onClick={() => handleStatusToggle('ACTIVE')}
            >
              <CheckCircle className="mr-2 h-4 w-4" />
              Unblock Dealer
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {isBlocking ? 'Block Dealer' : 'Unblock Dealer'}
            </DialogTitle>
            <DialogDescription>
              {isBlocking
                ? `Are you sure you want to block ${dealerName}? They will not be able to access their account.`
                : `Are you sure you want to unblock ${dealerName}? They will regain access to their account.`}
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
              variant={isBlocking ? 'destructive' : 'default'}
              onClick={confirmStatusToggle}
              disabled={isPending}
            >
              {isPending ? 'Processing...' : isBlocking ? 'Block' : 'Unblock'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
