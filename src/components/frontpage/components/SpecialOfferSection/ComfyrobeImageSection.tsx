// Path: src/components/ComfyrobeSection/ComfyrobeImageSection.tsx

'use client'

import { useInView } from '@/hooks/useInView'
import { cn } from '@/lib/utils/className'
import type { ShopifyMediaImage } from 'types/media'
import { ComfyrobeProductImage } from './ComfyrobeProductImage'

type ComfyrobeImageSectionProps = { image: ShopifyMediaImage }

export function ComfyrobeImageSection({
  image
}: ComfyrobeImageSectionProps) {
  const [ref, isInView] = useInView({ threshold: 0.5 })
  return (
    <div
      ref={ref}
      className={cn(
        'will-animate-fade-in-scale relative flex min-w-0 items-center justify-center bg-deep-fjord px-6 pt-20 pb-6 sm:px-10 sm:pt-24 sm:pb-8 lg:px-12 lg:pt-28 lg:pb-16 xl:px-16',
        isInView && 'is-in-view'
      )}
    >
      <div className='w-full max-w-md sm:max-w-lg lg:max-w-none'>
        <ComfyrobeProductImage image={image} />
      </div>
    </div>
  )
}
