import { getFeaturedProducts } from '@/api/lib/products/getFeaturedProducts'
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious
} from '@/components/ui/carousel'
import { initializeCarouselProducts } from '@/components/ProductCard/initializeCarouselProducts'
import { ProductGridCard } from './ProductGridCard'

export async function ProductCarousel() {
  const products = await getFeaturedProducts()

  if (!products || products.length === 0) {
    return null
  }

  const productOptionsMap = initializeCarouselProducts(products)

  return (
    <Carousel
      opts={{
        align: 'start',
        slidesToScroll: 1
      }}
      className='w-full'
    >
      <CarouselContent className='-ml-4'>
        {products.map((product, index) => {
          const initialOptions =
            productOptionsMap.get(product.handle)
            ?? ({} as Record<string, string>)

          return (
            <CarouselItem
              key={product.id}
              className='basis-1/2 pl-4 md:basis-1/3 lg:basis-1/4'
            >
              <ProductGridCard
                product={product}
                initialOptions={initialOptions}
                isPriority={index < 3} // Prioriter lasting av de første bildene
                itemListTotalCount={products.length}
                colorHexMap={new Map<string, string>()}
              />
            </CarouselItem>
          )
        })}
      </CarouselContent>
      <CarouselPrevious className='left-2' />
      <CarouselNext className='right-2' />
    </Carousel>
  )
}
