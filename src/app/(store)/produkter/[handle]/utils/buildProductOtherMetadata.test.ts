import assert from 'node:assert/strict'
import test from 'node:test'
import { buildProductOtherMetadata } from './buildProductOtherMetadata'
import type { Money } from 'types/commerce/Money'
import type { ShopifyProduct } from 'types/product'

function money(
  amount: string,
  currencyCode: Money['currencyCode'] = 'NOK'
): Money {
  return { amount, currencyCode }
}

function malformedMoney(
  amount: string,
  currencyCode: string
): Money {
  return { amount, currencyCode } as Money
}

function product(
  overrides: Partial<ShopifyProduct> = {}
): ShopifyProduct {
  const variant = {
    id: 'gid://shopify/ProductVariant/111',
    title: 'Default',
    availableForSale: true,
    currentlyNotInStock: false,
    price: money('1790.0'),
    compareAtPrice: money('1990.0'),
    selectedOptions: [],
    image: null,
    quantityAvailable: 3,
    sku: 'SKU',
    barcode: null,
    weight: 1,
    taxable: true
  }

  return {
    id: 'gid://shopify/Product/924',
    title: 'Utekos TechDown',
    handle: 'utekos-techdown',
    productType: 'Yttertøy',
    totalInventory: 3,
    updatedAt: '2026-07-24T00:00:00Z',
    collections: { nodes: [] },
    compareAtPriceRange: {
      minVariantPrice: money('1990.0'),
      maxVariantPrice: money('1990.0')
    },
    priceRange: {
      minVariantPrice: money('1790.0'),
      maxVariantPrice: money('1790.0')
    },
    availableForSale: true,
    images: { edges: [] },
    options: [],
    featuredImage: null,
    vendor: 'Utekos',
    tags: [],
    relatedProducts: [],
    category: {
      id: '1',
      name: 'Outerwear',
      ancestors: { id: '0', name: 'Root', ancestors: '' }
    },
    seo: { title: null, description: null },
    selectedOrFirstAvailableVariant: undefined as never,
    variants: { edges: [{ node: variant as never }] },
    weight: 'KILOGRAMS' as never,
    ...overrides
  }
}

test('emits paired price amount and ISO currency from variants when selectedOrFirstAvailableVariant is missing', () => {
  const other = buildProductOtherMetadata(product())

  assert.equal(other['product:price:amount'], '1790.0')
  assert.equal(other['product:price:currency'], 'NOK')
  assert.equal(
    other['product:retailer_item_id'],
    'gid://shopify/ProductVariant/111'
  )
  assert.equal(
    other['product:item_group_id'],
    'gid://shopify/Product/924'
  )
  assert.equal(other['product:availability'], 'in stock')
  assert.equal(other['product:condition'], 'new')
  assert.equal(
    other['product:variant:compare_at_price'],
    '1990.0'
  )
})

test('omits price metas when currency cannot be normalized to ISO 4217', () => {
  const broken = product({
    priceRange: {
      minVariantPrice: malformedMoney('1790.0', 'nok '),
      maxVariantPrice: malformedMoney('1790.0', 'nok ')
    },
    variants: {
      edges: [
        {
          node: {
            id: 'gid://shopify/ProductVariant/111',
            title: 'Default',
            availableForSale: true,
            currentlyNotInStock: false,
            price: malformedMoney('1790.0', 'kr'),
            compareAtPrice: null,
            selectedOptions: [],
            image: null,
            quantityAvailable: 1,
            sku: 'SKU',
            barcode: null,
            weight: 1,
            taxable: true
          } as never
        }
      ]
    }
  })

  const other = buildProductOtherMetadata(broken)

  assert.equal('product:price:amount' in other, false)
  assert.equal('product:price:currency' in other, false)
  assert.equal(
    'product:variant:compare_at_price' in other,
    false
  )
})
