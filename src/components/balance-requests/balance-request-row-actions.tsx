'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { MoreHorizontal, Eye, CheckCircle, XCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
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
import { useMounted } from '@/hooks/use-mounted'
import { approveBalanceRequest, rejectBalanceRequest } from '@/lib/actions/balance-requests'
import type { BalanceRequestStatus } from '@/generated/prisma'
import { formatCurrency } from '@/lib/formatting'

interface BalanceRequestRowActionsProps {
  requestId: string
  dealerName: string
  amount: number
  status: BalanceRequestStatus
}

export function BalanceRequestRowActions({
  requestId,
  dealerName,
  amount,
  status,
}: BalanceRequestRowActionsProps) {
  const mounted = useMounted()
  const [isPending, startTransition] = useTransition()
  const [showApproveDialog, setShowApproveDialog] = useState(false)
  const [showRejectDialog, setShowRejectDialog] = useState(false)
  const [adminComment, setAdminComment] = useState('')

  const handleApprove = () => {
    startTransition(async () => {
      const result = await approveBalanceRequest(requestId, adminComment || undefined)

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

      setShowApproveDialog(false)
      setAdminComment('')
    })
  }

  const handleReject = () => {
    startTransition(async () => {
      const result = await rejectBalanceRequest(requestId, adminComment || undefined)

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

      setShowRejectDialog(false)
      setAdminComment('')
    })
  }

  const isPendingRequest = status === 'PENDING'

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
            <Link href={`/admin/balance-requests/${requestId}`}>
              <Eye className="mr-2 h-4 w-4" />
              View Details
            </Link>
          </DropdownMenuItem>
          {isPendingRequest && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-success focus:text-success"
                onClick={() => setShowApproveDialog(true)}
              >
                <CheckCircle className="mr-2 h-4 w-4" />
                Approve
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={() => setShowRejectDialog(true)}
              >
                <XCircle className="mr-2 h-4 w-4" />
                Reject
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Approve Dialog */}
      <Dialog open={showApproveDialog} onOpenChange={setShowApproveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Approve Balance Request</DialogTitle>
            <DialogDescription>
              Approve the balance request of {formatCurrency(amount, 'en')} from {dealerName}?
              This will add the amount to their account balance.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="approve-comment">Comment (optional)</Label>
            <Textarea
              id="approve-comment"
              placeholder="Add a comment for the dealer..."
              value={adminComment}
              onChange={(e) => setAdminComment(e.target.value)}
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowApproveDialog(false)
                setAdminComment('')
              }}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button
              variant="default"
              onClick={handleApprove}
              disabled={isPending}
            >
              {isPending ? 'Processing...' : 'Approve'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Balance Request</DialogTitle>
            <DialogDescription>
              Reject the balance request of {formatCurrency(amount, 'en')} from {dealerName}?
              The dealer will be notified of the rejection.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="reject-comment">Reason (optional)</Label>
            <Textarea
              id="reject-comment"
              placeholder="Provide a reason for rejection..."
              value={adminComment}
              onChange={(e) => setAdminComment(e.target.value)}
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowRejectDialog(false)
                setAdminComment('')
              }}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={isPending}
            >
              {isPending ? 'Processing...' : 'Reject'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
