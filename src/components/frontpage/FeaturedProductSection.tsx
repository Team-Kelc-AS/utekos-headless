// Path: src/components/frontpage/FeaturedProductSection.tsx
import {
  HydrationBoundary,
  dehydrate,
  QueryClient
} from '@tanstack/react-query'
import { cacheTag } from 'next/cache'
import { getFeaturedProducts } from '@/api/lib/products/getFeaturedProducts'
import { ProductCarousel } from '@/components/ProductCard/ProductCarousel'
import { H2 } from '@/components/typography/TypographyH2'

export async function FeaturedProductsSection() {
  'use cache'
  cacheTag('products')

  const queryClient = new QueryClient()

  await queryClient.prefetchQuery({
    queryKey: ['products', 'featured'],
    queryFn: getFeaturedProducts
  })

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <article className='w-full bg-background text-foreground'>
        <div className='relative mx-auto w-full border-t border-t-foreground/30 px-[var(--product-rail)] py-8 [--product-rail:1rem] sm:py-12 sm:[--product-rail:1.5rem] md:py-16 md:[--product-rail:clamp(3rem,7.42vw,4.75rem)] lg:py-24 xl:[--product-rail:6rem]'>
          <H2
            ID='featured-products-heading'
            className='font-google-sans mb-8 pb-0 text-left text-4xl leading-[1.2] font-bold tracking-normal text-foreground md:max-w-screen md:text-5xl lg:text-6xl'
          >
            Kundenes favoritter
          </H2>
          <div className='-mr-[var(--product-rail)] xl:mr-0'>
            <ProductCarousel
              productCardClassName={
                'border border-foreground/12 dark:border-dark-foreground/12 bg-card '
              }
            />
          </div>
        </div>
      </article>
    </HydrationBoundary>
  )
}
