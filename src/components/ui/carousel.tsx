'use client'

import * as React from 'react'
import useEmblaCarousel, {
  type UseEmblaCarouselType
} from 'embla-carousel-react'
import Accessibility from 'embla-carousel-accessibility'
import ClassNames from 'embla-carousel-class-names'
import Ssr, { type SsrOptionsType } from 'embla-carousel-ssr'

import { cn } from '@/lib/utils/className'
import { Button } from '@/components/ui/button'
import { resolveCarouselSsrOptions } from '@/components/ui/carousel-ssr'
import { CaretLeftIcon, CaretRightIcon } from '@/components/utekos-icons'

type CarouselApi = UseEmblaCarouselType[1]
type ResolvedCarouselApi = NonNullable<CarouselApi> & {
  goToPrev?: () => void
  goToNext?: () => void
  canGoToPrev?: () => boolean
  canGoToNext?: () => boolean
  scrollPrev?: () => void
  scrollNext?: () => void
  canScrollPrev?: () => boolean
  canScrollNext?: () => boolean
}
type UseCarouselParameters = Parameters<typeof useEmblaCarousel>
type CarouselOptions = UseCarouselParameters[0]
type CarouselPlugin = UseCarouselParameters[1]

type CarouselProps = {
  opts?: CarouselOptions
  plugins?: CarouselPlugin
  orientation?: 'horizontal' | 'vertical'
  setApi?: (api: CarouselApi) => void
  slideCount?: number
  ssr?: SsrOptionsType
}

type CarouselContextProps = {
  carouselRef: ReturnType<typeof useEmblaCarousel>[0]
  api: ReturnType<typeof useEmblaCarousel>[1]
  emblaServerApi: ReturnType<typeof useEmblaCarousel>[2]
  carouselId: string
  ssrOptions: SsrOptionsType | null
  scrollPrev: () => void
  scrollNext: () => void
  canScrollPrev: boolean
  canScrollNext: boolean
} & CarouselProps

const CarouselContext =
  React.createContext<CarouselContextProps | null>(null)

function useCarousel() {
  const context = React.useContext(CarouselContext)

  if (!context) {
    throw new Error(
      'useCarousel must be used within a <Carousel />'
    )
  }

  return context
}

function Carousel({
  orientation = 'horizontal',
  opts,
  setApi,
  plugins,
  slideCount,
  ssr,
  className,
  children,
  ...props
}: React.ComponentProps<'div'> & CarouselProps) {
  const carouselId = React.useId().replace(/:/g, '')
  const mergedOpts = {
    ...opts,
    axis:
      orientation === 'horizontal' ?
        ('x' as const)
      : ('y' as const)
  }
  const ssrOptions = resolveCarouselSsrOptions(
    mergedOpts,
    slideCount,
    ssr
  )
  const [corePlugins] = React.useState(() => [
    Accessibility(),
    ClassNames()
  ])
  const resolvedPlugins = [
    ...corePlugins,
    ...(ssrOptions ? [Ssr(ssrOptions)] : []),
    ...(plugins ?? [])
  ]

  const [carouselRef, api, emblaServerApi] = useEmblaCarousel(
    mergedOpts,
    resolvedPlugins
  )
  const [canScrollPrev, setCanScrollPrev] = React.useState(false)
  const [canScrollNext, setCanScrollNext] = React.useState(false)

  function scrollPrev() {
    if (!api) return
    const carouselApi = api as ResolvedCarouselApi

    if (typeof carouselApi.goToPrev === 'function') {
      carouselApi.goToPrev()
      return
    }

    carouselApi.scrollPrev?.()
  }

  function scrollNext() {
    if (!api) return
    const carouselApi = api as ResolvedCarouselApi

    if (typeof carouselApi.goToNext === 'function') {
      carouselApi.goToNext()
      return
    }

    carouselApi.scrollNext?.()
  }

  function handleKeyDown(
    event: React.KeyboardEvent<HTMLDivElement>
  ) {
    if (event.key === 'ArrowLeft') {
      event.preventDefault()
      scrollPrev()
    } else if (event.key === 'ArrowRight') {
      event.preventDefault()
      scrollNext()
    }
  }

  React.useEffect(() => {
    if (!api || !setApi) return
    setApi(api)
  }, [api, setApi])

  React.useEffect(() => {
    if (!api) return
    const carouselApi = api as ResolvedCarouselApi

    function handleSelect() {
      if (typeof carouselApi.canGoToPrev === 'function') {
        setCanScrollPrev(carouselApi.canGoToPrev())
      } else {
        setCanScrollPrev(carouselApi.canScrollPrev?.() ?? false)
      }

      if (typeof carouselApi.canGoToNext === 'function') {
        setCanScrollNext(carouselApi.canGoToNext())
      } else {
        setCanScrollNext(carouselApi.canScrollNext?.() ?? false)
      }
    }

    handleSelect()
    carouselApi.on('reinit', handleSelect)
    carouselApi.on('select', handleSelect)

    return () => {
      carouselApi.off('reinit', handleSelect)
      carouselApi.off('select', handleSelect)
    }
  }, [api])

  return (
    <CarouselContext.Provider
      value={{
        carouselRef,
        api,
        emblaServerApi,
        carouselId,
        ssrOptions,
        opts,
        orientation:
          orientation ||
          (opts?.axis === 'y' ? 'vertical' : 'horizontal'),
        scrollPrev,
        scrollNext,
        canScrollPrev,
        canScrollNext
      }}
    >
      <div
        onKeyDownCapture={handleKeyDown}
        className={cn('relative', className)}
        role='region'
        aria-roledescription='carousel'
        aria-label={
          props['aria-label'] ??
          (slideCount ? `${slideCount} bilder` : undefined)
        }
        data-slot='carousel'
        {...props}
      >
        {children}
      </div>
    </CarouselContext.Provider>
  )
}

