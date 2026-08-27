import Image from 'next/image'
import type { ProductGalleryProps } from '@types'

export function ProductGalleryStack({
  title,
  images
}: ProductGalleryProps) {
  if (images.length === 0) {
    return null
  }

  return (
    <div
      className='flex w-full flex-col gap-4 md:gap-6'
      role='group'
      aria-label={`Produktbilder for ${title}`}
    >
      {images.map((image, index) => {
        const isLeadImage = index === 0

        return (
          <figure
            key={image.id}
            className='overflow-hidden rounded-3xl bg-jungle'
          >
            <Image
              src={image.url}
              alt={image.altText || `Bilde av ${title}`}
              width={image.width}
              height={image.height}
              sizes='(min-width: 1280px) 58vw, (min-width: 768px) 64vw, 100vw'
              quality={90}
              className='pointer-events-none h-auto w-full select-none'
              draggable={false}
              fetchPriority={isLeadImage ? 'high' : 'auto'}
            />
          </figure>
        )
      })}
    </div>
  )
}
