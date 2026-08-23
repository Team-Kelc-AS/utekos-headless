import { cleanShopifyId } from '@/lib/utils/cleanShopifyId'

export function resolveMetaCatalogProductId(
  shopifyVariantId: string
) {
  const productId = cleanShopifyId(shopifyVariantId)?.trim()

  if (!productId || !/^\d+$/.test(productId)) {
    throw new Error(
      'Meta content_id requires a numeric Shopify ProductVariant ID'
    )
  }

  return productId
}
