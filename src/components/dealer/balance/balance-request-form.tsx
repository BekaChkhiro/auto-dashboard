'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { useToast } from '@/hooks/use-toast'
import { useFileUpload } from '@/hooks/use-file-upload'
import { createBalanceRequest } from '@/lib/actions/balance-requests'
import { Upload, X, FileImage, Loader2, Check, AlertCircle } from 'lucide-react'
import Image from 'next/image'

export function BalanceRequestForm() {
  const [amount, setAmount] = useState('')
  const [comment, setComment] = useState('')
  const [isPending, startTransition] = useTransition()
  const { toast } = useToast()

  const {
    files,
    isUploading,
    upload,
    remove,
    clear,
  } = useFileUpload({
    context: { type: 'receipt' },
    maxFiles: 1,
    onUploadComplete: (result) => {
      if (result.success) {
        toast({
          title: 'Receipt uploaded',
          description: 'Your receipt has been uploaded successfully.',
        })
      }
    },
    onError: (error) => {
      toast({
        title: 'Upload failed',
        description: error,
        variant: 'destructive',
      })
    },
  })

  const uploadedFile = files.find((f) => f.status === 'completed')
  const uploadingFile = files.find((f) => f.status === 'uploading' || f.status === 'processing')

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files
    if (selectedFiles && selectedFiles.length > 0) {
      clear()
      await upload(Array.from(selectedFiles))
    }
    // Reset input
    e.target.value = ''
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const amountValue = parseFloat(amount)

    if (isNaN(amountValue) || amountValue <= 0) {
      toast({
        title: 'Invalid amount',
        description: 'Please enter a valid amount greater than 0.',
        variant: 'destructive',
      })
      return
    }

    if (!uploadedFile?.url) {
      toast({
        title: 'Receipt required',
        description: 'Please upload a receipt image.',
        variant: 'destructive',
      })
      return
    }

    startTransition(async () => {
      const result = await createBalanceRequest({
        amount: amountValue,
        receiptUrl: uploadedFile.url!,
        comment: comment.trim() || undefined,
      })

      if (result.success) {
        toast({
          title: 'Request submitted',
          description: 'Your balance top-up request has been submitted for review.',
        })
        // Reset form
        setAmount('')
        setComment('')
        clear()
      } else {
        toast({
          title: 'Request failed',
          description: result.message,
          variant: 'destructive',
        })
      }
    })
  }

  const isSubmitDisabled = isPending || isUploading || !uploadedFile?.url || !amount

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-xl">
      {/* Amount Input */}
      <div className="space-y-2">
        <Label htmlFor="amount">Amount (USD)</Label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
          <Input
            id="amount"
            type="number"
            step="0.01"
            min="1"
            max="1000000"
            placeholder="0.00"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="pl-7"
            disabled={isPending}
          />
        </div>
        <p className="text-xs text-muted-foreground">
          Enter the amount you have deposited.
        </p>
      </div>

      {/* Receipt Upload */}
      <div className="space-y-2">
        <Label>Receipt Image</Label>

        {!uploadedFile && !uploadingFile && (
          <div className="border-2 border-dashed rounded-lg p-6 text-center hover:border-primary/50 transition-colors">
            <input
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
              id="receipt-upload"
              disabled={isPending || isUploading}
            />
            <label
              htmlFor="receipt-upload"
              className="cursor-pointer flex flex-col items-center gap-2"
            >
              <Upload className="h-8 w-8 text-muted-foreground" />
              <span className="text-sm font-medium">Click to upload receipt</span>
              <span className="text-xs text-muted-foreground">
                PNG, JPG up to 10MB
              </span>
            </label>
          </div>
        )}

        {uploadingFile && (
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <FileImage className="h-8 w-8 text-muted-foreground" />
                <div className="flex-1 space-y-1">
                  <p className="text-sm font-medium truncate">{uploadingFile.file.name}</p>
                  <Progress value={uploadingFile.progress} className="h-2" />
                  <p className="text-xs text-muted-foreground">
                    {uploadingFile.status === 'processing' ? 'Processing...' : `Uploading ${uploadingFile.progress}%`}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {uploadedFile && (
          <Card>
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className="relative h-20 w-20 rounded-md overflow-hidden bg-muted">
                  {uploadedFile.url && (
                    <Image
                      src={uploadedFile.url}
                      alt="Receipt"
                      fill
                      className="object-cover"
                    />
                  )}
                </div>
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-600" />
                    <p className="text-sm font-medium">Receipt uploaded</p>
                  </div>
                  <p className="text-xs text-muted-foreground truncate">
                    {uploadedFile.file.name}
                  </p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => remove(uploadedFile.id)}
                  disabled={isPending}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {files.some((f) => f.status === 'error') && (
          <div className="flex items-center gap-2 text-sm text-red-600">
            <AlertCircle className="h-4 w-4" />
            <span>{files.find((f) => f.status === 'error')?.error}</span>
          </div>
        )}
      </div>

      {/* Comment */}
      <div className="space-y-2">
        <Label htmlFor="comment">Comment (Optional)</Label>
        <Textarea
          id="comment"
          placeholder="Add any additional details about this payment..."
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          rows={3}
          disabled={isPending}
        />
      </div>

      {/* Submit Button */}
      <Button type="submit" disabled={isSubmitDisabled} className="w-full sm:w-auto">
        {isPending ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Submitting...
          </>
        ) : (
          'Submit Request'
        )}
      </Button>
    </form>
  )
}
