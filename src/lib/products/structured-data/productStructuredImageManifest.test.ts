import assert from 'node:assert/strict'
import test from 'node:test'

import { isValidGtin } from '@/lib/gtin/isValidGtin'
import {
  getStructuredDataEligibleGtins,
  productStructuredImageManifest,
  resolveProductStructuredImages
} from './productStructuredImageManifest'

const EXPECTED_PUBLIC_GTINS = [
  '07090062980016',
  '07090062980023',
  '07090062980030',
  '07090062980047',
  '07090062980054',
  '07090062980061',
  '07090062980078',
  '07090062980085',
  '07090062980092',
  '07090062980108',
  '07090062980115',
  '07090062980122',
  '07090062980139',
  '07090062980146'
]

test('registers all 14 public GTIN variants with local square images', () => {
  assert.deepEqual(
    getStructuredDataEligibleGtins(),
    EXPECTED_PUBLIC_GTINS
  )
  assert.equal(
    Object.keys(productStructuredImageManifest).length,
    15
  )

  for (const gtin of EXPECTED_PUBLIC_GTINS) {
    const entry = productStructuredImageManifest[gtin]

    assert.ok(entry)
    assert.equal(isValidGtin(gtin), true)
    assert.equal(entry.structuredDataEligible, true)
    assert.equal(entry.images.length, 1)
    assert.equal(entry.images[0]?.aspectRatio, '1:1')
    assert.equal(entry.images[0]?.role, 'primary')
    assert.match(
      entry.images[0]?.url ?? '',
      new RegExp(
        `^https://utekos\\.no/gtin/product-images/${gtin}\\.png$`
      )
    )
    assert.doesNotMatch(
      JSON.stringify(entry),
      /cdn\.shopify\.com/i
    )
  }
})

test('fails closed for the hidden TechDown GTIN and product mismatches', () => {
  assert.equal(
    productStructuredImageManifest['07090062980009']
      ?.structuredDataEligible,
    false
  )
  assert.deepEqual(
    resolveProductStructuredImages({
      gtin: '07090062980009',
      productKey: 'utekos-techdown'
    }),
    []
  )
  assert.deepEqual(
    resolveProductStructuredImages({
      gtin: '07090062980016',
      productKey: 'comfyrobe'
    }),
    []
  )
  assert.deepEqual(
    resolveProductStructuredImages({
      gtin: '07090062980017',
      productKey: 'utekos-techdown'
    }),
    []
  )
})
