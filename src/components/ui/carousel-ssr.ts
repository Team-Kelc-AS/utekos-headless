import type { SsrOptionsType } from 'embla-carousel-ssr'

function fillSlideSizes(count: number, size: number): number[] {
  return Array.from({ length: count }, () => size)
}

/** Reusable SSR slide-size presets — percentages must match Tailwind `basis-*` on slides. */
export const CAROUSEL_SSR = {
  fullWidth: (slideCount: number): SsrOptionsType => ({
    slideSizes: fillSlideSizes(slideCount, 100)
  }),

  /** `basis-full` → `md:basis-1/2` → `lg:basis-1/3` */
  responsiveThirds: (slideCount: number): SsrOptionsType => ({
    slideSizes: fillSlideSizes(slideCount, 100),
    breakpoints: {
      '(min-width: 768px)': {
        slideSizes: fillSlideSizes(slideCount, 50)
      },
      '(min-width: 1024px)': {
        slideSizes: fillSlideSizes(slideCount, 100 / 3)
      }
    }
  }),

  /** Product rows: `basis-[86%]` → `sm:1/2` → `md:40%` → `xl:1/3` */
  productGrid: (slideCount: number): SsrOptionsType => ({
    slideSizes: fillSlideSizes(slideCount, 86),
    breakpoints: {
      '(min-width: 640px)': {
        slideSizes: fillSlideSizes(slideCount, 50)
      },
      '(min-width: 768px)': {
        slideSizes: fillSlideSizes(slideCount, 40)
      },
      '(min-width: 1280px)': {
        slideSizes: fillSlideSizes(slideCount, 100 / 3)
      }
    }
  }),

  /** `basis-full` → `sm:basis-1/2` → `lg:basis-1/3` */
  responsiveHalvesAndThirds: (
    slideCount: number
  ): SsrOptionsType => ({
    slideSizes: fillSlideSizes(slideCount, 100),
    breakpoints: {
      '(min-width: 640px)': {
        slideSizes: fillSlideSizes(slideCount, 50)
      },
      '(min-width: 1024px)': {
        slideSizes: fillSlideSizes(slideCount, 100 / 3)
      }
    }
  }),

  /** Product carousel: `72%` → `sm:1/2` → `md:38%` → `xl:1/3` */
  mobilePeekHalvesAndThirds: (
    slideCount: number
  ): SsrOptionsType => ({
    slideSizes: fillSlideSizes(slideCount, 72),
    breakpoints: {
      '(min-width: 640px)': {
        slideSizes: fillSlideSizes(slideCount, 50)
      },
      '(min-width: 768px)': {
        slideSizes: fillSlideSizes(slideCount, 38)
      },
      '(min-width: 1280px)': {
        slideSizes: fillSlideSizes(slideCount, 100 / 3)
      }
    }
  })
} as const

export function shouldUseCarouselSsr(opts?: {
  loop?: boolean
  containScroll?: false | 'trimSnaps' | 'keepSnaps'
  startSnap?: number
}): boolean {
  if (!opts) return false
  if (opts.loop) return true
  if (opts.containScroll === false) return true
  if (opts.startSnap != null && opts.startSnap !== 0) return true
  return false
}

export function resolveCarouselSsrOptions(
  opts: Parameters<typeof shouldUseCarouselSsr>[0],
  slideCount?: number,
  ssr?: SsrOptionsType
): SsrOptionsType | null {
  if (!shouldUseCarouselSsr(opts)) return null
  if (ssr) return ssr
  if (slideCount != null && slideCount > 0) {
    return CAROUSEL_SSR.fullWidth(slideCount)
  }
  return null
}
