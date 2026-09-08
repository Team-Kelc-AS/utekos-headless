// Path: src/components/frontpage/FeaturedProductSection.tsx
import { ProductCarousel } from '@/components/ProductCard/ProductCarousel'
import { frontpageSectionStackClassName } from '@/components/frontpage/layout/frontpageSectionStack'
import { H2 } from '@/components/typography/TypographyH2'
import { cn } from '@/lib/utils/className'

export async function FeaturedProductsSection() {
  return (
    <article
      className={cn(
        frontpageSectionStackClassName,
        'mx-auto w-full bg-primary text-foreground'
      )}
    >
      <div className='relative mx-auto w-full px-(--product-rail) pt-20 pb-[calc(--spacing(20)+--spacing(5))] [--product-rail:1rem] sm:pt-24 sm:pb-[calc(--spacing(24)+--spacing(5))] sm:[--product-rail:1.5rem] md:pt-28 md:pb-[calc(--spacing(28)+--spacing(5))] md:[--product-rail:clamp(3rem,7.42vw,4.75rem)] lg:pt-32 lg:pb-[calc(--spacing(32)+--spacing(5))] xl:[--product-rail:6rem]'>
        <H2
          ID='featured-products-heading'
          className='font-google-sans mb-8 pb-0 text-left text-4xl leading-[1.2] font-extrabold tracking-normal text-foreground md:max-w-[92%] md:text-5xl lg:text-6xl'
        >
          Kundenes favoritter
        </H2>
        <div className='-mr-(--product-rail) xl:mr-0'>
          <ProductCarousel
            productCardClassName={
              'border border-foreground/12 bg-card '
            }
          />
        </div>
      </div>
    </article>
  )
}
