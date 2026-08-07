import { getProduct } from '@/api/lib/products/getProduct'
import { flattenConnection } from '@shopify/hydrogen-react'
import { Badge } from '@/components/ui/badge'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle
} from '@/components/ui/card'
import { cacheLife, cacheTag } from 'next/cache'
import { nbccProducts } from '../utils/nbccLandingPageContent'
import { resolveVariantsForSizes } from '../utils/resolveVariantsForSizes'
import { toNbccCartProduct } from '../utils/toNbccCartProduct'
import { NbccAiSummaryButton } from './NbccAiSummaryButton'
import { NbccProductCarousel } from './NbccProductCarousel'
import { NbccProductCardActions } from './NbccProductCardActions'
import { NbccReveal, NbccRevealGroup } from './NbccReveal'

export async function NbccProductSection() {
  'use cache'
  cacheLife('hours')
  cacheTag('products')

  const fetched = await Promise.all(
    nbccProducts.map(p => getProduct(p.handle))
  )

  return (
    <article
      id='produkter'
      className='bg-background px-6 py-20 sm:px-8 sm:py-24 lg:px-10'
    >
      <div className='mx-auto max-w-7xl'>
        <NbccReveal className='flex flex-col gap-6 md:flex-row md:items-end md:justify-between'>
          <div>
            <Badge variant='promo'>Utekos for NBCC-medlemmer</Badge>
            <h2 className='mt-5 max-w-2xl font-sans text-3xl text-balance text-foreground sm:text-4xl'>
              Skreddersy din campingopplevelse
            </h2>
          </div>
        </NbccReveal>

        <NbccRevealGroup className='mt-12 grid gap-5 lg:grid-cols-3'>
          {nbccProducts.map((product, index) => {
            const shopifyProduct = fetched[index]
            const variants =
              shopifyProduct ?
                resolveVariantsForSizes(
                  flattenConnection(shopifyProduct.variants),
                  product.sizes,
                  product.color
                )
              : []

            const cartProduct =
              shopifyProduct ?
                toNbccCartProduct(shopifyProduct)
              : null

            return (
              <NbccReveal item key={product.handle}>
                <Card
                  data-nbcc-product-card
                  className='group overflow-hidden rounded-lg border-foreground/60 bg-jungle py-0 shadow-none'
                >
                  <CardHeader className='p-0'>
                    <NbccProductCarousel images={product.images} />
                  </CardHeader>
                  <CardContent className='px-6 pb-6'>
                    <p className='font-utekos-text-medium text-sm text-foreground'>
                      {product.shortTitle}
                    </p>
                    <CardTitle className='mt-3 font-utekos-text-medium text-2xl text-foreground'>
                      {product.title}
                    </CardTitle>
                    <div className='mt-5'>
                      {cartProduct && shopifyProduct ?
                        <NbccProductCardActions
                          product={shopifyProduct}
                          cartProduct={cartProduct}
                          variants={variants}
                          href={product.href}
                          productTitle={product.title}
                          tracking={product.tracking}
                          totalItemCount={nbccProducts.length}
                        />
                      : <p className='text-sm text-muted-foreground'>
                          Produktet er midlertidig utilgjengelig.
                        </p>
                      }
                    </div>
                  </CardContent>
                </Card>
              </NbccReveal>
            )
          })}
        </NbccRevealGroup>

        <NbccReveal className='mt-10 flex justify-center'>
          <NbccAiSummaryButton
            intent='sizes'
            idleLabel='Få størrelseshjelp'
            completedLabel='Vis størrelseshjelp'
            trackingName='NbccSizeInfoAiClick'
            trackingData={{
              page: 'nbcc',
              section: 'products',
              target: 'sizes-ai'
            }}
            containerClassName='flex w-full max-w-3xl flex-col items-center'
            panelClassName='w-full'
            buttonClassName='h-12 w-full justify-center gap-2 rounded-xl bg-dark-teal px-6 text-foreground hover:opacity-60 sm:w-auto'
          />
        </NbccReveal>
      </div>
    </article>
  )
}
