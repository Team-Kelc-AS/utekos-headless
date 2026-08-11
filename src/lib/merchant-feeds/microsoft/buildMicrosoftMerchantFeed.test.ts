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

function createProduct(
  handle: string,
  title: string,
  variants: Array<{
    id: string
    color: string
  }>
): CatalogSyncProduct {
  return {
    ...product,
    id: `gid://shopify/Product/${handle}`,
    handle,
    title,
    variants: {
      edges: variants.map(({ id, color }) => ({
        node: {
          ...product.variants.edges[0]!.node,
          id: `gid://shopify/ProductVariant/${id}`,
          selectedOptions: [
            { name: 'Farge', value: color },
            {
              name: 'Størrelse',
              value:
                handle === 'utekos-techdown' ? 'Middels'
                : handle === 'comfyrobe' ? 'M'
                : 'Medium'
            },
            { name: 'Kjønn', value: 'Unisex' }
          ]
        }
      }))
    }
  }
}

test('builds a Microsoft Merchant TSV from the Utekos presentation contract', () => {
  const feed = buildMicrosoftMerchantFeed([product])
  const rows = parseFeedRows(feed)

  assert.equal(
    feed.split('\r\n')[0],
    MICROSOFT_MERCHANT_FEED_COLUMNS.join('\t')
  )
  assert.equal(rows.length, 1)
  assert.equal(rows[0]?.id, '200')
  assert.equal(
    rows[0]?.title,
    'Utekos TechDown™ / Havdyp / Stor / Unisex'
  )
  assert.equal(
    rows[0]?.description,
    'Utekos TechDown™ er et varmt og allsidig 3-i-1-plagg med Luméa™-ytterstoff og CloudWeave™-isolasjon for terrasse, hytte, båt og bobil.'
  )
  assert.equal(
    rows[0]?.link,
    'https://utekos.no/produkter/utekos-techdown?farge=havdyp&storrelse=stor&kjonn=unisex'
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
  assert.equal(
    rows[0]?.material,
    'Luméa™-ytterstoff i nylon og syntetisk CloudWeave™-isolasjon'
  )
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

test('includes only the approved Microsoft Merchant assortment', () => {
  const feed = buildMicrosoftMerchantFeed([
    createProduct('utekos-dun', 'Utekos Dun', [
      { id: '301', color: 'Fjellblå' }
    ]),
    createProduct('utekos-mikrofiber', 'Utekos Mikrofiber', [
      { id: '302', color: 'Vargnatt' },
      { id: '303', color: 'Fjellblå' }
    ]),
    createProduct('utekos-stapper', 'Utekos Stapper', [
      { id: '304', color: 'Vargnatt' }
    ]),
    createProduct('utekos-buff', 'Utekos Buff', [
      { id: '305', color: 'Fjellblå' }
    ]),
    createProduct('utekos-techdown', 'Utekos TechDown', [
      { id: '306', color: 'Havdyp' }
    ]),
    createProduct('comfyrobe', 'Comfyrobe', [
      { id: '307', color: 'Fjellnatt' }
    ])
  ])
  const rows = parseFeedRows(feed)

  assert.deepEqual(
    rows.map(row => ({
      id: row.id,
      title: row.title
    })),
    [
      {
        id: '303',
        title:
          'Utekos Mikrofiber™ / Fjellblå / Medium / Unisex'
      },
      {
        id: '306',
        title:
          'Utekos TechDown™ / Havdyp / Middels / Unisex'
      },
      {
        id: '307',
        title: 'Comfyrobe™ / Fjellnatt / M / Unisex'
      }
    ]
  )
  assert.equal(
    rows.find(row => row.id === '303')?.additional_image_link,
    ''
  )
})
