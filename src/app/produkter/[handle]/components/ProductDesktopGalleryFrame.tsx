import type { ReactNode } from 'react'
import { AspectRatio } from '@/components/ui/aspect-ratio'

type ProductDesktopGalleryFrameProps = {
  children: ReactNode
  overlay?: ReactNode
  ariaLabel?: string
}

export function ProductDesktopGalleryFrame({
  children,
  overlay,
  ariaLabel = 'Produktgalleri'
}: ProductDesktopGalleryFrameProps) {
  return (
    <div
      role='region'
      aria-label={ariaLabel}
      className='relative mx-auto w-full max-w-[min(100%,calc((100dvh-8rem-1rem)*0.9))] rounded-2xl bg-jungle p-2 shadow-2xl shadow-havdyp/18'
    >
      <AspectRatio
        ratio={9 / 10}
        className='overflow-clip rounded-lg bg-jungle'
      >
        {children}
      </AspectRatio>
      {overlay}
    </div>
  )
}
