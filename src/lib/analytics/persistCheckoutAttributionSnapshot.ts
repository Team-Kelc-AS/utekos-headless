'use client'

import { updateCartAttributesAction } from '@/lib/actions/updateCartAttributesAction'
import {
  checkoutAttributionSnapshotToShopifyAttributes,
  type CheckoutAttributionSnapshot
} from './checkoutAttributionSnapshot'
import { checkoutProductContextToShopifyAttributes } from './checkoutProductContext'
import type { CanonicalCommerceItem } from './canonicalCommerceItem'

const CHECKOUT_ATTRIBUTION_SESSION_PREFIX =
  'utekos:checkout_attribution:'

export async function persistCheckoutAttributionSnapshot(
  cartId: string,
  snapshot: CheckoutAttributionSnapshot,
  beginCheckoutEventId: string,
  items: ReadonlyArray<CanonicalCommerceItem>
) {
  try {
    window.sessionStorage.setItem(
      `${CHECKOUT_ATTRIBUTION_SESSION_PREFIX}${cartId}`,
      JSON.stringify(snapshot)
    )
  } catch {
    // Shopify cart attributes remain the cross-domain source of truth.
  }

  await updateCartAttributesAction(cartId, [
    ...checkoutAttributionSnapshotToShopifyAttributes(
      snapshot,
      beginCheckoutEventId
    ),
    ...checkoutProductContextToShopifyAttributes(items)
  ])
}
