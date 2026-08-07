'use client'

import Image from 'next/image'
import { AspectRatio } from '@/components/ui/aspect-ratio'
import type { ProductGalleryProps } from '@types'

const DESKTOP_GRID_IMAGE_COUNT = 6

export function ProductGalleryGrid({
  title,
  images
}: ProductGalleryProps) {
  const gridImages = images.slice(
    0,
    DESKTOP_GRID_IMAGE_COUNT
  )

  if (
    gridImages.length <
    DESKTOP_GRID_IMAGE_COUNT
  ) {
    return null
  }

  return (
    <div className='size-full'>
      <div
        className='grid size-full grid-cols-2 grid-rows-3 gap-3 p-4 md:gap-4 md:p-8'
        role='group'
        aria-label={`Produktbilder for ${title}`}
      >
        {gridImages.map(
          (image, index) => {
            const isAboveFoldGridImage =
              index < 2

            return (
              <div
                key={image.id}
                className='flex min-h-0 overflow-hidden rounded-lg bg-jungle p-3'
              >
                <AspectRatio
                  ratio={4 / 5}
                  className='w-full'
                >
                  <Image
                    src={image.url}
                    alt={
                      image.altText ||
                      `Bilde av ${title}`
                    }
                    fill
                    sizes='(min-width: 1024px) 27vw, 30vw'
                    quality={90}
                    className='pointer-events-none rounded-lg object-cover object-top select-none'
                    draggable={false}
                    fetchPriority={
                      isAboveFoldGridImage ?
                        'high'
                      : 'auto'
                    }
                  />
                </AspectRatio>
              </div>
            )
          }
        )}
      </div>
    </div>
  )
}