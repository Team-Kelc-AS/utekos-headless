import Link from 'next/link'
import { ComfyrobePurchaseClient } from './ComfyrobePurchaseClient'
import { buildComfyrobePurchaseModel } from '../lib/buildComfyrobePurchaseModel'
import type { ShopifyProduct } from 'types/product'

export function ComfyrobePurchaseSection({
  product
}: {
  product: ShopifyProduct | null
}) {
  if (!product) {
    return (
      <section className='dark:bg-dark-foreground dark:text-dark-background w-full bg-foreground px-6 py-20 text-background'>
        <div className='mx-auto max-w-3xl rounded-3xl border border-background/15 p-8 text-center'>
          <h2 className='font-google-sans font-sans text-3xl font-bold'>
            Produktvalget er midlertidig utilgjengelig
          </h2>
          <p className='dark:text-dark-background/80 mt-4 font-utekos-text leading-relaxed text-background/80'>
            Vi kunne ikke hente oppdatert pris og lagerstatus
            akkurat nå. Ingen pris eller lagerpåstand vises før
            Shopify svarer.
          </p>
          <Link
            href='/produkter/comfyrobe'
            className='mt-6 inline-flex font-utekos-text-medium underline underline-offset-4'
          >
            Åpne produktsiden
          </Link>
        </div>
      </section>
    )
  }

  const purchaseModel = buildComfyrobePurchaseModel(product)

  return (
    <ComfyrobePurchaseClient model={purchaseModel} />
  )
}