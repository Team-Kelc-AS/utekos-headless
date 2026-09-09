'use client'

import {
  useEffect,
  useRef,
  useState,
  type ComponentType,
  type ReactNode
} from 'react'
import { ChevronLeftIcon, ChevronRightIcon } from 'lucide-react'
import { cn } from '@/lib/utils/className'
import { focusRing } from '../utils/constants'
import {
  landingGalleryButtonClassName,
  type LandingPurchaseGalleryCarouselProps
} from './landingGalleryShared'

export function LandingPurchaseGallery({
  slides
}: {
  slides: ReactNode[]
}) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [shouldLoad, setShouldLoad] = useState(false)
  const [activeIndex, setActiveIndex] = useState(0)
  const [fallbackFocused, setFallbackFocused] = useState(false)
  const [InteractiveGallery, setInteractiveGallery] =
    useState<ComponentType<LandingPurchaseGalleryCarouselProps> | null>(
      null
    )

  useEffect(() => {
    const container = containerRef.current
    if (!container || !('IntersectionObserver' in window)) return

    const observer = new IntersectionObserver(
      entries => {
        if (entries.some(entry => entry.isIntersecting)) {
          setShouldLoad(true)
          observer.disconnect()
        }
      },
      { rootMargin: '600px' }
    )
    observer.observe(container)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    if (!shouldLoad) return
    let active = true

    void import('./LandingPurchaseGalleryCarousel')
      .then(module => {
        if (active)
          setInteractiveGallery(
            () => module.LandingPurchaseGalleryCarousel
          )
      })
      .catch(error => {
        // The initial gallery remains usable if the optional enhancement fails.
        console.error(
          'Landing purchase carousel failed to load',
          error
        )
      })

    return () => {
      active = false
    }
  }, [shouldLoad])

  const move = (direction: number) => {
    setActiveIndex(
      index =>
        (index + direction + slides.length) % slides.length
    )
    setShouldLoad(true)
  }

  return (
    <div
      ref={containerRef}
      className='relative w-full min-[900px]:max-w-xl'
      data-landing-gallery={
        InteractiveGallery && !fallbackFocused ? 'enhanced' : (
          'initial'
        )
      }
      onPointerEnter={() => setShouldLoad(true)}
      onFocusCapture={() => {
        setShouldLoad(true)
        // Keep keyboard focus and the selected image while the module loads.
        if (!InteractiveGallery) setFallbackFocused(true)
      }}
      onBlurCapture={event => {
        if (!event.currentTarget.contains(event.relatedTarget))
          setFallbackFocused(false)
      }}
    >
      {InteractiveGallery && !fallbackFocused ?
        <InteractiveGallery
          slides={slides}
          initialIndex={activeIndex}
        />
      : <div
          role='region'
          aria-label='Produktbilder'
          aria-roledescription='carousel'
          onKeyDown={event => {
            if (
              event.key === 'ArrowLeft' ||
              event.key === 'ArrowRight'
            ) {
              event.preventDefault()
              move(event.key === 'ArrowLeft' ? -1 : 1)
            }
          }}
        >
          {slides[activeIndex]}
          <span className='sr-only' aria-live='polite'>
            Bilde {activeIndex + 1} av {slides.length}
          </span>
          {slides.length > 1 && (
            <>
              <button
                type='button'
                aria-label='Forrige bilde'
                onClick={() => move(-1)}
                className={cn(
                  'absolute top-1/2 left-2 flex -translate-y-1/2 cursor-pointer items-center justify-center rounded-full border md:left-4',
                  landingGalleryButtonClassName,
                  focusRing
                )}
              >
                <ChevronLeftIcon className='size-4' />
              </button>
              <button
                type='button'
                aria-label='Neste bilde'
                onClick={() => move(1)}
                className={cn(
                  'absolute top-1/2 right-2 flex -translate-y-1/2 cursor-pointer items-center justify-center rounded-full border md:right-4',
                  landingGalleryButtonClassName,
                  focusRing
                )}
              >
                <ChevronRightIcon className='size-4' />
              </button>
            </>
          )}
        </div>
      }
    </div>
  )
}