function CarouselContent({
  className,
  ...props
}: React.ComponentProps<'div'>) {
  const {
    carouselRef,
    orientation,
    carouselId,
    api,
    emblaServerApi,
    ssrOptions
  } = useCarousel()
  const renderSsrStyles = !api && ssrOptions

  return (
    <>
      {renderSsrStyles ?
        <style
          dangerouslySetInnerHTML={{
            __html:
              emblaServerApi
                .plugins()
                ?.ssr?.getStyles(
                  `#${carouselId}`,
                  '[data-slot="carousel-item"]'
                ) ?? ''
          }}
        />
      : null}
      <div
        ref={carouselRef}
        className='h-full overflow-hidden'
        data-slot='carousel-content'
      >
        <div
          id={carouselId}
          className={cn(
            'pinch-zoom flex h-full touch-pan-y',
            orientation === 'horizontal' ? '-ml-4' : (
              '-mt-4 flex-col'
            ),
            className
          )}
          {...props}
        />
      </div>
    </>
  )
}

function CarouselItem({
  className,
  ...props
}: React.ComponentProps<'div'>) {
  const { orientation } = useCarousel()

  return (
    <div
      role='group'
      aria-roledescription='slide'
      data-slot='carousel-item'
      className={cn(
        'min-w-0 shrink-0 grow-0 basis-full',
        orientation === 'horizontal' ? 'pl-4' : 'pt-4',
        className
      )}
      {...props}
    />
  )
}

function CarouselPrevious({
  className,
  variant = 'outline',
  size = 'icon-sm',
  forceVisible = false,
  ...props
}: React.ComponentProps<typeof Button> & {
  forceVisible?: boolean
}) {
  const { orientation, scrollPrev, canScrollPrev } =
    useCarousel()
  const isDisabled = !canScrollPrev

  return (
    <Button
      data-slot='carousel-previous'
      variant={variant}
      size={size}
      className={cn(
        'hover:bg-card-hover -hover absolute size-8 cursor-pointer touch-manipulation rounded-full border border-border bg-card p-0 text-card-foreground shadow-xs hover:text-card-foreground disabled:cursor-not-allowed',
        orientation === 'horizontal' ?
          'top-1/2 -left-12 -translate-y-1/2'
        : '-top-12 left-1/2 -translate-x-1/2 rotate-90',
        isDisabled && !forceVisible && 'hidden',
        className
      )}
      disabled={isDisabled}
      onClick={scrollPrev}
      {...props}
    >
      <CaretLeftIcon tone="orange" />
      <span className='sr-only'>Previous slide</span>
    </Button>
  )
}

function CarouselNext({
  className,
  variant = 'outline',
  size = 'icon-sm',
  forceVisible = false,
  ...props
}: React.ComponentProps<typeof Button> & {
  forceVisible?: boolean
}) {
  const { orientation, scrollNext, canScrollNext } =
    useCarousel()
  const isDisabled = !canScrollNext

  return (
    <Button
      data-slot='carousel-next'
      variant={variant}
      size={size}
      className={cn(
        'hover:bg-card-hover -hover absolute size-8 cursor-pointer touch-manipulation rounded-full border border-border bg-card p-0 text-card-foreground shadow-xs hover:text-card-foreground disabled:cursor-not-allowed',
        orientation === 'horizontal' ?
          'top-1/2 -right-12 -translate-y-1/2'
        : '-bottom-12 left-1/2 -translate-x-1/2 rotate-90',
        isDisabled && !forceVisible && 'hidden',
        className
      )}
      disabled={isDisabled}
      onClick={scrollNext}
      {...props}
    >
      <CaretRightIcon tone="orange" />
      <span className='sr-only'>Next slide</span>
    </Button>
  )
}

export {
  type CarouselApi,
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
  useCarousel
}
