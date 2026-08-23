import assert from 'node:assert/strict'
import test from 'node:test'

import { resolveMetaCatalogProductId } from './metaCatalogIdentity'

test('uses the numeric Shopify variant ID shared by Meta feeds and events', () => {
  assert.equal(
    resolveMetaCatalogProductId(
      'gid://shopify/ProductVariant/48249962135800'
    ),
    '48249962135800'
  )
  assert.equal(
    resolveMetaCatalogProductId('48249962135800'),
    '48249962135800'
  )
})

test('rejects non-numeric identifiers that cannot match the Meta catalog', () => {
  assert.throws(
    () => resolveMetaCatalogProductId('variant-1'),
    /numeric Shopify ProductVariant ID/
  )
})
