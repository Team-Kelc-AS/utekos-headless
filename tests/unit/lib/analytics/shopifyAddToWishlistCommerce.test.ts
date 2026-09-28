import assert from 'node:assert/strict'
import test from 'node:test'
import { mapShopifyAddToWishlist } from '@/lib/analytics/shopifyAddToWishlistCommerce'
import type { ShopifyProduct } from 'types/product/ShopifyProduct'
import type { ShopifyProductVariant } from 'types/product/ShopifyProductVariant'

const product = {
  id: 'gid://shopify/Product/456',
  handle: 'utekos-techdown',
  title: 'Utekos TechDown',
  vendor: 'Utekos',
  productType: 'Yttertøy',
  collections: { nodes: [] },
  options: [],
  variants: { nodes: [] },
  featuredImage: null,
  priceRange: {
    minVariantPrice: { amount: '1790.0', currencyCode: 'NOK' },
    maxVariantPrice: { amount: '1790.0', currencyCode: 'NOK' }
  }
} as unknown as ShopifyProduct

test('maps wishlist mutation id onto commerce custom_data', () => {
  const variant = {
    id: 'gid://shopify/ProductVariant/46944403882232',
    title: 'Default',
    availableForSale: true,
    currentlyNotInStock: false,
    quantityAvailable: 3,
    selectedOptions: [],
    price: { amount: '1790.0', currencyCode: 'NOK' },
    compareAtPrice: null,
    image: null,
    sku: 'TD-1',
    taxable: true
  } as unknown as ShopifyProductVariant

  const customData = mapShopifyAddToWishlist({
    product,
    variant,
    wishlistMutationId: '550e8400-e29b-41d4-a716-446655440000'
  })

  assert.equal(
    customData.wishlist_mutation_id,
    '550e8400-e29b-41d4-a716-446655440000'
  )
  assert.equal(customData.currency, 'NOK')
  assert.equal(customData.gross_value, 1790)
  assert.equal(customData.items.length, 1)
  assert.equal(customData.items[0]?.variant_id, variant.id)
})

test('defaults missing taxable to true for list payloads', () => {
  const variant = {
    id: 'gid://shopify/ProductVariant/46944403882232',
    title: 'Default',
    availableForSale: true,
    currentlyNotInStock: false,
    quantityAvailable: 3,
    selectedOptions: [],
    price: { amount: '1790.0', currencyCode: 'NOK' },
    compareAtPrice: null,
    image: null,
    sku: 'TD-1'
  } as unknown as ShopifyProductVariant

  const customData = mapShopifyAddToWishlist({
    product,
    variant,
    wishlistMutationId: 'mutation-missing-taxable'
  })

  assert.equal(customData.items[0]?.taxable, true)
  assert.equal(customData.currency, 'NOK')
  assert.equal(customData.gross_value, 1790)
  assert.equal(customData.tax_value, 358)
})
