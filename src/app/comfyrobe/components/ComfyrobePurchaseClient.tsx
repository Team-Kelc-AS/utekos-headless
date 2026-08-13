'use client'

import { useEffect, useRef } from 'react'
import { reportCanonicalViewItem } from '@/lib/analytics/viewItemReporter'
import { createViewItemReportKey } from '@/lib/analytics/viewItemReportKey'
import { ComfyrobeSizeGuideDialog } from './ComfyrobeSizeGuideDialog'
import { ComfyrobeShippingReturnsDialog } from './ComfyrobeShippingReturnsDialog'
import { reportComfyrobePurchaseSelection } from '../lib/reportComfyrobePurchaseSelection'
import type { ComfyrobePurchaseModel } from '../lib/buildComfyrobePurchaseModel'

function reportSizeGuideSelection() {
  reportComfyrobePurchaseSelection(
    'Se størrelsesguide',
    'purchase_size_guide'
  )
}

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
      className='mx-auto w-full bg-jungle text-foreground md:rounded-xl md:px-8 md:py-12 lg:px-12 lg:py-16'
    >
      <div className='mx-auto grid max-w-3xl overflow-hidden rounded-lg'>
        <div className='flex flex-col'>
          <div className='flex-1 bg-background px-6 pt-6 pb-4 text-foreground md:px-12 md:pt-8 md:pb-5 lg:px-16 lg:pt-10 lg:pb-6'>
            <div className='flex w-full flex-wrap items-center justify-between gap-x-6 gap-y-2'>
              <ComfyrobeSizeGuideDialog
                onOpen={reportSizeGuideSelection}
                triggerClassName='flex min-h-11 items-center gap-2 font-utekos-text-medium text-sm underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary'
              />
              <ComfyrobeShippingReturnsDialog triggerClassName='flex min-h-11 items-center gap-2 font-utekos-text-medium text-sm underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary' />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
