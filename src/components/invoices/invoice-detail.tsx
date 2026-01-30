'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import {
  CheckCircle,
  XCircle,
  Wallet,
  CreditCard,
  User,
  FileText,
  ExternalLink,
  Download,
} from 'lucide-react'
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
import {
  markInvoiceAsPaid,
  cancelInvoice,
  type InvoiceDetail as InvoiceDetailType,
} from '@/lib/actions/invoices'
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
  const t = useTranslations('invoiceDetail')
  const tCommon = useTranslations('common')

  const handlePayFromBalance = () => {
    startTransition(async () => {
      const result = await markInvoiceAsPaid(invoice.id, true)

      if (result.success) {
        toast({
          title: tCommon('success'),
          description: result.message,
          variant: 'success',
        })
        router.refresh()
      } else {
        toast({
          title: tCommon('error'),
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
          title: tCommon('success'),
          description: result.message,
          variant: 'success',
        })
        router.refresh()
      } else {
        toast({
          title: tCommon('error'),
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
          title: tCommon('success'),
          description: result.message,
          variant: 'success',
        })
        router.refresh()
      } else {
        toast({
          title: tCommon('error'),
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
                {t('title')}
              </div>
              <InvoiceStatusBadge status={invoice.status} />
            </CardTitle>
            <CardDescription>
              {t('createdOn')} {formatDateTime(invoice.createdAt, 'en', 'long', 'short')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3">
              <div>
                <p className="text-sm text-muted-foreground">{t('invoiceNumber')}</p>
                <p className="text-xl font-bold">{invoice.invoiceNumber}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t('totalAmount')}</p>
                <p className="text-2xl font-bold">{formatCurrency(invoice.totalAmount, 'en')}</p>
              </div>
              <Separator />
              <div>
                <p className="text-sm text-muted-foreground">{t('createdBy')}</p>
                <p className="font-medium">{invoice.createdBy.name}</p>
              </div>
              {invoice.paidAt && (
                <>
                  <Separator />
                  <div>
                    <p className="text-sm text-muted-foreground">{t('paidOn')}</p>
                    <p className="font-medium">
                      {formatDateTime(invoice.paidAt, 'en', 'long', 'short')}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">{t('paymentMethod')}</p>
                    <p className="font-medium">
                      {invoice.paidFromBalance ? t('fromBalance') : t('externalPayment')}
                    </p>
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
              {t('dealerInformation')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3">
              <div>
                <p className="text-sm text-muted-foreground">{t('name')}</p>
                <Link
                  href={`/admin/dealers/${invoice.dealer.id}`}
                  className="font-medium hover:underline flex items-center gap-1"
                >
                  {invoice.dealer.name}
                  <ExternalLink className="h-3 w-3" />
                </Link>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t('email')}</p>
                <p className="font-medium">{invoice.dealer.email}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t('phone')}</p>
                <p className="font-medium">{invoice.dealer.phone}</p>
              </div>
              {invoice.dealer.companyName && (
                <div>
                  <p className="text-sm text-muted-foreground">{t('company')}</p>
                  <p className="font-medium">{invoice.dealer.companyName}</p>
                </div>
              )}
              <div>
                <p className="text-sm text-muted-foreground">{t('address')}</p>
                <p className="font-medium">{invoice.dealer.address}</p>
              </div>
              <Separator />
              <div>
                <p className="text-sm text-muted-foreground">{t('currentBalance')}</p>
                <p className="text-xl font-bold">{formatCurrency(invoice.dealer.balance, 'en')}</p>
              </div>
              {isPendingInvoice && (
                <div>
                  <p className="text-sm text-muted-foreground">{t('balanceAfterPayment')}</p>
                  <p
                    className={`text-xl font-bold ${invoice.dealer.balance - invoice.totalAmount < 0 ? 'text-destructive' : 'text-success'}`}
                  >
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
            <CardTitle>
              {t('invoiceItems')} ({invoice.items.length}{' '}
              {invoice.items.length !== 1 ? t('vehicles') : t('vehicle')})
            </CardTitle>
            <CardDescription>{t('vehiclesIncluded')}</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('vehicleColumn')}</TableHead>
                  <TableHead>{t('vinColumn')}</TableHead>
                  <TableHead className="hidden md:table-cell">{t('lotColumn')}</TableHead>
                  <TableHead className="text-right">{t('amountColumn')}</TableHead>
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
                    <TableCell className="font-mono text-sm">{item.vehicle.vin}</TableCell>
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
                    {t('total')}
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
        <div className="grid grid-cols-1 gap-3 mt-6 sm:flex sm:flex-wrap sm:gap-4">
          <Button
            size="lg"
            onClick={() => setShowPayFromBalanceDialog(true)}
            disabled={isPending}
            className="w-full sm:w-auto"
          >
            <Wallet className="mr-2 h-5 w-5" />
            {t('payFromBalance')}
          </Button>
          <Button
            size="lg"
            variant="outline"
            onClick={() => setShowPayExternalDialog(true)}
            disabled={isPending}
            className="w-full sm:w-auto"
          >
            <CreditCard className="mr-2 h-5 w-5" />
            <span className="hidden sm:inline">{t('markAsPaidExternal')}</span>
            <span className="sm:hidden">{t('externalPayment')}</span>
          </Button>
          <Button size="lg" variant="outline" disabled={isPending} className="w-full sm:w-auto">
            <Download className="mr-2 h-5 w-5" />
            {t('downloadPdf')}
          </Button>
          <Button
            size="lg"
            variant="destructive"
            onClick={() => setShowCancelDialog(true)}
            disabled={isPending}
            className="w-full sm:w-auto"
          >
            <XCircle className="mr-2 h-5 w-5" />
            {t('cancelInvoice')}
          </Button>
        </div>
      )}

      {invoice.status === 'PAID' && (
        <div className="flex gap-4 mt-6">
          <Button size="lg" variant="outline" disabled={isPending}>
            <Download className="mr-2 h-5 w-5" />
            {t('downloadPdf')}
          </Button>
        </div>
      )}

      {/* Pay from Balance Dialog */}
      <Dialog open={showPayFromBalanceDialog} onOpenChange={setShowPayFromBalanceDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('payFromBalanceTitle')}</DialogTitle>
            <DialogDescription>
              {t('payFromBalanceConfirm')
                .replace('{invoiceNumber}', invoice.invoiceNumber)
                .replace('{dealerName}', invoice.dealer.name)}{' '}
              ({formatCurrency(invoice.totalAmount, 'en')})
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-muted-foreground">
              {t('currentBalanceLabel')}{' '}
              <span className="font-medium">{formatCurrency(invoice.dealer.balance, 'en')}</span>
            </p>
            <p className="text-sm text-muted-foreground">
              {t('afterPaymentLabel')}{' '}
              <span
                className={`font-medium ${invoice.dealer.balance - invoice.totalAmount < 0 ? 'text-destructive' : 'text-success'}`}
              >
                {formatCurrency(invoice.dealer.balance - invoice.totalAmount, 'en')}
              </span>
            </p>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowPayFromBalanceDialog(false)}
              disabled={isPending}
            >
              {tCommon('cancel')}
            </Button>
            <Button onClick={handlePayFromBalance} disabled={isPending}>
              <CheckCircle className="mr-2 h-4 w-4" />
              {isPending ? tCommon('loading') : t('payFromBalance')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Pay External Dialog */}
      <Dialog open={showPayExternalDialog} onOpenChange={setShowPayExternalDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('markAsPaidTitle')}</DialogTitle>
            <DialogDescription>
              {t('markAsPaidConfirm').replace('{invoiceNumber}', invoice.invoiceNumber)} (
              {formatCurrency(invoice.totalAmount, 'en')})
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowPayExternalDialog(false)}
              disabled={isPending}
            >
              {tCommon('cancel')}
            </Button>
            <Button onClick={handlePayExternal} disabled={isPending}>
              <CheckCircle className="mr-2 h-4 w-4" />
              {isPending ? tCommon('loading') : t('markAsPaid')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cancel Dialog */}
      <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('cancelInvoiceTitle')}</DialogTitle>
            <DialogDescription>
              {t('cancelInvoiceConfirm').replace('{invoiceNumber}', invoice.invoiceNumber)}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowCancelDialog(false)}
              disabled={isPending}
            >
              {t('keepInvoice')}
            </Button>
            <Button variant="destructive" onClick={handleCancel} disabled={isPending}>
              <XCircle className="mr-2 h-4 w-4" />
              {isPending ? tCommon('loading') : t('cancelInvoice')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
