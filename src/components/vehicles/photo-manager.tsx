'use client'

import * as React from 'react'
import { useTranslations } from 'next-intl'
import { useTransition } from 'react'
import { Trash2, ImageIcon } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { FileUploader } from '@/components/upload/file-uploader'
import { toast } from '@/hooks/use-toast'
import { deleteVehiclePhoto } from '@/lib/actions/vehicles'
import { cn } from '@/lib/utils'
import type { PhotoStage } from '@/generated/prisma'

interface Photo {
  id: string
  url: string
  stage: PhotoStage
  order: number
}

interface PhotoManagerProps {
  vehicleId: string
  photos: Photo[]
  className?: string
}

const STAGES: PhotoStage[] = ['AUCTION', 'PORT', 'ARRIVAL']

export function PhotoManager({
  vehicleId,
  photos,
  className,
}: PhotoManagerProps) {
  const t = useTranslations('photoStages')
  const tVehicles = useTranslations('vehicles')
  const tCommon = useTranslations('common')
  const [isPending, startTransition] = useTransition()
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false)
  const [photoToDelete, setPhotoToDelete] = React.useState<Photo | null>(null)
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

  const handleDeleteClick = (photo: Photo) => {
    setPhotoToDelete(photo)
    setDeleteDialogOpen(true)
  }

  const handleConfirmDelete = () => {
    if (!photoToDelete) return

    startTransition(async () => {
      const result = await deleteVehiclePhoto(photoToDelete.id)

      if (result.success) {
        toast({
          title: tCommon('success'),
          description: result.message,
          variant: 'success',
        })
        setDeleteDialogOpen(false)
        setPhotoToDelete(null)
      } else {
        toast({
          title: tCommon('error'),
          description: result.message,
          variant: 'destructive',
        })
      }
    })
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
      <Tabs
        value={activeStage}
        onValueChange={(value) => setActiveStage(value as PhotoStage)}
      >
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
          <TabsContent key={stage} value={stage} className="mt-4 space-y-4">
            {/* Existing photos */}
            {photosByStage[stage].length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium">{tVehicles('existingPhotos')}</h4>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                  {photosByStage[stage].map((photo) => (
                    <div
                      key={photo.id}
                      className="group relative aspect-square overflow-hidden rounded-lg border border-border bg-muted"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={photo.url}
                        alt={`${getStageLabel(stage)} photo`}
                        className="h-full w-full object-cover"
                      />
                      <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
                        <Button
                          type="button"
                          variant="destructive"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleDeleteClick(photo)}
                          disabled={isPending}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Empty state for existing photos */}
            {photosByStage[stage].length === 0 && (
              <div className="rounded-lg border border-dashed border-border py-6 text-center">
                <ImageIcon className="mx-auto mb-2 h-8 w-8 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  {tVehicles('noPhotosForStage', { stage: getStageLabel(stage) })}
                </p>
              </div>
            )}

            {/* Upload new photos */}
            <div className="space-y-2">
              <h4 className="text-sm font-medium">{tVehicles('uploadNewPhotos')}</h4>
              <FileUploader
                context={{ type: 'vehicle', vehicleId, stage }}
                maxFiles={20}
                onUploadComplete={() => {
                  toast({
                    title: tCommon('success'),
                    description: tVehicles('photoUploaded'),
                    variant: 'success',
                  })
                }}
                onError={(error) => {
                  toast({
                    title: tCommon('error'),
                    description: error,
                    variant: 'destructive',
                  })
                }}
              />
            </div>
          </TabsContent>
        ))}
      </Tabs>

      {/* Delete confirmation dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{tVehicles('deletePhoto')}</DialogTitle>
            <DialogDescription>
              {tVehicles('deletePhotoConfirmation')}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
              disabled={isPending}
            >
              {tCommon('cancel')}
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmDelete}
              disabled={isPending}
            >
              {isPending ? tCommon('loading') : tCommon('delete')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
