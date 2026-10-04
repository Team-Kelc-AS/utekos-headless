import { SvaleGuideCard } from './SvaleGuideCard'
import { HelpChooseCard } from '@/app/produkter/(oversikt)/components/HelpChooseCard'
import { getHelpChooseProducts } from '@/app/produkter/(oversikt)/utils/getHelpChooseProducts'
import { selectHelpChooseCards } from '@/app/produkter/(oversikt)/utils/selectHelpChooseCards'
import {
  HELP_CHOOSE_CAROUSELS,
  HELP_CHOOSE_GLOW,
  helpChooseCardImage
} from '@/app/produkter/(oversikt)/utils/helpChooseCarouselConfig'
import { CAROUSEL_SSR } from '@/components/ui/carousel-ssr'
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious
} from '@/components/ui/carousel'
import { isProductPageRequestAllowed } from '@/lib/products/presentation'
import { resolveImageSrc } from '@/lib/media/resolveImageSrc'

const SLIDE_CLASS_NAME =
  'basis-2/3 pl-3 md:basis-1/3 md:pl-4 xl:basis-1/4 xl:pl-6'

export async function HelpChooseSection() {
  const products = await getHelpChooseProducts()
  const productsByHandle = new Map(
    products.map(product => [product.handle, product])
  )
  const productCarousels = HELP_CHOOSE_CAROUSELS.flatMap(
    carousel => {
      if (
        !isProductPageRequestAllowed(
          carousel.handle,
          process.env.NODE_ENV
        )
      ) {
        return []
      }

      const product = productsByHandle.get(carousel.handle)
      const cards =
        product ?
          selectHelpChooseCards(carousel, product).flatMap(
            card => {
              const fallback =
                card.variant.image?.url ??
                product.featuredImage?.url
              const image =
                card.imageSrc ?
                  { src: card.imageSrc, alt: card.displayTitle }
                : helpChooseCardImage(
                    product.handle,
                    card.sizeLabel,
                    fallback ?
                      resolveImageSrc(fallback)
                    : fallback,
                    card.displayTitle
                  )
              return image ?
                  [
                    {
                      ...card,
                      product,
                      action: carousel.action,
                      itemListId: carousel.itemListId,
                      itemListName: carousel.itemListName,
                      imageSrc: image.src,
                      imageAlt: image.alt
                    }
                  ]
                : []
            }
          )
        : []
      if (!product || cards.length === 0) return []
      return [{ carousel, product, cards }]
    }
  )

  const rows = new Map<
    string,
    {
      id: string
      label: string
      cards: (typeof productCarousels)[number]['cards']
    }
  >()
  for (const { carousel, cards } of productCarousels) {
    for (const card of cards) {
      const groupByColor =
        carousel.id === 'dun' || carousel.id === 'mikrofiber'
      const id =
        groupByColor ? `color-${card.colorLabel}` : carousel.id
      const label =
        groupByColor ?
          `Utekos Dun og Mikrofiber — ${card.colorLabel}`
        : carousel.label
      const row = rows.get(id) ?? { id, label, cards: [] }
      row.cards.push(card)
      rows.set(id, row)
    }
  }
  const carousels = [...rows.values()]

  if (carousels.length === 0) {
    return null
  }

  return (
    <div className='flex flex-col gap-12'>
      {carousels.map(({ id, label, cards }) => (
        <article
          key={id}
          className='relative w-full px-4 md:px-6'
        >
          <div className='absolute inset-0 -z-10 overflow-hidden opacity-30'>
            <div className='absolute top-0 left-1/4 h-750 w-750 bg-night blur-[100px]' />
          </div>
          <div className='mx-auto max-w-7xl'>
            <Carousel
              slideCount={
                cards.length + (id === 'svale' ? 1 : 0)
              }
              ssr={CAROUSEL_SSR.helpChoosePeek(
                cards.length + (id === 'svale' ? 1 : 0)
              )}
              opts={{
                align: 'start',
                containScroll: false,
                slidesToScroll: 1
              }}
              className='w-full'
              aria-label={`${label} — sveip for å se flere størrelser`}
            >
              <CarouselContent className='-ml-3 md:-ml-4 xl:-ml-6'>
                {cards.map((config, index) => (
                  <CarouselItem
                    key={config.variant.id}
                    className={SLIDE_CLASS_NAME}
                  >
                    <HelpChooseCard
                      product={config.product}
                      displayTitle={config.displayTitle}
                      imageSrc={config.imageSrc}
                      imageAlt={config.imageAlt}
                      backgroundClassName={
                        config.colorLabel === 'Vargnatt' ?
                          'bg-[oklch(0.2389_0.0091_285.79)]'
                        : config.colorLabel === 'Fjellblå' ?
                          'bg-primary'
                        : 'bg-card'
                      }
                      variantId={config.variant.id}
                      index={index}
                      glowColor={HELP_CHOOSE_GLOW}
                      totalItemCount={cards.length}
                      action={config.action}
                      itemListId={config.itemListId}
                      itemListName={config.itemListName}
                    />
                  </CarouselItem>
                ))}
                {id === 'svale' ?
                  <CarouselItem
                    key='svale-guide'
                    className={SLIDE_CLASS_NAME}
                  >
                    <SvaleGuideCard />
                  </CarouselItem>
                : null}
              </CarouselContent>
              <CarouselPrevious
                forceVisible
                className='top-[42%] left-1 z-20 size-9 border-border bg-[oklch(0.2389_0.0091_285.79)] text-card-foreground shadow-md hover:bg-[oklch(0.2389_0.0091_285.79)] disabled:opacity-40 md:left-2 xl:hidden'
              />
              <CarouselNext
                forceVisible
                className='top-[42%] right-1 z-20 size-9 border-border bg-[oklch(0.2389_0.0091_285.79)] text-card-foreground shadow-md hover:bg-[oklch(0.2389_0.0091_285.79)] disabled:opacity-40 md:right-2 xl:hidden'
              />
            </Carousel>
          </div>
        </article>
      ))}
    </div>
  )
}
