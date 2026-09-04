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
  url: offer.link,
  image_url: 'https://utekos.no/images/techdown-primary.png',
  additional_image_urls: [
    'https://utekos.no/images/techdown-additional.png'
  ],
  images: [
    {
      url: 'https://utekos.no/images/techdown-primary.png',
      tags: ['primary', 'family_utekos_techdown']
    },
    {
      url: 'https://utekos.no/images/techdown-additional.png',
      tags: ['additional', 'family_utekos_techdown']
    }
  ],
  image_fetch_status: 'FETCHED'
} satisfies MetaCatalogProductReadback

const offerWithImages = {
  ...offer,
  images: product.images
} satisfies MetaCatalogOffer

test('verifies Google category and MPN through their v26 readback names', () => {
  assert.deepEqual(
    verifyMetaCatalogProductReadback({
      deleteOfferIds: ['deleted-id'],
      offers: [offerWithImages],
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
      catalogImageCount: 2,
      missingImageTagCount: 0,
      imageFetchFailureCount: 0,
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
        offers: [offerWithImages],
        products: [{ ...product, category: null }]
      }),
    /variant-id\.category: readback mismatch/
  )
})

test('fails closed when Meta changes an image tag after ingestion', () => {
  assert.throws(
    () =>
      verifyMetaCatalogProductReadback({
        deleteOfferIds: [],
        offers: [offerWithImages],
        products: [
          {
            ...product,
            images: [
              product.images[0]!,
              {
                url: 'https://utekos.no/images/techdown-additional.png',
                tags: ['additional']
              }
            ]
          }
        ]
      }),
    /variant-id\.images: URL or tag readback mismatch/
  )
})

test('fails closed when Meta has not fetched all product images', () => {
  assert.throws(
    () =>
      verifyMetaCatalogProductReadback({
        deleteOfferIds: [],
        offers: [offerWithImages],
        products: [
          { ...product, image_fetch_status: 'PARTIAL_FETCH' }
        ]
      }),
    /variant-id\.image_fetch_status: images not fetched/
  )
})
