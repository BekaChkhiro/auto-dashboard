'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from '@/hooks/use-toast'
import { createDealer, updateDealer } from '@/lib/actions/dealers'
import type { DealerDetail } from '@/lib/actions/dealers'

// Form data type
interface FormData {
  email: string
  password: string
  name: string
  phone: string
  address: string
  companyName?: string
  identificationNumber?: string
  discount: number
  balance: number
  status: 'ACTIVE' | 'BLOCKED'
}

// Form schema that works for both create and edit
const formSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string(),
  name: z.string().min(2, 'Name must be at least 2 characters'),
  phone: z.string().min(5, 'Phone number is required'),
  address: z.string().min(5, 'Address is required'),
  companyName: z.string().optional(),
  identificationNumber: z.string().optional(),
  discount: z.number().min(0).max(100),
  balance: z.number(),
  status: z.enum(['ACTIVE', 'BLOCKED']),
}) satisfies z.ZodType<FormData>

interface DealerFormProps {
  mode: 'create' | 'edit'
  dealer?: DealerDetail
}

export function DealerForm({ mode, dealer }: DealerFormProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const isEdit = mode === 'edit'

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues:
      isEdit && dealer
        ? {
            email: dealer.email,
            name: dealer.name,
            phone: dealer.phone,
            address: dealer.address,
            companyName: dealer.companyName || '',
            identificationNumber: dealer.identificationNumber || '',
            discount: dealer.discount,
            balance: dealer.balance,
            status: dealer.status,
            password: '',
          }
        : {
            email: '',
            name: '',
            phone: '',
            address: '',
            companyName: '',
            identificationNumber: '',
            discount: 0,
            balance: 0,
            status: 'ACTIVE',
            password: '',
          },
  })

  const status = watch('status')

  const onSubmit = (data: FormData) => {
    // Validate password for create mode
    if (!isEdit && data.password.length < 8) {
      toast({
        title: 'Error',
        description: 'Password must be at least 8 characters',
        variant: 'destructive',
      })
      return
    }

    startTransition(async () => {
      const result =
        isEdit && dealer
          ? await updateDealer(dealer.id, data)
          : await createDealer(data)

      if (result.success) {
        toast({
          title: 'Success',
          description: result.message,
          variant: 'success',
        })
        router.push('/admin/dealers')
      } else {
        toast({
          title: 'Error',
          description: result.message,
          variant: 'destructive',
        })
      }
    })
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2">
        {/* Name */}
        <div className="space-y-2">
          <Label htmlFor="name">Name *</Label>
          <Input
            id="name"
            {...register('name')}
            placeholder="Enter dealer name"
          />
          {errors.name && (
            <p className="text-sm text-destructive">{errors.name.message}</p>
          )}
        </div>

        {/* Email */}
        <div className="space-y-2">
          <Label htmlFor="email">Email *</Label>
          <Input
            id="email"
            type="email"
            {...register('email')}
            placeholder="Enter email address"
          />
          {errors.email && (
            <p className="text-sm text-destructive">{errors.email.message}</p>
          )}
        </div>

        {/* Password */}
        <div className="space-y-2">
          <Label htmlFor="password">
            Password {isEdit ? '(leave empty to keep current)' : '*'}
          </Label>
          <Input
            id="password"
            type="password"
            {...register('password')}
            placeholder={isEdit ? 'Enter new password' : 'Enter password'}
          />
          {errors.password && (
            <p className="text-sm text-destructive">{errors.password.message}</p>
          )}
        </div>

        {/* Phone */}
        <div className="space-y-2">
          <Label htmlFor="phone">Phone *</Label>
          <Input
            id="phone"
            {...register('phone')}
            placeholder="Enter phone number"
          />
          {errors.phone && (
            <p className="text-sm text-destructive">{errors.phone.message}</p>
          )}
        </div>

        {/* Address */}
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="address">Address *</Label>
          <Input
            id="address"
            {...register('address')}
            placeholder="Enter address"
          />
          {errors.address && (
            <p className="text-sm text-destructive">{errors.address.message}</p>
          )}
        </div>

        {/* Company Name */}
        <div className="space-y-2">
          <Label htmlFor="companyName">Company Name</Label>
          <Input
            id="companyName"
            {...register('companyName')}
            placeholder="Enter company name (optional)"
          />
          {errors.companyName && (
            <p className="text-sm text-destructive">
              {errors.companyName.message}
            </p>
          )}
        </div>

        {/* Identification Number */}
        <div className="space-y-2">
          <Label htmlFor="identificationNumber">Identification Number</Label>
          <Input
            id="identificationNumber"
            {...register('identificationNumber')}
            placeholder="Enter identification number (optional)"
          />
          {errors.identificationNumber && (
            <p className="text-sm text-destructive">
              {errors.identificationNumber.message}
            </p>
          )}
        </div>

        {/* Balance */}
        <div className="space-y-2">
          <Label htmlFor="balance">Balance</Label>
          <Input
            id="balance"
            type="number"
            step="0.01"
            {...register('balance', { valueAsNumber: true })}
            placeholder="0.00"
          />
          {errors.balance && (
            <p className="text-sm text-destructive">{errors.balance.message}</p>
          )}
        </div>

        {/* Discount */}
        <div className="space-y-2">
          <Label htmlFor="discount">Discount (%)</Label>
          <Input
            id="discount"
            type="number"
            step="0.01"
            min="0"
            max="100"
            {...register('discount', { valueAsNumber: true })}
            placeholder="0"
          />
          {errors.discount && (
            <p className="text-sm text-destructive">
              {errors.discount.message}
            </p>
          )}
          <p className="text-xs text-muted-foreground">
            Hidden discount percentage (0-100). Not visible to the dealer.
          </p>
        </div>

        {/* Status */}
        <div className="space-y-2">
          <Label htmlFor="status">Status</Label>
          <Select
            value={status}
            onValueChange={(value) =>
              setValue('status', value as 'ACTIVE' | 'BLOCKED')
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Select status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ACTIVE">Active</SelectItem>
              <SelectItem value="BLOCKED">Blocked</SelectItem>
            </SelectContent>
          </Select>
          {errors.status && (
            <p className="text-sm text-destructive">{errors.status.message}</p>
          )}
        </div>
      </div>

      <div className="flex gap-4">
        <Button type="submit" disabled={isPending}>
          {isPending
            ? isEdit
              ? 'Updating...'
              : 'Creating...'
            : isEdit
              ? 'Update Dealer'
              : 'Create Dealer'}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push('/admin/dealers')}
          disabled={isPending}
        >
          Cancel
        </Button>
      </div>
    </form>
  )
}
