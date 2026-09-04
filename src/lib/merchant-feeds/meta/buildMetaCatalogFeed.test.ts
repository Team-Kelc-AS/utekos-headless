import assert from 'node:assert/strict'
import test from 'node:test'

import type { CatalogSyncProduct } from '@/lib/catalog-sync/types'

import {
  buildMetaCatalogFeed,
  buildMetaCatalogFeedDocument,
  META_CATALOG_FEED_COLUMNS
} from './buildMetaCatalogFeed'

const product: CatalogSyncProduct = {
  id: 'gid://shopify/Product/100',
  title: 'Shopify title that must not be used',
  handle: 'utekos-techdown',
  productType: 'Uteklær',
  descriptionHtml:
    '<p>Shopify description that must not be used.</p>',
  vendor: 'Utekos',
  status: 'ACTIVE',
  updatedAt: '2026-08-23T08:00:00Z',
  featuredImage: {
    url: 'https://cdn.shopify.com/s/files/techdown.jpg?v=1'
  },
  images: [
    {
      url: 'https://cdn.shopify.com/s/files/additional.jpg?v=3'
    }
  ],
  variants: {
    edges: [
      {
        node: {
          id: 'gid://shopify/ProductVariant/200',
          title: 'Havdyp / Middels',
          sku: 'UTEKOS-HAV-MIDDELS',
          barcode: '4006381333931',
          price: '1790',
          compareAtPrice: '1990',
          inventoryQuantity: 4,
          availableForSale: true,
          updatedAt: '2026-08-23T09:00:00Z',
          image: {
            url: 'https://cdn.shopify.com/s/files/variant,medium.png?v=2'
          },
          selectedOptions: [
            { name: 'Farge', value: 'Havdyp' },
            { name: 'Størrelse', value: 'Medium' },
            { name: 'Kjønn', value: 'Unisex' }
          ],
          weight: 1.3,
          weightUnit: 'kg',
          customLabel0: null,
          customLabel1: null,
          customLabel2: null,
          customLabel3: null,
          customLabel4: null
        }
      },
      {
        node: {
          id: 'gid://shopify/ProductVariant/201',
          title: 'Havdyp / Stor',
          sku: 'UTEKOS-HAV-STOR',
          barcode: '4006381333931',
          price: '1790',
          compareAtPrice: null,
          inventoryQuantity: 0,
          availableForSale: false,
          updatedAt: '2026-08-23T10:00:00Z',
          image: null,
          selectedOptions: [
            { name: 'Farge', value: 'Havdyp' },
            { name: 'Størrelse', value: 'Large' },
            { name: 'Kjønn', value: 'Unisex' }
          ],
          weight: 1.5,
          weightUnit: 'kg',
          customLabel0: null,
          customLabel1: null,
          customLabel2: null,
          customLabel3: null,
          customLabel4: null
        }
      }
    ]
  }
}

function parseFeedRows(feed: string) {
  const lines = feed.trimEnd().split('\r\n')
  const columns = lines[0]?.split('\t') ?? []

  return lines.slice(1).map(line => {
    const values = line.split('\t')

    return Object.fromEntries(
      columns.map((column, index) => [
        column,
        values[index] ?? ''
      ])
    )
  })
}

test('publishes only in-stock variants with complete Meta fields', () => {
  const feed = buildMetaCatalogFeed([product])
  const rows = parseFeedRows(feed)

  assert.equal(
    feed.split('\r\n')[0],
    META_CATALOG_FEED_COLUMNS.join('\t')
  )
  assert.equal(rows.length, 1)
  assert.deepEqual(
    rows.map(row => row.id),
    ['200']
  )
  assert.ok(rows.every(row => row.item_group_id === '100'))
  assert.equal(rows[0]?.availability, 'in stock')
  assert.equal(rows[0]?.price, '1990.00 NOK')
  assert.equal(rows[0]?.sale_price, '1790.00 NOK')
  assert.equal(
    rows[0]?.title,
    'Utekos TechDown™ Havdyp - Middels'
  )
  assert.equal(rows[0]?.gtin, '4006381333931')
  assert.equal(rows[0]?.google_product_category, '203')
  assert.equal(rows[0]?.fb_product_category, '528')
  assert.equal(rows[0]?.brand, 'Utekos')
  assert.equal(rows[0]?.color, 'Havdyp')
  assert.equal(rows[0]?.size, 'Middels')
  assert.equal(rows[0]?.gender, 'unisex')
  assert.match(rows[0]?.image_link ?? '', /TechDown-Havdyp-Master\.png/)
  assert.equal(rows[0]?.shipping, 'NO::1-4 days:0.00 NOK')
  assert.equal(rows[0]?.shipping_weight, '1.3 kg')
  assert.match(rows[0]?.internal_label ?? '', /catalog_active/)
  assert.equal(rows[0]?.mpn, 'UTEKOS-HAV-MIDDELS')
  assert.match(
    rows[0]?.link ?? '',
    /^https:\/\/utekos\.no\/produkter\/utekos-techdown\?/
  )
  assert.match(rows[0]?.link ?? '', /farge=havdyp/)
  assert.match(rows[0]?.link ?? '', /storrelse=middels/)
  assert.doesNotMatch(rows[0]?.link ?? '', /kasse\.utekos\.no/)
  assert.ok(feed.endsWith('\r\n'))
})

test('uses the newest included Shopify variant for Last-Modified', () => {
  const document = buildMetaCatalogFeedDocument([product])

  assert.equal(document.offerCount, 1)
  assert.equal(
    document.lastModified,
    'Sun, 23 Aug 2026 09:00:00 GMT'
  )
})

test('fails closed when no active public variants remain', () => {
  assert.throws(
    () =>
      buildMetaCatalogFeed([
        { ...product, status: 'DRAFT' }
      ]),
    /contains no active in-stock offers/
  )
})
