import { Suspense } from 'react'
import { PageHeader } from '@/components/layout/page-header'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { requireDealer } from '@/lib/auth'
import { getDealerProfile } from '@/lib/actions/dealer-profile'
import { EditProfileForm, ChangePasswordForm } from '@/components/dealer/profile'
import { User, Mail, Building2, IdCard, Calendar, Phone, MapPin } from 'lucide-react'

function ProfileSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-5 w-40" />
          </div>
        ))}
      </div>
    </div>
  )
}

function FormSkeleton() {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-10 w-full max-w-md" />
      </div>
      <div className="space-y-2">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-10 w-full max-w-md" />
      </div>
      <Skeleton className="h-10 w-32" />
    </div>
  )
}

async function ProfileInfo() {
  const profile = await getDealerProfile()

  if (!profile) {
    return <p className="text-muted-foreground">Unable to load profile information.</p>
  }

  const infoItems = [
    { icon: User, label: 'Name', value: profile.name },
    { icon: Mail, label: 'Email', value: profile.email },
    { icon: Phone, label: 'Phone', value: profile.phone },
    { icon: MapPin, label: 'Address', value: profile.address },
    { icon: Building2, label: 'Company', value: profile.companyName || 'Not specified' },
    { icon: IdCard, label: 'ID Number', value: profile.identificationNumber || 'Not specified' },
    {
      icon: Calendar,
      label: 'Member Since',
      value: new Date(profile.createdAt).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }),
    },
  ]

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {infoItems.map((item) => (
        <div key={item.label} className="flex items-start gap-3">
          <item.icon className="h-5 w-5 text-muted-foreground mt-0.5" />
          <div>
            <p className="text-sm text-muted-foreground">{item.label}</p>
            <p className="font-medium">{item.value}</p>
          </div>
        </div>
      ))}
    </div>
  )
}

async function EditProfileSection() {
  const profile = await getDealerProfile()

  if (!profile) {
    return <p className="text-muted-foreground">Unable to load profile information.</p>
  }

  return <EditProfileForm initialPhone={profile.phone} initialAddress={profile.address} />
}

export default async function DealerProfilePage() {
  await requireDealer()

  return (
    <>
      <PageHeader title="Profile" description="View and manage your profile information" />

      <div className="grid gap-6">
        {/* Profile Information */}
        <Card>
          <CardHeader>
            <CardTitle>Profile Information</CardTitle>
            <CardDescription>
              Your account details. Some information can only be changed by an administrator.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Suspense fallback={<ProfileSkeleton />}>
              <ProfileInfo />
            </Suspense>
          </CardContent>
        </Card>

        {/* Edit Profile */}
        <Card>
          <CardHeader>
            <CardTitle>Edit Profile</CardTitle>
            <CardDescription>Update your phone number and address.</CardDescription>
          </CardHeader>
          <CardContent>
            <Suspense fallback={<FormSkeleton />}>
              <EditProfileSection />
            </Suspense>
          </CardContent>
        </Card>

        {/* Change Password */}
        <Card>
          <CardHeader>
            <CardTitle>Change Password</CardTitle>
            <CardDescription>
              Update your password to keep your account secure. You will need to enter your current
              password to make changes.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ChangePasswordForm />
          </CardContent>
        </Card>
      </div>
    </>
  )
}
