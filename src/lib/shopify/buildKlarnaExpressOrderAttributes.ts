import {
  checkoutAttributionSnapshotToShopifyAttributes,
  type CheckoutAttributionSnapshot
} from '@/lib/analytics/checkoutAttributionSnapshot'
import { checkoutProductContextToShopifyAttributes } from '@/lib/analytics/checkoutProductContext'

type BuildKlarnaExpressOrderAttributesInput = {
  attribution?: CheckoutAttributionSnapshot
  klarnaOrderId: string
  productContextItems?: ReadonlyArray<{
    item_id: string
    item_brand?: string
    item_category?: string
    product_type?: string
  }>
}

export function buildKlarnaExpressOrderAttributes({
  attribution,
  klarnaOrderId,
  productContextItems = []
}: BuildKlarnaExpressOrderAttributesInput) {
  return [
    { key: 'klarna_order_id', value: klarnaOrderId },
    ...(attribution ?
      checkoutAttributionSnapshotToShopifyAttributes(attribution)
    : []),
    ...checkoutProductContextToShopifyAttributes(
      productContextItems
    )
  ]
}
