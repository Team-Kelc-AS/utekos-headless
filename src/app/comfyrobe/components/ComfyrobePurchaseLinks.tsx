'use client'

import { cn } from '@/lib/utils/className'
import { ComfyrobeShippingReturnsDialog } from './ComfyrobeShippingReturnsDialog'
import { ComfyrobeSizeGuideDialog } from './ComfyrobeSizeGuideDialog'
import { reportComfyrobePurchaseSelection } from '../lib/reportComfyrobePurchaseSelection'

function reportSizeGuideSelection() {
  reportComfyrobePurchaseSelection(
    'Se størrelsesguide',
    'purchase_size_guide'
  )
}

export function ComfyrobePurchaseLinks({
  className
}: {
  className?: string
}) {
  const triggerClassName =
    'flex min-h-11 items-center gap-2 font-utekos-text-medium text-sm underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary'

  return (
    <div className={cn('flex w-full flex-wrap items-center justify-between gap-x-6 gap-y-2', className)}>
      <ComfyrobeSizeGuideDialog
        onOpen={reportSizeGuideSelection}
        triggerClassName={triggerClassName}
      />
      <ComfyrobeShippingReturnsDialog triggerClassName={triggerClassName} />
    </div>
  )
}
