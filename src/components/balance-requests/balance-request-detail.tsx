'use client'

import { useState, useTransition } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { CheckCircle, XCircle, ExternalLink, User, Calendar, MessageSquare, DollarSign } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
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
import { BalanceRequestStatusBadge } from './balance-request-status-badge'
import { approveBalanceRequest, rejectBalanceRequest, type BalanceRequestDetail as BalanceRequestDetailType } from '@/lib/actions/balance-requests'
import { formatCurrency, formatDateTime } from '@/lib/formatting'

interface BalanceRequestDetailProps {
  request: BalanceRequestDetailType
}

export function BalanceRequestDetail({ request }: BalanceRequestDetailProps) {
  const router = useRouter()
  const mounted = useMounted()
  const [isPending, startTransition] = useTransition()
  const [showApproveDialog, setShowApproveDialog] = useState(false)
  const [showRejectDialog, setShowRejectDialog] = useState(false)
  const [adminComment, setAdminComment] = useState('')

  const handleApprove = () => {
    startTransition(async () => {
      const result = await approveBalanceRequest(request.id, adminComment || undefined)

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

      setShowApproveDialog(false)
      setAdminComment('')
    })
  }

  const handleReject = () => {
    startTransition(async () => {
      const result = await rejectBalanceRequest(request.id, adminComment || undefined)

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

      setShowRejectDialog(false)
      setAdminComment('')
    })
  }

  const isPendingRequest = request.status === 'PENDING'

  return (
    <>
      <div className="grid gap-6 md:grid-cols-2">
        {/* Request Details Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Request Details</span>
              <BalanceRequestStatusBadge status={request.status} />
            </CardTitle>
            <CardDescription>
              Submitted on {formatDateTime(request.createdAt, 'en', 'long', 'short')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                <DollarSign className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Amount Requested</p>
                <p className="text-2xl font-bold">{formatCurrency(request.amount, 'en')}</p>
              </div>
            </div>

            <Separator />

            {request.comment && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <MessageSquare className="h-4 w-4" />
                  Dealer Comment
                </div>
                <p className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-md">
                  {request.comment}
                </p>
              </div>
            )}

            {request.adminComment && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <MessageSquare className="h-4 w-4" />
                  Admin Comment
                </div>
                <p className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-md">
                  {request.adminComment}
                </p>
              </div>
            )}

            {request.processedBy && request.processedAt && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <Calendar className="h-4 w-4" />
                  Processed
                </div>
                <p className="text-sm text-muted-foreground">
                  By {request.processedBy.name} on {formatDateTime(request.processedAt, 'en', 'long', 'short')}
                </p>
              </div>
            )}
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
                  href={`/admin/dealers/${request.dealer.id}`}
                  className="font-medium hover:underline flex items-center gap-1"
                >
                  {request.dealer.name}
                  <ExternalLink className="h-3 w-3" />
                </Link>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Email</p>
                <p className="font-medium">{request.dealer.email}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Phone</p>
                <p className="font-medium">{request.dealer.phone}</p>
              </div>
              {request.dealer.companyName && (
                <div>
                  <p className="text-sm text-muted-foreground">Company</p>
                  <p className="font-medium">{request.dealer.companyName}</p>
                </div>
              )}
              <Separator />
              <div>
                <p className="text-sm text-muted-foreground">Current Balance</p>
                <p className="text-xl font-bold">{formatCurrency(request.dealer.balance, 'en')}</p>
              </div>
              {isPendingRequest && (
                <div>
                  <p className="text-sm text-muted-foreground">Balance After Approval</p>
                  <p className="text-xl font-bold text-success">
                    {formatCurrency(request.dealer.balance + request.amount, 'en')}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Receipt Image Card */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Receipt / Payment Proof</CardTitle>
            <CardDescription>
              Document uploaded by the dealer as proof of payment
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="relative aspect-[4/3] max-w-2xl mx-auto overflow-hidden rounded-lg border bg-muted">
              <Image
                src={request.receiptUrl}
                alt="Payment receipt"
                fill
                className="object-contain"
              />
            </div>
            <div className="mt-4 text-center">
              <Button variant="outline" asChild>
                <a href={request.receiptUrl} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Open Full Size
                </a>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Action Buttons */}
      {isPendingRequest && mounted && (
        <div className="flex gap-4 mt-6">
          <Button
            size="lg"
            onClick={() => setShowApproveDialog(true)}
            disabled={isPending}
          >
            <CheckCircle className="mr-2 h-5 w-5" />
            Approve Request
          </Button>
          <Button
            size="lg"
            variant="destructive"
            onClick={() => setShowRejectDialog(true)}
            disabled={isPending}
          >
            <XCircle className="mr-2 h-5 w-5" />
            Reject Request
          </Button>
        </div>
      )}

      {/* Approve Dialog */}
      <Dialog open={showApproveDialog} onOpenChange={setShowApproveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Approve Balance Request</DialogTitle>
            <DialogDescription>
              Approve the balance request of {formatCurrency(request.amount, 'en')} from {request.dealer.name}?
              This will add the amount to their account balance.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="approve-comment-detail">Comment (optional)</Label>
            <Textarea
              id="approve-comment-detail"
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
              Reject the balance request of {formatCurrency(request.amount, 'en')} from {request.dealer.name}?
              The dealer will be notified of the rejection.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="reject-comment-detail">Reason (optional)</Label>
            <Textarea
              id="reject-comment-detail"
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
