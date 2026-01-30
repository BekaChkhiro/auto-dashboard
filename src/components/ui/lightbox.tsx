'use client'

import * as React from 'react'
import * as DialogPrimitive from '@radix-ui/react-dialog'
import { ChevronLeft, ChevronRight, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

interface LightboxProps {
  images: { url: string; alt?: string }[]
  initialIndex?: number
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function Lightbox({ images, initialIndex = 0, open, onOpenChange }: LightboxProps) {
  const [currentIndex, setCurrentIndex] = React.useState(initialIndex)

  // Reset index when opening or when initial index changes
  React.useEffect(() => {
    if (open) {
      setCurrentIndex(initialIndex)
    }
  }, [open, initialIndex])

  const goToPrevious = React.useCallback(() => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1))
  }, [images.length])

  const goToNext = React.useCallback(() => {
    setCurrentIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0))
  }, [images.length])

  // Handle keyboard navigation
  React.useEffect(() => {
    if (!open) return

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowLeft':
          e.preventDefault()
          goToPrevious()
          break
        case 'ArrowRight':
          e.preventDefault()
          goToNext()
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [open, goToPrevious, goToNext])

  if (images.length === 0) return null

  const currentImage = images[currentIndex]

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay
          className={cn(
            'fixed inset-0 z-50 bg-black/90',
            'data-[state=open]:animate-in data-[state=closed]:animate-out',
            'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0'
          )}
        />
        <DialogPrimitive.Content
          className={cn(
            'fixed inset-0 z-50 flex items-center justify-center',
            'data-[state=open]:animate-in data-[state=closed]:animate-out',
            'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0'
          )}
        >
          {/* Close button */}
          <DialogPrimitive.Close asChild>
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-4 top-4 z-10 h-10 w-10 rounded-full bg-black/50 text-white hover:bg-black/70"
            >
              <X className="h-6 w-6" />
              <span className="sr-only">Close</span>
            </Button>
          </DialogPrimitive.Close>

          {/* Previous button */}
          {images.length > 1 && (
            <Button
              variant="ghost"
              size="icon"
              onClick={goToPrevious}
              className="absolute left-4 z-10 h-12 w-12 rounded-full bg-black/50 text-white hover:bg-black/70"
            >
              <ChevronLeft className="h-8 w-8" />
              <span className="sr-only">Previous</span>
            </Button>
          )}

          {/* Image */}
          <div className="relative flex h-full w-full items-center justify-center p-16">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={currentImage?.url}
              alt={currentImage?.alt || `Image ${currentIndex + 1}`}
              loading="eager"
              decoding="async"
              className="max-h-full max-w-full object-contain"
            />
          </div>

          {/* Next button */}
          {images.length > 1 && (
            <Button
              variant="ghost"
              size="icon"
              onClick={goToNext}
              className="absolute right-4 z-10 h-12 w-12 rounded-full bg-black/50 text-white hover:bg-black/70"
            >
              <ChevronRight className="h-8 w-8" />
              <span className="sr-only">Next</span>
            </Button>
          )}

          {/* Image counter */}
          {images.length > 1 && (
            <div className="absolute bottom-4 left-1/2 z-10 -translate-x-1/2 rounded-full bg-black/50 px-4 py-2 text-sm text-white">
              {currentIndex + 1} / {images.length}
            </div>
          )}

          {/* Hidden title for accessibility */}
          <DialogPrimitive.Title className="sr-only">Image viewer</DialogPrimitive.Title>
          <DialogPrimitive.Description className="sr-only">
            Use arrow keys to navigate between images. Press escape to close.
          </DialogPrimitive.Description>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  )
}
