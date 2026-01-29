'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { updateDealerProfile } from '@/lib/actions/dealer-profile'
import { Loader2 } from 'lucide-react'

interface EditProfileFormProps {
  initialPhone: string
  initialAddress: string
}

export function EditProfileForm({ initialPhone, initialAddress }: EditProfileFormProps) {
  const [phone, setPhone] = useState(initialPhone)
  const [address, setAddress] = useState(initialAddress)
  const [isPending, startTransition] = useTransition()
  const { toast } = useToast()

  const hasChanges = phone !== initialPhone || address !== initialAddress
  const isValid = phone.length >= 5 && address.length >= 5

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!hasChanges) {
      toast({
        title: 'No changes',
        description: 'No changes were made to your profile.',
      })
      return
    }

    startTransition(async () => {
      const result = await updateDealerProfile({ phone, address })

      if (result.success) {
        toast({
          title: 'Profile updated',
          description: result.message,
        })
      } else {
        toast({
          title: 'Update failed',
          description: result.message,
          variant: 'destructive',
        })
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="phone">Phone Number</Label>
        <Input
          id="phone"
          type="tel"
          placeholder="Enter your phone number"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          disabled={isPending}
        />
        {phone.length > 0 && phone.length < 5 && (
          <p className="text-xs text-red-600">Phone number must be at least 5 characters</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="address">Address</Label>
        <Input
          id="address"
          type="text"
          placeholder="Enter your address"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          disabled={isPending}
        />
        {address.length > 0 && address.length < 5 && (
          <p className="text-xs text-red-600">Address must be at least 5 characters</p>
        )}
      </div>

      <Button type="submit" disabled={isPending || !hasChanges || !isValid}>
        {isPending ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Saving...
          </>
        ) : (
          'Save Changes'
        )}
      </Button>
    </form>
  )
}
