import assert from 'node:assert/strict'
import test from 'node:test'
import {
  CHECKOUT_PRODUCT_CONTEXT_ATTRIBUTE,
  checkoutProductContextToShopifyAttributes,
  parseOrderProductContextFromNoteAttributes
} from './checkoutProductContext'

test('round-trips product-only checkout context through Shopify attributes', () => {
  const attributes = checkoutProductContextToShopifyAttributes([
    {
      item_id: 'gid://shopify/ProductVariant/48249962135800',
      item_brand: 'Utekos',
      product_type: 'Poncho'
    }
  ])

  assert.equal(
    attributes[0]?.key,
    CHECKOUT_PRODUCT_CONTEXT_ATTRIBUTE
  )

  const parsed = parseOrderProductContextFromNoteAttributes(
    attributes.map(attribute => ({
      name: attribute.key,
      value: attribute.value
    }))
  )

  assert.deepEqual(parsed.get('48249962135800'), {
    item_id: '48249962135800',
    item_brand: 'Utekos',
    item_category: 'Poncho'
  })
})

test('fails closed for malformed order product context', () => {
  const parsed = parseOrderProductContextFromNoteAttributes([
    {
      name: CHECKOUT_PRODUCT_CONTEXT_ATTRIBUTE,
      value: '{not-json'
    }
  ])

  assert.equal(parsed.size, 0)
})

test('keeps the serialized Shopify attribute within its validated limit', () => {
  const attributes = checkoutProductContextToShopifyAttributes(
    Array.from({ length: 100 }, (_, index) => ({
      item_id: String(index + 1),
      item_brand: 'b'.repeat(255),
      item_category: 'c'.repeat(255)
    }))
  )

  assert.equal(attributes.length, 1)
  assert.ok((attributes[0]?.value.length ?? 0) <= 65_535)
})
