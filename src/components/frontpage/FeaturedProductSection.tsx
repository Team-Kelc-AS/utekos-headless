// Path: src/components/frontpage/FeaturedProductSection.tsx
import { ProductCarousel } from '@/components/ProductCard/ProductCarousel'
import { H2 } from '@/components/typography/TypographyH2'

export async function FeaturedProductsSection() {
  return (
    <article className='mx-auto w-full bg-background text-foreground lg:max-w-[90%]'>
      <div className='relative mx-auto w-full px-(--product-rail) py-8 [--product-rail:1rem] sm:py-12 sm:[--product-rail:1.5rem] md:py-16 md:[--product-rail:clamp(3rem,7.42vw,4.75rem)] lg:py-24 xl:[--product-rail:6rem]'>
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
