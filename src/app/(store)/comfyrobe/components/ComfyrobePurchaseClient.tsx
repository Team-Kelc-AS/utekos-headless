'use client'

import { useEffect, useRef } from 'react'
import { reportCanonicalViewItem } from '@/lib/analytics/viewItemReporter'
import { createViewItemReportKey } from '@/lib/analytics/viewItemReportKey'
import { ComfyrobePurchaseLinks } from './ComfyrobePurchaseLinks'
import type { ComfyrobePurchaseModel } from '../lib/buildComfyrobePurchaseModel'

export function ComfyrobePurchaseClient({
  model
}: {
  model: ComfyrobePurchaseModel
}) {
  const { product, initialVariantId } = model
  const reportedViewItemKey = useRef<string | null>(null)
  const selectedVariant =
    product.variants.find(
      variant => variant.id === initialVariantId
    ) ?? null

  useEffect(() => {
    if (!selectedVariant) return

    const reportKey = createViewItemReportKey(
      product.id,
      selectedVariant.id
    )
    if (reportedViewItemKey.current === reportKey) return

    return reportCanonicalViewItem({
      product,
      variant: selectedVariant,
      onEmitted: () => {
        reportedViewItemKey.current = reportKey
      }
    })
  }, [product, selectedVariant])

  if (!selectedVariant) {
    return (
      <section className='bg-jungle px-6 py-20 text-foreground'>
        <div className='mx-auto max-w-3xl text-center'>
          <h2 className='font-google-sans font-sans text-3xl font-bold'>
            Comfyrobe™ er midlertidig utsolgt
          </h2>
          <p className='mt-4 font-utekos-text text-foreground/90'>
            Produktet kan ikke bestilles før Shopify rapporterer
            en tilgjengelig variant.
          </p>
        </div>
      </section>
    )
  }

  return (
    <section
      aria-label='Kjøp Comfyrobe™'
      className='mx-auto w-full bg-jungle text-foreground md:hidden'
    >
      <div className='mx-auto grid max-w-3xl overflow-hidden rounded-lg'>
        <div className='flex flex-col'>
          <div className='flex-1 bg-background px-6 pt-6 pb-4 text-foreground'>
            <ComfyrobePurchaseLinks />
          </div>
        </div>
      </div>
    </section>
  )
}
