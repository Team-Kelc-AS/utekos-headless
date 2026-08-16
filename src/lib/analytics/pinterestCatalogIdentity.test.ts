import assert from 'node:assert/strict'
import test from 'node:test'

import { cleanShopifyId } from '@/lib/utils/cleanShopifyId'

import { resolvePinterestCatalogProductId } from './pinterestCatalogIdentity'

const CANONICAL_ITEM_ID =
  'gid://shopify/ProductVariant/123456789'
const PINTEREST_PRODUCT_ID = '123456789'

test('normalizes Canonical item_id to the Pinterest Catalog variant id', () => {
  const canonicalItem = {
    item_id: CANONICAL_ITEM_ID,
    product_id: 'gid://shopify/Product/1',
    variant_id: 'gid://shopify/ProductVariant/999999999'
  }

  assert.equal(canonicalItem.item_id, CANONICAL_ITEM_ID)
  assert.equal(
    resolvePinterestCatalogProductId(canonicalItem),
    PINTEREST_PRODUCT_ID
  )
  assert.equal(
    resolvePinterestCatalogProductId(canonicalItem),
    cleanShopifyId(canonicalItem.item_id)
  )
  assert.equal(canonicalItem.item_id, CANONICAL_ITEM_ID)
  assert.equal(
    canonicalItem.product_id,
    'gid://shopify/Product/1'
  )
  assert.equal(
    canonicalItem.variant_id,
    'gid://shopify/ProductVariant/999999999'
  )
})

test('does not derive a Pinterest id from product_id or variant_id', () => {
  assert.equal(
    resolvePinterestCatalogProductId({
      item_id: CANONICAL_ITEM_ID
    }),
    PINTEREST_PRODUCT_ID
  )
  assert.notEqual(
    resolvePinterestCatalogProductId({
      item_id: CANONICAL_ITEM_ID
    }),
    cleanShopifyId('gid://shopify/Product/1')
  )
})

test('keeps an already numeric Canonical item_id unchanged', () => {
  assert.equal(
    resolvePinterestCatalogProductId({
      item_id: PINTEREST_PRODUCT_ID
    }),
    PINTEREST_PRODUCT_ID
  )
})
