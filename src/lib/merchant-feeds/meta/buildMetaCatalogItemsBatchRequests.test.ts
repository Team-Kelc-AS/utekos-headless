import assert from 'node:assert/strict'
import test from 'node:test'

import { buildMetaCatalogItemsBatchRequests } from './buildMetaCatalogItemsBatchRequests'
import type { MetaCatalogOffer } from './metaCatalogOffer'

const offer: MetaCatalogOffer = {
  id: '200',
  itemGroupId: '100',
  title: 'Utekos TechDown™ Havdyp - Stor',
  description: 'En presis produktbeskrivelse.',
  richTextDescription: '<p>En presis produktbeskrivelse.</p>',
  shortDescription: 'En presis produktbeskrivelse.',
  availability: 'in stock',
  visibility: 'published',
  condition: 'new',
  price: '1990.00 NOK',
  salePrice: '1790.00 NOK',
  link: 'https://utekos.no/produkter/utekos-techdown?farge=havdyp&storrelse=stor',
  images: [
    {
      url: 'https://cdn.shopify.com/s/files/techdown.png',
      tags: ['primary', 'family_utekos_techdown']
    }
  ],
  videos: [],
  brand: 'Utekos',
  googleProductCategory: '5598',
  facebookProductCategory: '528',
  productType: 'Apparel & Accessories > Clothing > Outerwear',
  gtin: '4006381333931',
  mpn: 'UTEKOS-HAV-STOR',
  color: 'Havdyp',
  size: 'Stor',
  gender: 'unisex',
  ageGroup: 'adult',
  material: 'Nylon og TechDown™-isolasjon',
  shipping: {
    country: 'NO',
    price: '0.00 NOK',
    service: '1-4 days'
  },
  shippingWeightValue: 1.5,
  shippingWeightUnit: 'kg',
  internalLabels: ['utekos', 'catalog_active'],
  customLabels: [
    'Utekos TechDown™',
    'Havdyp',
    'Stor',
    'sale',
    'core_assortment'
  ],
  inventoryQuantity: 4,
  orderingIndex: 1,
  updatedAtMs: Date.parse('2026-09-04T10:00:00Z')
}

test('builds a v26 items_batch UPDATE with documented product fields', () => {
  const [request] = buildMetaCatalogItemsBatchRequests([offer])

  assert.equal(request?.method, 'UPDATE')
  assert.deepEqual(request?.data, {
    id: '200',
    title: 'Utekos TechDown™ Havdyp - Stor',
    description: 'En presis produktbeskrivelse.',
    rich_text_description: '<p>En presis produktbeskrivelse.</p>',
    short_description: 'En presis produktbeskrivelse.',
    availability: 'in stock',
    visibility: 'published',
    condition: 'new',
    price: '1990.00 NOK',
    sale_price: '1790.00 NOK',
    link: 'https://utekos.no/produkter/utekos-techdown?farge=havdyp&storrelse=stor',
    image: [
      {
        url: 'https://cdn.shopify.com/s/files/techdown.png',
        tag: ['primary', 'family_utekos_techdown']
      }
    ],
    brand: 'Utekos',
    item_group_id: '100',
    google_product_category: '5598',
    fb_product_category: '528',
    product_type: 'Apparel & Accessories > Clothing > Outerwear',
    gtin: '4006381333931',
    mpn: 'UTEKOS-HAV-STOR',
    color: 'Havdyp',
    size: 'Stor',
    gender: 'unisex',
    age_group: 'adult',
    material: 'Nylon og TechDown™-isolasjon',
    shipping: [
      {
        shipping_country: 'NO',
        shipping_region: '',
        shipping_service: '1-4 days',
        shipping_price_value: '0.00',
        shipping_price_currency: 'NOK'
      }
    ],
    shipping_weight: '1.5 kg',
    internal_label: ['utekos', 'catalog_active'],
    custom_label_0: 'Utekos TechDown™',
    custom_label_1: 'Havdyp',
    custom_label_2: 'Stor',
    custom_label_3: 'sale',
    custom_label_4: 'core_assortment',
    custom_number_0: 4,
    ordering_index: 1
  })
})

test('builds id-only DELETE requests for offers removed from desired state', () => {
  const requests = buildMetaCatalogItemsBatchRequests(
    [offer],
    ['201', '202']
  )

  assert.deepEqual(requests.slice(1), [
    { method: 'DELETE', data: { id: '201' } },
    { method: 'DELETE', data: { id: '202' } }
  ])
})

test('rejects a Shopify checkout URL at the batch schema boundary', () => {
  assert.throws(
    () =>
      buildMetaCatalogItemsBatchRequests([
        { ...offer, link: 'https://kasse.utekos.no/products/techdown' }
      ]),
    /Invalid input/
  )
})
