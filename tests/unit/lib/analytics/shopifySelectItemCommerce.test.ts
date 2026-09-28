import assert from 'node:assert/strict'
import test from 'node:test'
import { mapShopifySelectItem } from '@/lib/analytics/shopifySelectItemCommerce'
import type { ShopifyProduct } from 'types/product/ShopifyProduct'
import type { ShopifyProductVariant } from 'types/product/ShopifyProductVariant'

test('maps list context and single commerce item', () => {
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

  const customData = mapShopifySelectItem({
    product,
    variant,
    interactionId: '550e8400-e29b-41d4-a716-446655440000',
    itemListId: 'frontpage_featured',
    destinationUrl: 'https://utekos.no/produkter/utekos-techdown'
  })

  assert.equal(customData.item_list_id, 'frontpage_featured')
  assert.equal(
    customData.interaction_id,
    '550e8400-e29b-41d4-a716-446655440000'
  )
  assert.equal(customData.currency, 'NOK')
  assert.equal(customData.items.length, 1)
  assert.equal(customData.items[0]?.variant_id, variant.id)
  assert.equal(customData.gross_value, 1790)
})

test('defaults missing taxable to true for list payloads', () => {
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

  const customData = mapShopifySelectItem({
    product,
    variant,
    interactionId: '550e8400-e29b-41d4-a716-446655440000',
    itemListId: 'help_choose_carousel'
  })

  assert.equal(customData.items[0]?.taxable, true)
  assert.equal(customData.tax_value > 0, true)
  assert.equal(customData.gross_value, 1790)
})
