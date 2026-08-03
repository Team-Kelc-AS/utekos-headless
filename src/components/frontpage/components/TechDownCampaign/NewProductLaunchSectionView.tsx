import { TechDownFeatureCard } from './FeatureCard'
import { ImageColumn } from './ImageColumn'
import { newProductFeatures } from './newProductFeatures'
import {
  productName,
  originalPrice,
  currentPrice
} from '@/api/constants'
import type { NewProductLaunchSectionViewProps } from './types'
import DiscoverProductButton from './DiscoverProductButton'
import { AddNewProductToCartButton } from './AddNewProductToCartButton'
import { PageSection } from '@/components/layout/PageSection'
import { cn } from '@/lib/utils/className'
import { H2 } from '@/components/typography/TypographyH2'
import { InlineText } from '@/components/typography/TypographyInlineText'
import { P } from '@/components/typography/TypographyP'

const kickerText = 'Norsk vår er uforutsigbar'

export function NewProductLaunchSectionView({
  onQuickViewClick,
  product,
  selectedVariant
}: NewProductLaunchSectionViewProps) {
  return (
    <PageSection
      as='article'
      id='featured-product'
      background='default'
      className={cn(
        'relative scroll-mt-32 text-foreground md:scroll-mt-36'
      )}
    >
      <div className='w-full'>
        <div className='relative isolate overflow-hidden rounded-xl bg-jungle p-4 sm:p-8 lg:p-12'>
          <div className='pointer-events-none absolute inset-x-6 top-0 z-3 h-px' />

          <div className='relative z-10 container mx-auto grid max-w-7xl grid-cols-1 items-center gap-10 px-3 sm:gap-12 sm:px-6 lg:px-10 xl:grid-cols-[minmax(0,0.94fr)_minmax(0,1.06fr)] xl:gap-12'>
            <div className='w-full'>
              <ImageColumn />
            </div>

            <div className='flex w-full flex-col items-start'>
              <P className='mb-4 text-lg leading-[1.08] text-foreground sm:text-2xl md:text-3xl xl:text-3xl'>
                {kickerText}
              </P>

              <H2
                ID='techdown-launch-heading'
                className='font-google-sans mb-7 max-w-3xl pb-2 text-[1.7rem] leading-[0.94] font-bold text-foreground min-[360px]:text-[1.8rem] sm:mb-8 sm:text-[2.5rem] md:text-5xl md:leading-[0.96] lg:text-6xl lg:leading-[0.94]'
              >
                <InlineText className='block overflow-visible font-sans whitespace-nowrap'>
                  {productName}
                </InlineText>
                <InlineText className='block overflow-visible font-sans'>
                  er ikke det
                </InlineText>
              </H2>

              <div className='mb-8 w-full space-y-3 font-utekos-text text-foreground sm:space-y-4'>
                {newProductFeatures.map(feature => (
                  <TechDownFeatureCard
                    key={feature.title}
                    feature={feature}
                  />
                ))}
              </div>

              <div className='w-full'>
                <div className='border-featured-border dark:border-dark-featured-border flex w-full flex-col gap-6 border-t pt-6'>
                  <div className='flex flex-col gap-3'>
                    <div className='flex flex-wrap items-baseline gap-3'>
                      <InlineText className='font-google-sans text-4xl leading-none font-bold tracking-normal text-foreground sm:text-5xl lg:text-6xl'>
                        {currentPrice},-
                      </InlineText>
                      <InlineText className='text-sm text-foreground'>
                        inkl. mva
                      </InlineText>
                      <InlineText className='bg-featured-foreground/10 dark:bg-dark-featured-foreground/10 decoration-featured-foreground/80 dark:decoration-dark-featured-foreground/80 ring-featured-border dark:ring-dark-featured-border font-google-sans rounded-full px-3 py-1 text-sm font-bold text-foreground line-through decoration-2 ring-1'>
                        {originalPrice},-
                      </InlineText>
                    </div>
                  </div>
                  <div className='mt-4 grid w-full grid-cols-1 items-stretch gap-3 md:mt-0 md:grid-cols-2'>
                    <AddNewProductToCartButton
                      onAddToCartClick={onQuickViewClick}
                    />

                    <DiscoverProductButton
                      product={product}
                      selectedVariant={selectedVariant}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageSection>
  )
}
