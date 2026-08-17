import Image from 'next/image'
import { cn } from '@/lib/utils/className'
import type { Image as ProductImage } from 'types/media'
import type { ProductGalleryImageLayout } from '@types'

type ProductGallerySlideImageProps = {
  image: ProductImage
  title: string
  index: number
  imageLayout: ProductGalleryImageLayout
  imageClassName?: string
}

export function ProductGallerySlideImage({
  image,
  title,
  index,
  imageLayout,
  imageClassName
}: ProductGallerySlideImageProps) {
  const alt =
    image.altText || `Bilde av ${title}`
  const fetchPriority =
    index === 0 ? 'high' : 'auto'
  const className = cn(
    'pointer-events-none select-none',
    imageLayout === 'cover-fill' &&
      'object-cover object-top',
    imageLayout === 'intrinsic' &&
      'object-contain object-center',
    imageClassName
  )

  switch (imageLayout) {
    case 'cover-fill':
      return (
        <Image
          src={image.url}
          alt={alt}
          fill
          sizes='(min-width: 1280px) 58vw, (min-width: 1024px) 54vw, 100vw'
          quality={95}
          className={className}
          draggable={false}
          fetchPriority={fetchPriority}
        />
      )
    case 'intrinsic':
      return (
        <Image
          src={image.url}
          alt={alt}
          width={image.width}
          height={image.height}
          sizes='100vw'
          quality={95}
          className={className}
          style={{
            width: '100%',
            height: 'auto'
          }}
          draggable={false}
          fetchPriority={fetchPriority}
        />
      )
    default: {
      const _exhaustive: never = imageLayout
      return _exhaustive
    }
  }
}
