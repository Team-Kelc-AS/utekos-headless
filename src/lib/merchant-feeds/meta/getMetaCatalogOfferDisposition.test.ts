import assert from 'node:assert/strict'
import test from 'node:test'

import type {
  CatalogSyncProduct,
  CatalogSyncVariant
} from '@/lib/catalog-sync/types'

import { getMetaCatalogOfferDisposition } from './getMetaCatalogOfferDisposition'

const variant: CatalogSyncVariant = {
  id: 'gid://shopify/ProductVariant/42903954292984',
  title: 'Vargnatt / OneSize / Unisex',
  sku: 'UTEKOS-STAPPER-UNISEX-SVART',
  barcode: '07090062980108',
  price: '249',
  compareAtPrice: null,
  inventoryQuantity: 10,
  availableForSale: true,
  updatedAt: '2026-09-04T10:00:00Z',
  image: null,
  selectedOptions: [],
  weight: 0.2,
  weightUnit: 'kg',
  customLabel0: null,
  customLabel1: null,
  customLabel2: null,
  customLabel3: null,
  customLabel4: null
}

const product: CatalogSyncProduct = {
  id: 'gid://shopify/Product/1',
  title: 'Utekos Stapper™',
  handle: 'utekos-stapper',
  productType: 'Tilbehør',
  descriptionHtml: '<p>Stapper</p>',
  vendor: 'Utekos',
  status: 'ACTIVE',
  updatedAt: '2026-09-04T10:00:00Z',
  featuredImage: null,
  images: [],
  variants: { edges: [{ node: variant }] }
}

test('deletes Stapper even when the Shopify variant is in stock', () => {
  assert.equal(
    getMetaCatalogOfferDisposition({
      product,
      publicOptions: {
        color: 'Vargnatt',
        size: 'OneSize',
        gender: 'Unisex'
      },
      variant
    }),
    'delete'
  )
})
