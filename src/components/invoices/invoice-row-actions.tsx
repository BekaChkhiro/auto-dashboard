'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { MoreHorizontal, Eye, CheckCircle, XCircle, Wallet, CreditCard } from 'lucide-react'
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
import { useMounted } from '@/hooks/use-mounted'
import { markInvoiceAsPaid, cancelInvoice } from '@/lib/actions/invoices'
import type { InvoiceStatus } from '@/generated/prisma'
import { formatCurrency } from '@/lib/formatting'

interface InvoiceRowActionsProps {
  invoiceId: string
  invoiceNumber: string
  totalAmount: number
  dealerName: string
  status: InvoiceStatus
}

export function InvoiceRowActions({
  invoiceId,
  invoiceNumber,
  totalAmount,
  dealerName,
  status,
}: InvoiceRowActionsProps) {
  const mounted = useMounted()
  const [isPending, startTransition] = useTransition()
  const [showPayFromBalanceDialog, setShowPayFromBalanceDialog] = useState(false)
  const [showPayExternalDialog, setShowPayExternalDialog] = useState(false)
  const [showCancelDialog, setShowCancelDialog] = useState(false)

  const handlePayFromBalance = () => {
    startTransition(async () => {
      const result = await markInvoiceAsPaid(invoiceId, true)

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

      setShowPayFromBalanceDialog(false)
    })
  }

  const handlePayExternal = () => {
    startTransition(async () => {
      const result = await markInvoiceAsPaid(invoiceId, false)

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

      setShowPayExternalDialog(false)
    })
  }

  const handleCancel = () => {
    startTransition(async () => {
      const result = await cancelInvoice(invoiceId)

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

      setShowCancelDialog(false)
    })
  }

  const isPendingInvoice = status === 'PENDING'

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
            <Link href={`/admin/invoices/${invoiceId}`}>
              <Eye className="mr-2 h-4 w-4" />
              View Details
            </Link>
          </DropdownMenuItem>
          {isPendingInvoice && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-success focus:text-success"
                onClick={() => setShowPayFromBalanceDialog(true)}
              >
                <Wallet className="mr-2 h-4 w-4" />
                Pay from Balance
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-success focus:text-success"
                onClick={() => setShowPayExternalDialog(true)}
              >
                <CreditCard className="mr-2 h-4 w-4" />
                Mark as Paid (External)
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={() => setShowCancelDialog(true)}
              >
                <XCircle className="mr-2 h-4 w-4" />
                Cancel Invoice
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Pay from Balance Dialog */}
      <Dialog open={showPayFromBalanceDialog} onOpenChange={setShowPayFromBalanceDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Pay Invoice from Balance</DialogTitle>
            <DialogDescription>
              Mark invoice {invoiceNumber} ({formatCurrency(totalAmount, 'en')}) as paid and deduct from {dealerName}&apos;s balance?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowPayFromBalanceDialog(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button onClick={handlePayFromBalance} disabled={isPending}>
              <CheckCircle className="mr-2 h-4 w-4" />
              {isPending ? 'Processing...' : 'Pay from Balance'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Pay External Dialog */}
      <Dialog open={showPayExternalDialog} onOpenChange={setShowPayExternalDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Mark as Paid (External Payment)</DialogTitle>
            <DialogDescription>
              Mark invoice {invoiceNumber} ({formatCurrency(totalAmount, 'en')}) as paid? This will NOT deduct from the dealer&apos;s balance (use for cash/external payments).
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowPayExternalDialog(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button onClick={handlePayExternal} disabled={isPending}>
              <CheckCircle className="mr-2 h-4 w-4" />
              {isPending ? 'Processing...' : 'Mark as Paid'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cancel Dialog */}
      <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel Invoice</DialogTitle>
            <DialogDescription>
              Are you sure you want to cancel invoice {invoiceNumber}? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowCancelDialog(false)}
              disabled={isPending}
            >
              Keep Invoice
            </Button>
            <Button variant="destructive" onClick={handleCancel} disabled={isPending}>
              <XCircle className="mr-2 h-4 w-4" />
              {isPending ? 'Cancelling...' : 'Cancel Invoice'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
