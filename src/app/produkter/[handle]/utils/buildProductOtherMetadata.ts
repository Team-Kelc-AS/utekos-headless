import { flattenConnection } from '@shopify/hydrogen-react/flatten-connection'
import type { ShopifyProduct } from 'types/product'
import type { ShopifyProductVariant } from 'types/product/ShopifyProductVariant'
import type { MetadataOther } from '../types'

const ISO_CURRENCY = /^[A-Z]{3}$/

function resolveMetadataVariant(
  product: ShopifyProduct
): ShopifyProductVariant | undefined {
  if (product.selectedOrFirstAvailableVariant) {
    return product.selectedOrFirstAvailableVariant
  }

  const variants = flattenConnection(product.variants)
  const available = variants.find(variant => variant.availableForSale)

  return available ?? variants[0]
}

function normalizeIsoCurrency(value: string | undefined): string | null {
  if (!value) return null

  const currency = value.trim().toUpperCase()
  return ISO_CURRENCY.test(currency) ? currency : null
}

export function buildProductOtherMetadata(product: ShopifyProduct): MetadataOther {
  const selectedVariant = resolveMetadataVariant(product)
  const other: MetadataOther = {}

  const priceAmount =
    selectedVariant?.price.amount ??
    product.priceRange?.minVariantPrice?.amount
  const currencyCode = normalizeIsoCurrency(
    selectedVariant?.price.currencyCode ??
      product.priceRange?.minVariantPrice?.currencyCode
  )
  const retailerItemId = selectedVariant?.id
  const itemGroupId = product.id

  const isOutOfStock =
    selectedVariant?.availableForSale === false
    || selectedVariant?.currentlyNotInStock === true
    || product.availableForSale === false

  if (retailerItemId) {
    other['product:retailer_item_id'] = retailerItemId
  }

  if (itemGroupId) {
    other['product:item_group_id'] = itemGroupId
  }

  // Emit amount+currency together only. Incomplete product price metas
  // make Meta Pixel report "Invalid parameter format for currency".
  if (priceAmount != null && currencyCode) {
    other['product:price:amount'] = String(priceAmount)
    other['product:price:currency'] = currencyCode
  }

  if (
    selectedVariant?.compareAtPrice?.amount != null &&
    currencyCode
  ) {
    other['product:variant:compare_at_price'] = String(
      selectedVariant.compareAtPrice.amount
    )
  }

  other['product:availability'] = isOutOfStock ? 'out of stock' : 'in stock'
  other['product:condition'] = 'new'

  return other
}
