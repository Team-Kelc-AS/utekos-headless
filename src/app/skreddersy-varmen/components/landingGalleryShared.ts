import type { ReactNode } from 'react'

export type LandingPurchaseGalleryCarouselProps = {
  slides: ReactNode[]
  initialIndex: number
}

export const landingGalleryButtonClassName =
  'size-10 border-foreground/80 bg-night text-foreground shadow-lg shadow-black/40 hover:bg-dark-teal hover:text-foreground md:size-11'
