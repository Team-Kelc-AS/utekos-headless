import assert from 'node:assert/strict'
import test from 'node:test'

import type { CatalogSyncProduct } from '@/lib/catalog-sync/types'

import {
  buildMicrosoftMerchantFeed,
  MICROSOFT_MERCHANT_FEED_COLUMNS
} from './buildMicrosoftMerchantFeed'

const product: CatalogSyncProduct = {
  id: 'gid://shopify/Product/100',
  title: 'Utekos TechDown™',
  handle: 'utekos-techdown',
  productType: 'Uteklær',
  descriptionHtml:
    '<p>Varm &amp; lett\nfor terrasse\tog tur.</p>',
  vendor: 'Utekos',
  status: 'ACTIVE',
  featuredImage: {
    url: 'https://cdn.shopify.com/featured.jpg'
  },
  images: [
    { url: 'https://cdn.shopify.com/featured.jpg' },
    { url: 'https://cdn.shopify.com/detail,one.jpg' }
  ],
  variants: {
    edges: [
      {
        node: {
          id: 'gid://shopify/ProductVariant/200',
          title: 'Havdyp / Stor',
          sku: 'UTEKOS-HAV-STOR',
          barcode: '4006381333931',
          price: '1790',
          compareAtPrice: '1990',
          inventoryQuantity: 4,
          availableForSale: true,
          image: null,
          selectedOptions: [
            { name: 'Farge', value: 'Havdyp' },
            { name: 'Størrelse', value: 'Stor' },
            { name: 'Kjønn', value: 'Unisex' }
          ],
          weight: null,
          weightUnit: 'kg',
          customLabel0: { value: 'Bestselger' },
          customLabel1: null,
          customLabel2: null,
          customLabel3: null,
          customLabel4: null
        }
      },
      {
        node: {
          id: 'gid://shopify/ProductVariant/201',
          title: 'Havdyp / Liten',
          sku: 'UTEKOS-HAV-LITEN',
          barcode: null,
          price: '1790.00',
          compareAtPrice: null,
          inventoryQuantity: 0,
          availableForSale: false,
          image: {
            url: 'https://cdn.shopify.com/variant.jpg'
          },
          selectedOptions: [
            { name: 'Farge', value: 'Havdyp' },
            { name: 'Størrelse', value: 'Liten' },
            { name: 'Kjønn', value: 'Unisex' }
          ],
          weight: null,
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
      columns.map((column, index) => [column, values[index] ?? ''])
    )
  })
}

test('builds a Microsoft Merchant TSV with one row per variant', () => {
  const feed = buildMicrosoftMerchantFeed([product])
  const rows = parseFeedRows(feed)

  assert.equal(
    feed.split('\r\n')[0],
    MICROSOFT_MERCHANT_FEED_COLUMNS.join('\t')
  )
  assert.equal(rows.length, 2)
  assert.equal(rows[0]?.id, '200')
  assert.equal(
    rows[0]?.title,
    'Utekos TechDown™ - Havdyp / Stor / Unisex'
  )
  assert.equal(
    rows[0]?.description,
    'Varm & lett for terrasse og tur.'
  )
  assert.equal(rows[0]?.price, '1990.00 NOK')
  assert.equal(rows[0]?.sale_price, '1790.00 NOK')
  assert.equal(rows[0]?.gtin, '4006381333931')
  assert.equal(rows[0]?.mpn, 'UTEKOS-HAV-STOR')
  assert.equal(rows[0]?.identifier_exists, 'TRUE')
  assert.equal(rows[0]?.item_group_id, '100')
  assert.equal(rows[0]?.product_category, '203')
  assert.equal(rows[0]?.color, 'Havdyp')
  assert.equal(rows[0]?.size, 'Stor')
  assert.equal(rows[0]?.age_group, 'adult')
  assert.equal(rows[0]?.gender, 'unisex')
  assert.equal(rows[0]?.adult, 'FALSE')
  assert.equal(rows[0]?.custom_label_0, 'Bestselger')
  assert.equal(rows[0]?.availability, 'in stock')
  assert.equal(rows[1]?.availability, 'out of stock')
  assert.equal(rows[1]?.sale_price, '')
  assert.match(
    rows[0]?.additional_image_link ?? '',
    /detail%2Cone\.jpg/
  )
  assert.ok(feed.endsWith('\r\n'))
  assert.ok(
    feed
      .trimEnd()
      .split('\r\n')
      .every(line => !line.endsWith('\t'))
  )
})

test('fails closed when there are no active product offers', () => {
  assert.throws(
    () => buildMicrosoftMerchantFeed([{ ...product, status: 'DRAFT' }]),
    /contains no active offers/
  )
})
