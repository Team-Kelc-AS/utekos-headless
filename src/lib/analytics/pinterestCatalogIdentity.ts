import { cleanShopifyId } from '@/lib/utils/cleanShopifyId'

import type { CanonicalCommerceItem } from './canonicalCommerceItem'

/**
 * Pinterest Catalog product-identity contract.
 *
 * Canonical `item_id` stays a Shopify GID. Pinterest normalizes that GID
 * with the same `cleanShopifyId()` helper as the hosted catalog feed:
 *
 *   gid://shopify/ProductVariant/123456789 → 123456789
 *
 * Pinterest Tag `line_items[].product_id` and Conversions API
 * `content_ids[]` / `contents[].id` must use this value. Do not derive a
 * Pinterest ID from Canonical `product_id`, `variant_id`, SKU or GTIN.
 */
export function resolvePinterestCatalogProductId(
  item: Pick<CanonicalCommerceItem, 'item_id'>
) {
  const pinterestId = cleanShopifyId(item.item_id)?.trim()

  return pinterestId || undefined
}
