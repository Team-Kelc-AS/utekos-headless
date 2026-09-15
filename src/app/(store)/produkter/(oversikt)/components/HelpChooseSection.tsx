// Path: src/app/(store)/produkter/(oversikt)/components/HelpChooseSection.tsx

import { HelpChooseCard } from '@/app/produkter/(oversikt)/components/HelpChooseCard'
import { getHelpChooseProducts } from '@/app/produkter/(oversikt)/utils/getHelpChooseProducts'
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious
} from '@/components/ui/carousel'

const PRODUCT_CONFIG = [
  {
    handle: 'utekos-techdown',
    glowColor: '#212a42',
    fallbackTitle: 'Utekos TechDown™',
    fallbackPrice: '1 990 kr'
  },
  {
    handle: 'utekos-mikrofiber',
    glowColor: '#414679',
    fallbackTitle: 'Utekos Mikrofiber™',
    fallbackPrice: '1 790 kr'
  },
  {
    handle: 'comfyrobe',
    glowColor: '#202734',
    fallbackTitle: 'Comfyrobe™',
    fallbackPrice: '990 kr'
  }
] as const

export async function HelpChooseSection() {
  const products = await getHelpChooseProducts()
  const cards = PRODUCT_CONFIG.flatMap((config, index) => {
    const product = products.find(p => p.handle === config.handle)
    if (!product) return []
    return [{ config, product, index }]
  })

  if (cards.length === 0) {
    return null
  }

  return (
    <article className='relative mb-12 w-full px-4 md:px-6'>
      <div className='absolute inset-0 -z-10 overflow-hidden opacity-30'>
        <div
          className='absolute bg-night top-0 left-1/4 h-750 w-750 blur-[100px]'
        />
      </div>
      <div className='mx-auto max-w-7xl'>
        <Carousel
          slideCount={cards.length}
          ssr={{
            slideSizes: Array.from(
              { length: cards.length },
              () => 100 / 1.5
            ),
            breakpoints: {
              '(min-width: 640px)': {
                slideSizes: Array.from(
                  { length: cards.length },
                  () => 50
                )
              },
              '(min-width: 1024px)': {
                slideSizes: Array.from(
                  { length: cards.length },
                  () => 100 / 3
                )
              }
            }
          }}
          opts={{
            align: 'start',
            containScroll: false,
            slidesToScroll: 1
          }}
          className='w-full'
          aria-label='Produktkarusell — sveip for å se flere modeller'
        >
          <CarouselContent className='-ml-3 sm:-ml-4 lg:-ml-6'>
            {cards.map(({ config, product, index }) => (
              <CarouselItem
                key={config.handle}
                className='basis-[calc(100%/1.5)] pl-3 sm:basis-1/2 sm:pl-4 lg:basis-1/3 lg:pl-6'
              >
                <HelpChooseCard
                  product={product}
                  index={index}
                  glowColor={config.glowColor}
                  totalItemCount={cards.length}
                />
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious
            forceVisible
            className='top-[42%] left-1 z-20 size-9 border-border bg-card text-card-foreground shadow-md disabled:opacity-40 md:left-2 lg:hidden'
          />
          <CarouselNext
            forceVisible
            className='top-[42%] right-1 z-20 size-9 border-border bg-card text-card-foreground shadow-md disabled:opacity-40 md:right-2 lg:hidden'
          />
        </Carousel>
      </div>
    </article>
  )
}
