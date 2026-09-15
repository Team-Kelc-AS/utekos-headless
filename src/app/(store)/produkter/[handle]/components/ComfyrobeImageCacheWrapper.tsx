import { cacheLife, cacheTag } from 'next/cache'
import Image from 'next/image'
import { COMFYROBE_PRODUCT_GALLERY_IMAGES } from '../utils/gallery-images/comfyrobeProductGalleryImages'

export async function ComfyrobeImageCacheWrapper() {
  'use cache'

  cacheTag('comfyrobe-product-images', 'products')
  cacheLife('max')

  const images = COMFYROBE_PRODUCT_GALLERY_IMAGES

  return (
    <div>
      {images.map(image => (
        <Image
          key={image.id}
          src={image.url}
          alt={image.altText}
          width={image.width}
          height={image.height}
          sizes='(max-width: 1080px) 100vw, (max-width: 768px) 50vw, 33vw'
          quality={100}
          className='object-cover aspect-square size-full md:aspect-4/5'
          draggable={false}
          fetchPriority='high'
          loading='eager'
        />
      ))}
    </div>
  )
}
