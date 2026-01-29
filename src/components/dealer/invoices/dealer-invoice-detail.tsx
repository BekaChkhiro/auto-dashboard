'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { CheckCircle, Wallet, FileText, Download, Car } from 'lucide-react'
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
import { InvoiceStatusBadge } from '@/components/invoices/invoice-status-badge'
import { payDealerInvoiceFromBalance, type DealerInvoiceDetail as DealerInvoiceDetailType } from '@/lib/actions/dealer-invoices'
import { formatCurrency, formatDateTime } from '@/lib/formatting'

interface DealerInvoiceDetailProps {
  invoice: DealerInvoiceDetailType
}

export function DealerInvoiceDetail({ invoice }: DealerInvoiceDetailProps) {
  const router = useRouter()
  const mounted = useMounted()
  const [isPending, startTransition] = useTransition()
  const [showPayDialog, setShowPayDialog] = useState(false)

  const handlePayFromBalance = () => {
    startTransition(async () => {
      const result = await payDealerInvoiceFromBalance(invoice.id)

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

      setShowPayDialog(false)
    })
  }

  const handleDownloadPdf = () => {
    window.open(`/api/invoices/${invoice.id}/pdf`, '_blank')
  }

  const isPendingInvoice = invoice.status === 'PENDING'
  const hasSufficientBalance = invoice.currentBalance >= invoice.totalAmount
  const balanceAfterPayment = invoice.currentBalance - invoice.totalAmount

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

        {/* Balance Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wallet className="h-5 w-5" />
              Your Balance
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3">
              <div>
                <p className="text-sm text-muted-foreground">Current Balance</p>
                <p className={`text-2xl font-bold ${invoice.currentBalance < 0 ? 'text-destructive' : ''}`}>
                  {formatCurrency(invoice.currentBalance, 'en')}
                </p>
              </div>
              {isPendingInvoice && (
                <>
                  <Separator />
                  <div>
                    <p className="text-sm text-muted-foreground">Invoice Amount</p>
                    <p className="text-lg font-medium text-destructive">
                      - {formatCurrency(invoice.totalAmount, 'en')}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Balance After Payment</p>
                    <p className={`text-xl font-bold ${balanceAfterPayment < 0 ? 'text-destructive' : 'text-success'}`}>
                      {formatCurrency(balanceAfterPayment, 'en')}
                    </p>
                  </div>
                  {!hasSufficientBalance && (
                    <p className="text-sm text-destructive">
                      Insufficient balance to pay this invoice.{' '}
                      <Link href="/dealer/balance" className="underline hover:no-underline">
                        Top up your balance
                      </Link>
                    </p>
                  )}
                </>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Invoice Items Card */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Car className="h-5 w-5" />
              Invoice Items ({invoice.items.length} vehicle{invoice.items.length !== 1 ? 's' : ''})
            </CardTitle>
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
                        href={`/dealer/vehicles/${item.vehicle.id}`}
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
      {mounted && (
        <div className="flex flex-wrap gap-4 mt-6">
          {isPendingInvoice && (
            <Button
              size="lg"
              onClick={() => setShowPayDialog(true)}
              disabled={isPending || !hasSufficientBalance}
            >
              <Wallet className="mr-2 h-5 w-5" />
              Pay from Balance
            </Button>
          )}
          <Button
            size="lg"
            variant="outline"
            onClick={handleDownloadPdf}
            disabled={isPending}
          >
            <Download className="mr-2 h-5 w-5" />
            Download PDF
          </Button>
        </div>
      )}

      {/* Pay from Balance Dialog */}
      <Dialog open={showPayDialog} onOpenChange={setShowPayDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Pay Invoice from Balance</DialogTitle>
            <DialogDescription>
              Pay invoice {invoice.invoiceNumber} ({formatCurrency(invoice.totalAmount, 'en')}) from your balance?
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-2">
            <p className="text-sm text-muted-foreground">
              Current Balance: <span className="font-medium">{formatCurrency(invoice.currentBalance, 'en')}</span>
            </p>
            <p className="text-sm text-muted-foreground">
              Invoice Amount: <span className="font-medium text-destructive">- {formatCurrency(invoice.totalAmount, 'en')}</span>
            </p>
            <Separator />
            <p className="text-sm text-muted-foreground">
              After Payment:{' '}
              <span className={`font-medium ${balanceAfterPayment < 0 ? 'text-destructive' : 'text-success'}`}>
                {formatCurrency(balanceAfterPayment, 'en')}
              </span>
            </p>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowPayDialog(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button onClick={handlePayFromBalance} disabled={isPending}>
              <CheckCircle className="mr-2 h-4 w-4" />
              {isPending ? 'Processing...' : 'Confirm Payment'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
