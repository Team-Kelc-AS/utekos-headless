import assert from 'node:assert/strict'
import test from 'node:test'

import type { MetaCatalogOffer } from './metaCatalogOffer'
import type { MetaCatalogProductReadback } from './metaCatalogProductReadbackSchema'
import { verifyMetaCatalogProductReadback } from './verifyMetaCatalogProductReadback'

const offer = {
  id: 'variant-id',
  title: 'Utekos TechDown™ Havdyp - Stor',
  googleProductCategory: '5598',
  facebookProductCategory: '430',
  gtin: '07090062980023',
  mpn: 'TECHDOWN-HAVDYP-L',
  availability: 'in stock',
  visibility: 'published',
  link: 'https://utekos.no/produkter/utekos-techdown'
} as MetaCatalogOffer

const product = {
  id: 'meta-product-id',
  retailer_id: offer.id,
  name: offer.title,
  category: offer.googleProductCategory,
  fb_product_category: offer.facebookProductCategory,
  gtin: offer.gtin,
  manufacturer_part_number: offer.mpn,
  availability: offer.availability,
  visibility: offer.visibility,
  url: offer.link
} satisfies MetaCatalogProductReadback

test('verifies Google category and MPN through their v26 readback names', () => {
  assert.deepEqual(
    verifyMetaCatalogProductReadback({
      deleteOfferIds: ['deleted-id'],
      offers: [offer],
      products: [product]
    }),
    {
      catalogProductCount: 1,
      expectedProductCount: 1,
      missingGoogleProductCategoryCount: 0,
      missingFacebookProductCategoryCount: 0,
      missingGtinCount: 0,
      missingMpnCount: 0,
      nonPublicUrlCount: 0,
      deletedProductCount: 0,
      categories: ['5598']
    }
  )
})

test('fails closed when live Meta fields drift from the local plan', () => {
  assert.throws(
    () =>
      verifyMetaCatalogProductReadback({
        deleteOfferIds: [],
        offers: [offer],
        products: [{ ...product, category: null }]
      }),
    /variant-id\.category: readback mismatch/
  )
})
