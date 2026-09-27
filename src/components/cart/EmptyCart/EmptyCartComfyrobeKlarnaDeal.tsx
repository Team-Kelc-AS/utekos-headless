'use client'

import { useQuery } from '@tanstack/react-query'
import { comfyrobeCartDealOptions } from '@/api/lib/products/comfyrobeCartDealOptions'
import { buildComfyrobeOfferSummary } from '@/app/(store)/comfyrobe/lib/buildComfyrobeOfferSummary'
import { KlarnaCreditPromotionAutoSize } from '@/components/klarna/components/KlarnaCreditPromotionAutoSize'
import { KlarnaOnSiteMessagingScript } from '@/components/klarna/components/KlarnaOnSiteMessagingScript'

/**
 * Klarna Deals prerequisite: OSM on cart pages.
 * @see https://docs.klarna.com/acquirer/klarna/web-payments/additional-resources/use-cases/klarna-deals-promotions/
 * @see https://docs.klarna.com/acquirer/klarna/on-site-messaging/additional-resources/placements/
 *
 * Empty cart has no cart total — use Comfyrobe (deal assortment) amount so
 * Klarna can inject Deal messaging into the official credit-promotion asset.
 * No merchant copy: messaging comes from Klarna OSM when the deal is active.
 */
export function EmptyCartComfyrobeKlarnaDeal() {
  const { data: product } = useQuery(comfyrobeCartDealOptions)
  const offer =
    product ? buildComfyrobeOfferSummary(product) : null

  if (!offer?.klarnaPurchaseAmount) {
    return null
  }

  return (
    <div className='mb-6 min-h-10'>
      <KlarnaOnSiteMessagingScript strategy='lazyOnload' />
      <KlarnaCreditPromotionAutoSize
        id='klarna-credit-promotion-empty-cart-comfyrobe'
        purchaseAmount={offer.klarnaPurchaseAmount}
        theme='default'
      />
    </div>
  )
}
