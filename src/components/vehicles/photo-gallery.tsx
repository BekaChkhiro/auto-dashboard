'use client'

import * as React from 'react'
import { useTranslations } from 'next-intl'
import { ImageIcon } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Lightbox } from '@/components/ui/lightbox'
import { cn } from '@/lib/utils'
import type { PhotoStage } from '@/generated/prisma'

interface Photo {
  id: string
  url: string
  stage: PhotoStage
  order: number
}

interface PhotoGalleryProps {
  photos: Photo[]
  className?: string
}

const STAGES: PhotoStage[] = ['AUCTION', 'PORT', 'ARRIVAL']

export function PhotoGallery({ photos, className }: PhotoGalleryProps) {
  const t = useTranslations('photoStages')
  const [lightboxOpen, setLightboxOpen] = React.useState(false)
  const [lightboxIndex, setLightboxIndex] = React.useState(0)
  const [activeStage, setActiveStage] = React.useState<PhotoStage>('AUCTION')

  // Group photos by stage
  const photosByStage = React.useMemo(() => {
    const grouped: Record<PhotoStage, Photo[]> = {
      AUCTION: [],
      PORT: [],
      ARRIVAL: [],
    }
    photos.forEach((photo) => {
      grouped[photo.stage].push(photo)
    })
    return grouped
  }, [photos])

  // Get all photos for the active stage (for lightbox)
  const activePhotos = photosByStage[activeStage]

  const handlePhotoClick = (photo: Photo, indexInStage: number) => {
    setLightboxIndex(indexInStage)
    setLightboxOpen(true)
  }

  const getStageLabel = (stage: PhotoStage) => {
    switch (stage) {
      case 'AUCTION':
        return t('auction')
      case 'PORT':
        return t('port')
      case 'ARRIVAL':
        return t('arrival')
      default:
        return stage
    }
  }

  return (
    <div className={cn('space-y-4', className)}>
      <Tabs value={activeStage} onValueChange={(value) => setActiveStage(value as PhotoStage)}>
        <TabsList className="grid w-full grid-cols-3">
          {STAGES.map((stage) => (
            <TabsTrigger key={stage} value={stage} className="relative">
              {getStageLabel(stage)}
              {photosByStage[stage].length > 0 && (
                <span className="ml-2 rounded-full bg-primary/10 px-2 py-0.5 text-xs">
                  {photosByStage[stage].length}
                </span>
              )}
            </TabsTrigger>
          ))}
        </TabsList>

        {STAGES.map((stage) => (
          <TabsContent key={stage} value={stage} className="mt-4">
            {photosByStage[stage].length === 0 ? (
              <EmptyState stage={stage} getStageLabel={getStageLabel} />
            ) : (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                {photosByStage[stage].map((photo, index) => (
                  <button
                    key={photo.id}
                    type="button"
                    onClick={() => handlePhotoClick(photo, index)}
                    className="group relative aspect-square overflow-hidden rounded-lg border border-border bg-muted transition-all hover:border-primary focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={photo.url}
                      alt={`${getStageLabel(stage)} photo ${index + 1}`}
                      loading="lazy"
                      decoding="async"
                      className="h-full w-full object-cover transition-transform group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-black/0 transition-colors group-hover:bg-black/10" />
                  </button>
                ))}
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>

      <Lightbox
        images={activePhotos.map((p) => ({
          url: p.url,
          alt: `${getStageLabel(activeStage)} photo`,
        }))}
        initialIndex={lightboxIndex}
        open={lightboxOpen}
        onOpenChange={setLightboxOpen}
      />
    </div>
  )
}

function EmptyState({
  stage,
  getStageLabel,
}: {
  stage: PhotoStage
  getStageLabel: (stage: PhotoStage) => string
}) {
  const t = useTranslations('vehicles')

  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-12 text-center">
      <ImageIcon className="mb-3 h-10 w-10 text-muted-foreground" />
      <p className="text-sm text-muted-foreground">
        {t('noPhotosForStage', { stage: getStageLabel(stage) })}
      </p>
    </div>
  )
}
