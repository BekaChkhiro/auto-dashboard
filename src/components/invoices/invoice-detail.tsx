'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { CheckCircle, XCircle, Wallet, CreditCard, User, FileText, ExternalLink, Download } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
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
import { InvoiceStatusBadge } from './invoice-status-badge'
import { markInvoiceAsPaid, cancelInvoice, type InvoiceDetail as InvoiceDetailType } from '@/lib/actions/invoices'
import { formatCurrency, formatDateTime } from '@/lib/formatting'

interface InvoiceDetailProps {
  invoice: InvoiceDetailType
}

export function InvoiceDetail({ invoice }: InvoiceDetailProps) {
  const router = useRouter()
  const mounted = useMounted()
  const [isPending, startTransition] = useTransition()
  const [showPayFromBalanceDialog, setShowPayFromBalanceDialog] = useState(false)
  const [showPayExternalDialog, setShowPayExternalDialog] = useState(false)
  const [showCancelDialog, setShowCancelDialog] = useState(false)

  const handlePayFromBalance = () => {
    startTransition(async () => {
      const result = await markInvoiceAsPaid(invoice.id, true)

      if (result.success) {
        toast({
          title: 'Success',
          description: result.message,
          variant: 'success',
        })
        router.refresh()
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
      const result = await markInvoiceAsPaid(invoice.id, false)

      if (result.success) {
        toast({
          title: 'Success',
          description: result.message,
          variant: 'success',
        })
        router.refresh()
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
      const result = await cancelInvoice(invoice.id)

      if (result.success) {
        toast({
          title: 'Success',
          description: result.message,
          variant: 'success',
        })
        router.refresh()
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

  const isPendingInvoice = invoice.status === 'PENDING'

  return (
    <>
      <div className="grid gap-6 md:grid-cols-2">
        {/* Invoice Details Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Invoice Details
              </div>
              <InvoiceStatusBadge status={invoice.status} />
            </CardTitle>
            <CardDescription>
              Created on {formatDateTime(invoice.createdAt, 'en', 'long', 'short')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3">
              <div>
                <p className="text-sm text-muted-foreground">Invoice Number</p>
                <p className="text-xl font-bold">{invoice.invoiceNumber}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Amount</p>
                <p className="text-2xl font-bold">{formatCurrency(invoice.totalAmount, 'en')}</p>
              </div>
              <Separator />
              <div>
                <p className="text-sm text-muted-foreground">Created By</p>
                <p className="font-medium">{invoice.createdBy.name}</p>
              </div>
              {invoice.paidAt && (
                <>
                  <Separator />
                  <div>
                    <p className="text-sm text-muted-foreground">Paid On</p>
                    <p className="font-medium">{formatDateTime(invoice.paidAt, 'en', 'long', 'short')}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Payment Method</p>
                    <p className="font-medium">{invoice.paidFromBalance ? 'From Balance' : 'External Payment'}</p>
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Dealer Info Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Dealer Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3">
              <div>
                <p className="text-sm text-muted-foreground">Name</p>
                <Link
                  href={`/admin/dealers/${invoice.dealer.id}`}
                  className="font-medium hover:underline flex items-center gap-1"
                >
                  {invoice.dealer.name}
                  <ExternalLink className="h-3 w-3" />
                </Link>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Email</p>
                <p className="font-medium">{invoice.dealer.email}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Phone</p>
                <p className="font-medium">{invoice.dealer.phone}</p>
              </div>
              {invoice.dealer.companyName && (
                <div>
                  <p className="text-sm text-muted-foreground">Company</p>
                  <p className="font-medium">{invoice.dealer.companyName}</p>
                </div>
              )}
              <div>
                <p className="text-sm text-muted-foreground">Address</p>
                <p className="font-medium">{invoice.dealer.address}</p>
              </div>
              <Separator />
              <div>
                <p className="text-sm text-muted-foreground">Current Balance</p>
                <p className="text-xl font-bold">{formatCurrency(invoice.dealer.balance, 'en')}</p>
              </div>
              {isPendingInvoice && (
                <div>
                  <p className="text-sm text-muted-foreground">Balance After Payment</p>
                  <p className={`text-xl font-bold ${invoice.dealer.balance - invoice.totalAmount < 0 ? 'text-destructive' : 'text-success'}`}>
                    {formatCurrency(invoice.dealer.balance - invoice.totalAmount, 'en')}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Invoice Items Card */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Invoice Items ({invoice.items.length} vehicle{invoice.items.length !== 1 ? 's' : ''})</CardTitle>
            <CardDescription>
              Vehicles included in this invoice
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Vehicle</TableHead>
                  <TableHead>VIN</TableHead>
                  <TableHead className="hidden md:table-cell">Lot #</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoice.items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <Link
                        href={`/admin/vehicles/${item.vehicle.id}`}
                        className="font-medium hover:underline"
                      >
                        {item.vehicle.year} {item.vehicle.make.name} {item.vehicle.model.name}
                      </Link>
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      {item.vehicle.vin}
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-muted-foreground">
                      {item.vehicle.lotNumber || '-'}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(item.amount, 'en')}
                    </TableCell>
                  </TableRow>
                ))}
                <TableRow className="bg-muted/50">
                  <TableCell colSpan={3} className="font-bold text-right">
                    Total
                  </TableCell>
                  <TableCell className="text-right font-bold">
                    {formatCurrency(invoice.totalAmount, 'en')}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* Action Buttons */}
      {isPendingInvoice && mounted && (
        <div className="flex flex-wrap gap-4 mt-6">
          <Button
            size="lg"
            onClick={() => setShowPayFromBalanceDialog(true)}
            disabled={isPending}
          >
            <Wallet className="mr-2 h-5 w-5" />
            Pay from Balance
          </Button>
          <Button
            size="lg"
            variant="outline"
            onClick={() => setShowPayExternalDialog(true)}
            disabled={isPending}
          >
            <CreditCard className="mr-2 h-5 w-5" />
            Mark as Paid (External)
          </Button>
          <Button
            size="lg"
            variant="outline"
            disabled={isPending}
          >
            <Download className="mr-2 h-5 w-5" />
            Download PDF
          </Button>
          <Button
            size="lg"
            variant="destructive"
            onClick={() => setShowCancelDialog(true)}
            disabled={isPending}
          >
            <XCircle className="mr-2 h-5 w-5" />
            Cancel Invoice
          </Button>
        </div>
      )}

      {invoice.status === 'PAID' && (
        <div className="flex gap-4 mt-6">
          <Button size="lg" variant="outline" disabled={isPending}>
            <Download className="mr-2 h-5 w-5" />
            Download PDF
          </Button>
        </div>
      )}

      {/* Pay from Balance Dialog */}
      <Dialog open={showPayFromBalanceDialog} onOpenChange={setShowPayFromBalanceDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Pay Invoice from Balance</DialogTitle>
            <DialogDescription>
              Mark invoice {invoice.invoiceNumber} ({formatCurrency(invoice.totalAmount, 'en')}) as paid and deduct from {invoice.dealer.name}&apos;s balance?
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-muted-foreground">Current Balance: <span className="font-medium">{formatCurrency(invoice.dealer.balance, 'en')}</span></p>
            <p className="text-sm text-muted-foreground">After Payment: <span className={`font-medium ${invoice.dealer.balance - invoice.totalAmount < 0 ? 'text-destructive' : 'text-success'}`}>{formatCurrency(invoice.dealer.balance - invoice.totalAmount, 'en')}</span></p>
          </div>
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
              Mark invoice {invoice.invoiceNumber} ({formatCurrency(invoice.totalAmount, 'en')}) as paid? This will NOT deduct from the dealer&apos;s balance.
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
              Are you sure you want to cancel invoice {invoice.invoiceNumber}? This action cannot be undone.
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
