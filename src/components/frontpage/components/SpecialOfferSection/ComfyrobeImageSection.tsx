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
        'will-animate-fade-in-scale relative flex min-h-80 min-w-0 items-center justify-center overflow-hidden border-b border-foreground/12 sm:min-h-120 lg:min-h-150 lg:border-r lg:border-b-0',
        isInView && 'is-in-view'
      )}
    >
      <ComfyrobeProductImage image={image} />
      <div
        aria-hidden='true'
        className='pointer-events-none absolute inset-0 bg-linear-to-t from-jungle/50 via-transparent to-transparent'
      />
      <div
        aria-hidden='true'
        className='pointer-events-none absolute inset-4 rounded-[1.25rem] border border-foreground/18 sm:inset-6'
      />
    </div>
  )
}
