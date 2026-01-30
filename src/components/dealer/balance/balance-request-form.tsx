'use client'

import { useTransition } from 'react'
import { useTranslations } from 'next-intl'
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
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

export function BalanceRequestForm() {
  const [isPending, startTransition] = useTransition()
  const { toast } = useToast()
  const t = useTranslations('forms')
  const tUpload = useTranslations('upload')
  const tToasts = useTranslations('toasts')

  // Form schema (without receiptUrl since it's handled separately via upload)
  const formSchema = z.object({
    amount: z
      .string()
      .min(1, t('required'))
      .refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0, {
        message: t('required'),
      })
      .refine((val) => parseFloat(val) <= 1000000, {
        message: t('required'),
      }),
    comment: z.string().max(500).optional(),
  })

  type FormInput = z.infer<typeof formSchema>

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
    reset,
    setError,
  } = useForm<FormInput>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      amount: '',
      comment: '',
    },
  })

  const { files, isUploading, upload, remove, clear } = useFileUpload({
    context: { type: 'receipt' },
    maxFiles: 1,
    onUploadComplete: (result) => {
      if (result.success) {
        toast({
          title: tToasts('receiptUploaded'),
          description: tToasts('receiptUploadedDesc'),
        })
      }
    },
    onError: (error) => {
      toast({
        title: tToasts('uploadFailed'),
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

  const onSubmit = (data: FormInput) => {
    if (!uploadedFile?.url) {
      setError('root', { message: t('required') })
      return
    }

    startTransition(async () => {
      const result = await createBalanceRequest({
        amount: parseFloat(data.amount),
        receiptUrl: uploadedFile.url!,
        comment: data.comment?.trim() || undefined,
      })

      if (result.success) {
        toast({
          title: tToasts('receiptUploaded'),
          description: result.message,
        })
        // Reset form
        reset()
        clear()
      } else {
        toast({
          title: tToasts('uploadFailed'),
          description: result.message,
          variant: 'destructive',
        })
      }
    })
  }

  const isSubmitDisabled = isPending || isUploading || !uploadedFile?.url

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 max-w-xl">
      {errors.root && (
        <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
          {errors.root.message}
        </div>
      )}

      {/* Amount Input */}
      <div className="space-y-2">
        <Label htmlFor="amount">{t('amountUsd')}</Label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
          <Input
            id="amount"
            type="number"
            step="0.01"
            min="1"
            max="1000000"
            placeholder="0.00"
            {...register('amount')}
            className="pl-7"
            disabled={isPending}
            aria-invalid={!!errors.amount}
          />
        </div>
        {errors.amount ? (
          <p className="text-xs text-destructive">{errors.amount.message}</p>
        ) : (
          <p className="text-xs text-muted-foreground">{t('enterAmountDeposited')}</p>
        )}
      </div>

      {/* Receipt Upload */}
      <div className="space-y-2">
        <Label>{t('receiptImage')}</Label>

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
              <span className="text-sm font-medium">{tUpload('clickToUpload')}</span>
              <span className="text-xs text-muted-foreground">{tUpload('receiptFormats')}</span>
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
                    {uploadingFile.status === 'processing'
                      ? tUpload('statusProcessing')
                      : `${tUpload('statusUploading')} ${uploadingFile.progress}%`}
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
                    <Image src={uploadedFile.url} alt="Receipt" fill className="object-cover" />
                  )}
                </div>
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-600" />
                    <p className="text-sm font-medium">{tUpload('receiptUploaded')}</p>
                  </div>
                  <p className="text-xs text-muted-foreground truncate">{uploadedFile.file.name}</p>
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
        <Label htmlFor="comment">{t('commentOptional')}</Label>
        <Controller
          name="comment"
          control={control}
          render={({ field }) => (
            <Textarea
              id="comment"
              placeholder={t('addPaymentDetails')}
              {...field}
              rows={3}
              disabled={isPending}
              aria-invalid={!!errors.comment}
            />
          )}
        />
        {errors.comment && <p className="text-xs text-destructive">{errors.comment.message}</p>}
      </div>

      {/* Submit Button */}
      <Button type="submit" disabled={isSubmitDisabled} className="w-full sm:w-auto">
        {isPending ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            {t('submitting')}
          </>
        ) : (
          t('submitRequest')
        )}
      </Button>
    </form>
  )
}
