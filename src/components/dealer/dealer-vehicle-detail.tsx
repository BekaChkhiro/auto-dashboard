'use client'

import * as React from 'react'
import { useTranslations, useLocale } from 'next-intl'
import { format } from 'date-fns'
import {
  Archive,
  Calendar,
  Car,
  ExternalLink,
  Key,
  MapPin,
  Package,
  Ship,
  Wrench,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { PhotoGallery } from '@/components/vehicles/photo-gallery'
import { StatusTimeline } from '@/components/vehicles/status-timeline'
import { VehicleStatusBadge } from '@/components/vehicles/vehicle-status-badge'
import type { DealerVehicleDetail as DealerVehicleDetailType } from '@/lib/actions/dealer-dashboard'

interface DealerVehicleDetailProps {
  vehicle: DealerVehicleDetailType
}

export function DealerVehicleDetail({ vehicle }: DealerVehicleDetailProps) {
  const t = useTranslations('vehicles')
  const locale = useLocale() as 'en' | 'ka'

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
                  label="Transportation Cost"
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

        {/* Right column - Status & Timeline */}
        <div className="space-y-6">
          {/* Status card */}
          <Card>
            <CardHeader>
              <CardTitle>{t('currentStatus')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3">
                <VehicleStatusBadge status={vehicle.status} locale={locale} />
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
        </div>
      </div>
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
