'use client'

import { FREE_SHIPPING_THRESHOLD } from '@/constants/free-shipping-threshold'
import { useStickyCTASelection } from '@/components/commerce/StickyCTA/StickyCTASelectionContext'

export function TechdownShippingHeadline() {
  const selection = useStickyCTASelection()?.selection

  if (
    selection &&
    Number.isFinite(selection.priceAmount) &&
    selection.priceAmount < FREE_SHIPPING_THRESHOLD
  ) {
    return <>Fri frakt over {FREE_SHIPPING_THRESHOLD} kr</>
  }

  return (
    <>
      Gratis frakt på{' '}
      {selection?.productName ?? 'Utekos TechDown™'}
    </>
  )
}
