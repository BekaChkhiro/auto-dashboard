'use client'

import * as React from 'react'
import { useTranslations, useLocale } from 'next-intl'
import { useTransition } from 'react'
import { format } from 'date-fns'
import Link from 'next/link'
import {
  Archive,
  ArchiveRestore,
  Calendar,
  Car,
  ExternalLink,
  Key,
  MapPin,
  Package,
  Ship,
  User,
  Wrench,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Separator } from '@/components/ui/separator'
import { toast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'
import { PhotoGallery } from './photo-gallery'
import { StatusTimeline } from './status-timeline'
import { CommentsSection } from './comments-section'
import { VehicleStatusBadge } from './vehicle-status-badge'
import {
  changeVehicleStatus,
  archiveVehicle,
  restoreVehicle,
  type VehicleDetail as VehicleDetailType,
} from '@/lib/actions/vehicles'

interface VehicleDetailProps {
  vehicle: VehicleDetailType
  statuses: Array<{ id: string; nameEn: string; nameKa: string }>
}

export function VehicleDetail({ vehicle, statuses }: VehicleDetailProps) {
  const t = useTranslations('vehicles')
  const tCommon = useTranslations('common')
  const locale = useLocale() as 'en' | 'ka'
  const [isPending, startTransition] = useTransition()
  const [archiveDialogOpen, setArchiveDialogOpen] = React.useState(false)

  const handleStatusChange = (newStatusId: string) => {
    startTransition(async () => {
      const result = await changeVehicleStatus(vehicle.id, newStatusId)
      if (result.success) {
        toast({
          title: tCommon('success'),
          description: result.message,
          variant: 'success',
        })
      } else {
        toast({
          title: tCommon('error'),
          description: result.message,
          variant: 'destructive',
        })
      }
    })
  }

  const handleArchiveToggle = () => {
    startTransition(async () => {
      const result = vehicle.isArchived
        ? await restoreVehicle(vehicle.id)
        : await archiveVehicle(vehicle.id)

      if (result.success) {
        toast({
          title: tCommon('success'),
          description: result.message,
          variant: 'success',
        })
        setArchiveDialogOpen(false)
      } else {
        toast({
          title: tCommon('error'),
          description: result.message,
          variant: 'destructive',
        })
      }
    })
  }

  const getLocalizedName = (item: { nameEn: string; nameKa: string }) =>
    locale === 'ka' ? item.nameKa : item.nameEn

  return (
    <div className="space-y-6">
      {/* Archived banner */}
      {vehicle.isArchived && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3">
          <div className="flex items-center gap-2 text-destructive">
            <Archive className="h-5 w-5" />
            <span className="font-medium">{t('vehicleArchived')}</span>
            {vehicle.archivedAt && (
              <span className="text-sm">
                ({format(new Date(vehicle.archivedAt), 'PP')})
              </span>
            )}
          </div>
        </div>
      )}

      {/* Main content grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left column - Vehicle info */}
        <div className="space-y-6 lg:col-span-2">
          {/* Overview card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Car className="h-5 w-5" />
                {t('overview')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="grid gap-4 sm:grid-cols-2">
                <DetailItem label={t('vin')} value={vehicle.vin} mono />
                <DetailItem
                  label={t('makeModel')}
                  value={`${vehicle.make.name} ${vehicle.model.name}`}
                />
                <DetailItem label={t('year')} value={vehicle.year.toString()} />
                <DetailItem label={t('color')} value={vehicle.color || '-'} />
                <DetailItem
                  label={t('damageType')}
                  value={
                    <Badge variant="outline" className="font-normal">
                      <Wrench className="mr-1 h-3 w-3" />
                      {vehicle.damageType}
                    </Badge>
                  }
                />
                <DetailItem
                  label={t('hasKeys')}
                  value={
                    <Badge
                      variant={vehicle.hasKeys ? 'success' : 'secondary'}
                      className="font-normal"
                    >
                      <Key className="mr-1 h-3 w-3" />
                      {vehicle.hasKeys ? t('yes') : t('no')}
                    </Badge>
                  }
                />
              </dl>
            </CardContent>
          </Card>

          {/* Auction card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                {t('auctionInfo')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="grid gap-4 sm:grid-cols-2">
                <DetailItem label={t('auction')} value={vehicle.auction.name} />
                <DetailItem label={t('lotNumber')} value={vehicle.lotNumber} mono />
                {vehicle.auctionLink && (
                  <div className="sm:col-span-2">
                    <dt className="text-sm font-medium text-muted-foreground">
                      {t('auctionLink')}
                    </dt>
                    <dd className="mt-1">
                      <a
                        href={vehicle.auctionLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
                      >
                        {t('viewAuctionPage')}
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </dd>
                  </div>
                )}
              </dl>
            </CardContent>
          </Card>

          {/* Location card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                {t('location')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="grid gap-4 sm:grid-cols-2">
                <DetailItem
                  label={t('country')}
                  value={getLocalizedName(vehicle.country)}
                />
                <DetailItem
                  label={t('state')}
                  value={getLocalizedName(vehicle.state)}
                />
                <DetailItem
                  label={t('city')}
                  value={vehicle.city?.name || '-'}
                />
                <DetailItem
                  label={t('port')}
                  value={vehicle.port?.name || '-'}
                />
              </dl>
            </CardContent>
          </Card>

          {/* Shipping card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Ship className="h-5 w-5" />
                {t('shippingInfo')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="grid gap-4 sm:grid-cols-2">
                <DetailItem
                  label={t('shipName')}
                  value={vehicle.shipName || '-'}
                />
                <DetailItem
                  label={t('containerNumber')}
                  value={vehicle.containerNumber || '-'}
                  mono
                />
                <DetailItem
                  label={t('eta')}
                  value={
                    vehicle.eta ? (
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {format(new Date(vehicle.eta), 'PP')}
                      </span>
                    ) : (
                      '-'
                    )
                  }
                />
                <DetailItem
                  label={t('transportationPrice')}
                  value={`$${vehicle.transportationPrice.toLocaleString()}`}
                  highlight
                />
              </dl>
            </CardContent>
          </Card>

          {/* Photos */}
          <Card>
            <CardHeader>
              <CardTitle>{t('photos')}</CardTitle>
            </CardHeader>
            <CardContent>
              <PhotoGallery photos={vehicle.photos} />
            </CardContent>
          </Card>
        </div>

        {/* Right column - Status, Timeline, Comments */}
        <div className="space-y-6">
          {/* Dealer card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                {t('dealer')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="font-medium">{vehicle.dealer.name}</p>
                <p className="text-sm text-muted-foreground">
                  {vehicle.dealer.email}
                </p>
                <Link
                  href={`/admin/dealers/${vehicle.dealer.id}`}
                  className="text-sm text-primary hover:underline"
                >
                  {t('viewDealer')}
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* Status card */}
          <Card>
            <CardHeader>
              <CardTitle>{t('currentStatus')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <VehicleStatusBadge status={vehicle.status} locale={locale} />
              </div>
              <Separator />
              <div className="space-y-2">
                <label className="text-sm font-medium">{t('changeStatus')}</label>
                <Select
                  value={vehicle.status.id}
                  onValueChange={handleStatusChange}
                  disabled={isPending || vehicle.isArchived}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {statuses.map((status) => (
                      <SelectItem key={status.id} value={status.id}>
                        {getLocalizedName(status)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Status timeline card */}
          <Card>
            <CardHeader>
              <CardTitle>{t('statusHistory')}</CardTitle>
            </CardHeader>
            <CardContent>
              <StatusTimeline history={vehicle.statusHistory} />
            </CardContent>
          </Card>

          {/* Archive card */}
          <Card>
            <CardHeader>
              <CardTitle>{t('actions')}</CardTitle>
            </CardHeader>
            <CardContent>
              <Button
                variant={vehicle.isArchived ? 'default' : 'destructive'}
                className="w-full"
                onClick={() => setArchiveDialogOpen(true)}
                disabled={isPending}
              >
                {vehicle.isArchived ? (
                  <>
                    <ArchiveRestore className="mr-2 h-4 w-4" />
                    {t('restoreVehicle')}
                  </>
                ) : (
                  <>
                    <Archive className="mr-2 h-4 w-4" />
                    {t('archiveVehicle')}
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Comments card */}
          <Card>
            <CardHeader>
              <CardTitle>{t('comments')}</CardTitle>
            </CardHeader>
            <CardContent>
              <CommentsSection
                vehicleId={vehicle.id}
                comments={vehicle.comments}
              />
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Archive confirmation dialog */}
      <Dialog open={archiveDialogOpen} onOpenChange={setArchiveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {vehicle.isArchived ? t('restoreVehicle') : t('archiveVehicle')}
            </DialogTitle>
            <DialogDescription>
              {vehicle.isArchived
                ? t('restoreVehicleConfirmation')
                : t('archiveVehicleConfirmation')}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setArchiveDialogOpen(false)}
              disabled={isPending}
            >
              {tCommon('cancel')}
            </Button>
            <Button
              variant={vehicle.isArchived ? 'default' : 'destructive'}
              onClick={handleArchiveToggle}
              disabled={isPending}
            >
              {isPending
                ? tCommon('loading')
                : vehicle.isArchived
                  ? t('restore')
                  : t('archive')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function DetailItem({
  label,
  value,
  mono = false,
  highlight = false,
}: {
  label: string
  value: React.ReactNode
  mono?: boolean
  highlight?: boolean
}) {
  return (
    <div>
      <dt className="text-sm font-medium text-muted-foreground">{label}</dt>
      <dd
        className={cn(
          'mt-1',
          mono && 'font-mono',
          highlight && 'text-lg font-semibold text-primary'
        )}
      >
        {value}
      </dd>
    </div>
  )
}
