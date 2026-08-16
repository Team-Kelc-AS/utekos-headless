import assert from 'node:assert/strict'
import test from 'node:test'

import type { CatalogSyncProduct } from '@/lib/catalog-sync/types'

import { isPinterestCatalogOfferIncluded } from './isPinterestCatalogOfferIncluded'

function createOffer(
  handle: string,
  options: Array<{ name: string; value: string }>
): {
  product: CatalogSyncProduct
  variant: CatalogSyncProduct['variants']['edges'][number]['node']
} {
  const variant = {
    id: 'gid://shopify/ProductVariant/1',
    title: 'Test',
    sku: 'TEST',
    barcode: '4006381333931',
    price: '1790',
    compareAtPrice: null,
    inventoryQuantity: 1,
    availableForSale: true,
    updatedAt: '2026-08-15T08:00:00Z',
    image: null,
    selectedOptions: options,
    weight: null,
    weightUnit: 'kg' as const,
    customLabel0: null,
    customLabel1: null,
    customLabel2: null,
    customLabel3: null,
    customLabel4: null
  }

  return {
    product: {
      id: 'gid://shopify/Product/1',
      title: handle,
      handle,
      productType: 'Uteklær',
      descriptionHtml: '<p>Test</p>',
      vendor: 'Utekos',
      status: 'ACTIVE',
      updatedAt: '2026-08-15T08:00:00Z',
      featuredImage: {
        url: 'https://cdn.shopify.com/featured.jpg'
      },
      images: [],
      variants: { edges: [{ node: variant }] }
    },
    variant
  }
}

test('excludes Dun, Mikrofiber Vargnatt and TechDown Liten', () => {
  const dun = createOffer('utekos-dun', [
    { name: 'Farge', value: 'Havdyp' },
    { name: 'Størrelse', value: 'Medium' },
    { name: 'Kjønn', value: 'Unisex' }
  ])
  const vargnatt = createOffer('utekos-mikrofiber', [
    { name: 'Farge', value: 'Vargnatt' },
    { name: 'Størrelse', value: 'Medium' },
    { name: 'Kjønn', value: 'Unisex' }
  ])
  const liten = createOffer('utekos-techdown', [
    { name: 'Farge', value: 'Havdyp' },
    { name: 'Størrelse', value: 'Liten' },
    { name: 'Kjønn', value: 'Unisex' }
  ])

  assert.equal(
    isPinterestCatalogOfferIncluded(dun.product, dun.variant),
    false
  )
  assert.equal(
    isPinterestCatalogOfferIncluded(
      vargnatt.product,
      vargnatt.variant
    ),
    false
  )
  assert.equal(
    isPinterestCatalogOfferIncluded(
      liten.product,
      liten.variant
    ),
    false
  )
})

test('includes TechDown Havdyp, Mikrofiber Fjellblå, Comfyrobe and Stapper', () => {
  const techdown = createOffer('utekos-techdown', [
    { name: 'Farge', value: 'Havdyp' },
    { name: 'Størrelse', value: 'Stor' },
    { name: 'Kjønn', value: 'Unisex' }
  ])
  const mikrofiber = createOffer('utekos-mikrofiber', [
    { name: 'Farge', value: 'Fjellblå' },
    { name: 'Størrelse', value: 'Medium' },
    { name: 'Kjønn', value: 'Unisex' }
  ])
  const comfyrobe = createOffer('comfyrobe', [
    { name: 'Farge', value: 'Fjellnatt' },
    { name: 'Størrelse', value: 'M' },
    { name: 'Kjønn', value: 'Unisex' }
  ])
  const stapper = createOffer('utekos-stapper', [
    { name: 'Farge', value: 'Vargnatt' },
    { name: 'Størrelse', value: 'OneSize' },
    { name: 'Kjønn', value: 'Unisex' }
  ])

  assert.equal(
    isPinterestCatalogOfferIncluded(
      techdown.product,
      techdown.variant
    ),
    true
  )
  assert.equal(
    isPinterestCatalogOfferIncluded(
      mikrofiber.product,
      mikrofiber.variant
    ),
    true
  )
  assert.equal(
    isPinterestCatalogOfferIncluded(
      comfyrobe.product,
      comfyrobe.variant
    ),
    true
  )
  assert.equal(
    isPinterestCatalogOfferIncluded(
      stapper.product,
      stapper.variant
    ),
    true
  )
})
