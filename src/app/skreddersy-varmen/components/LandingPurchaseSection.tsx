// Path: src/app/skreddersy-varmen/components/LandingPurchaseSection.tsx

import { PurchaseClientLanding } from './PurchaseClientLanding'
import { getProduct } from '@/api/lib/products/getProduct'
import { cacheLife, cacheTag } from 'next/cache'

async function getLandingPurchaseProducts() {
  'use cache: remote'

  cacheLife('products')
  cacheTag(
    'products',
    'product-utekos-techdown',
    'product-utekos-mikrofiber'
  )

  return Promise.all([
    getProduct('utekos-techdown'),
    getProduct('utekos-mikrofiber')
  ])
}

export async function LandingPurchaseSection() {
  const [techDown, mikro] = await getLandingPurchaseProducts()

  const productsMap = {
    'utekos-techdown': techDown,
    'utekos-mikrofiber': mikro
  }

  if (!techDown) {
    return (
      <div className='bg-foreground-muted dark:text-dark-background w-full px-6 py-16 text-background'>
        <div className='dark:border-dark-background/12 dark:bg-dark-foreground mx-auto max-w-3xl rounded-sm border border-background/12 bg-foreground p-6 text-center shadow-sm'>
          <p className='font-google-sans font-sans text-xl font-bold'>
            Produktvalget er midlertidig utilgjengelig
          </p>
          <p className='text-l dark:text-dark-background/75 mt-2 leading-relaxed text-background/75'>
            Landingssiden er lastet, men produktdata kunne ikke
            hentes akkurat nå.
          </p>
        </div>
      </div>
    )
  }

  return <PurchaseClientLanding products={productsMap} />
}
