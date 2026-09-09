import type { ReactNode } from 'react'

export type LandingPurchaseGalleryCarouselProps = {
  slides: ReactNode[]
  initialIndex: number
}

export const landingGalleryButtonClassName =
  'size-10 border-background/15 bg-foreground/90 text-background shadow-md backdrop-blur-md hover:bg-foreground hover:text-primary md:size-11'
