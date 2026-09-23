import assert from 'node:assert/strict'
import test from 'node:test'
import { resolveProductJsonLdData } from '../utils/resolveProductJsonLdData'
import type { ProductModel } from '@/lib/products/commerce'

const techDownModel = {
  handle: 'utekos-techdown',
  title: 'Utekos TechDown™',
  description:
    'Et varmt og allsidig 3-i-1-plagg for terrasse, hytte, båt og bobil.',
  canonicalUrl: 'https://utekos.no/produkter/utekos-techdown',
  productGroupUrl:
    'https://utekos.no/produkter/utekos-techdown#product-group',
  productType: 'Varmt ytterplagg',
  material: 'Nylon og syntetisk isolasjon',
  audience: 'Unisex',
  variants: []
} as unknown as ProductModel

test('omits noncritical product JSON-LD when Shopify fails', async () => {
  const error = new DOMException(
    'The operation was aborted due to timeout',
    'TimeoutError'
  )
  const failures: unknown[] = []

  const data = await resolveProductJsonLdData(
    'utekos-techdown',
    {
      loadCommerce: async () => {
        throw error
      },
      onError: capturedError => {
        failures.push(capturedError)
      }
    }
  )

  assert.equal(data, null)
  assert.deepEqual(failures, [error])
})

test('does not query Shopify for an unknown product handle', async () => {
  let commerceCalls = 0

  const data = await resolveProductJsonLdData(
    'unknown-product',
    {
      loadCommerce: async () => {
        commerceCalls += 1
        return null
      }
    }
  )

  assert.equal(data, null)
  assert.equal(commerceCalls, 0)
})

test('uses authoritative Judge.me aggregate without hidden review details', async () => {
  const data = await resolveProductJsonLdData(
    'utekos-techdown',
    {
      loadCommerce: async () => techDownModel
    }
  )
  const productGroup = data as {
    aggregateRating?: unknown
    review?: unknown
  }

  assert.deepEqual(productGroup.aggregateRating, {
    '@type': 'AggregateRating',
    ratingValue: 4.93,
    reviewCount: 21,
    ratingCount: 21,
    bestRating: 5,
    worstRating: 4
  })
  assert.equal(productGroup.review, undefined)
})
