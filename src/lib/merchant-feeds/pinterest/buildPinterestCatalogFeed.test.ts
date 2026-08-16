import assert from 'node:assert/strict'
import test from 'node:test'

import type { CatalogSyncProduct } from '@/lib/catalog-sync/types'

import {
  buildPinterestCatalogFeed,
  buildPinterestCatalogFeedDocument,
  PINTEREST_CATALOG_FEED_COLUMNS
} from './buildPinterestCatalogFeed'
import { PINTEREST_CATALOG_FEED_URL } from './pinterestCatalogFeedUrl'
import {
  PINTEREST_FEED_CREATE_REQUEST,
  PINTEREST_FEED_FORMAT
} from './pinterestCatalogRegistration'

const product: CatalogSyncProduct = {
  id: 'gid://shopify/Product/100',
  title: 'Utekos TechDown™',
  handle: 'utekos-techdown',
  productType: 'Uteklær',
  descriptionHtml:
    '<p>Varm &amp; lett\nfor terrasse\tog tur.</p>',
  vendor: 'Utekos',
  status: 'ACTIVE',
  updatedAt: '2026-08-15T08:00:00Z',
  featuredImage: { url: 'https://cdn.shopify.com/featured.jpg' },
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
          updatedAt: '2026-08-15T08:00:00Z',
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
          updatedAt: '2026-08-15T09:00:00Z',
          image: { url: 'https://cdn.shopify.com/variant.jpg' },
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
      },
      {
        node: {
          id: 'gid://shopify/ProductVariant/202',
          title: 'Havdyp / Middels',
          sku: 'UTEKOS-HAV-MIDDELS',
          barcode: null,
          price: '998.99',
          compareAtPrice: null,
          inventoryQuantity: 0,
          availableForSale: false,
          updatedAt: '2026-08-15T10:00:00Z',
          image: { url: 'https://cdn.shopify.com/medium.jpg' },
          selectedOptions: [
            { name: 'Farge', value: 'Havdyp' },
            { name: 'Størrelse', value: 'Middels' },
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
      columns.map((column, index) => [
        column,
        values[index] ?? ''
      ])
    )
  })
}

test('builds a Pinterest TSV from the Utekos presentation contract', () => {
  const feed = buildPinterestCatalogFeed([product])
  const rows = parseFeedRows(feed)
  const inStockRow = rows.find(row => row.id === '200')
  const outOfStockRow = rows.find(row => row.id === '202')

  assert.equal(
    feed.split('\r\n')[0],
    PINTEREST_CATALOG_FEED_COLUMNS.join('\t')
  )
  assert.equal(rows.length, 2)
  assert.equal(
    inStockRow?.title,
    'Utekos TechDown™ / Havdyp / Stor / Unisex'
  )
  assert.equal(
    inStockRow?.description,
    'Utekos TechDown™ er et varmt og allsidig 3-i-1-plagg med Luméa™-ytterstoff og CloudWeave™-isolasjon for terrasse, hytte, båt og bobil.'
  )
  assert.equal(
    inStockRow?.link,
    'https://utekos.no/produkter/utekos-techdown?farge=havdyp&storrelse=stor&kjonn=unisex'
  )
  assert.equal(
    inStockRow?.ad_link,
    'https://utekos.no/produkter/utekos-techdown?farge=havdyp&storrelse=stor&kjonn=unisex&utm_source=pinterest&utm_medium=shopping&utm_campaign=pinterest_catalog&utm_content=200'
  )
  assert.equal(inStockRow?.price, '1990.00 NOK')
  assert.equal(inStockRow?.sale_price, '1790.00 NOK')
  assert.equal(inStockRow?.availability, 'in stock')
  assert.equal(inStockRow?.gtin, '4006381333931')
  assert.equal(inStockRow?.mpn, 'UTEKOS-HAV-STOR')
  assert.equal(inStockRow?.item_group_id, '100')
  assert.equal(inStockRow?.google_product_category, '203')
  assert.equal(
    inStockRow?.product_type,
    'Apparel & Accessories > Clothing > Outerwear'
  )
  assert.equal(inStockRow?.color, 'Havdyp')
  assert.equal(inStockRow?.size, 'Stor')
  assert.equal(inStockRow?.gender, 'unisex')
  assert.equal(inStockRow?.age_group, 'adult')
  assert.equal(inStockRow?.adult, 'false')
  assert.equal(inStockRow?.material, 'Nylon')
  assert.equal(inStockRow?.size_system, 'NO')
  assert.equal(inStockRow?.variant_names, 'Color,Size,Gender')
  assert.equal(inStockRow?.variant_values, 'Havdyp,Stor,unisex')
  assert.equal(inStockRow?.custom_label_0, 'Bestselger')
  assert.equal(inStockRow?.custom_label_1, 'sale')
  assert.equal(inStockRow?.custom_label_2, 'utekos-techdown')
  assert.equal(inStockRow?.shipping, 'NO:::0.00 NOK')
  assert.equal(inStockRow?.free_shipping_label, 'true')
  assert.equal(inStockRow?.free_shipping_limit, '0')
  assert.equal(inStockRow?.condition, 'new')
  assert.equal(inStockRow?.brand, 'Utekos')
  assert.equal(
    inStockRow?.image_link,
    'https://utekos.no/Utekos-TechDown-Maritime-Blue-Unisex/Utekos-TechDown-Maritime-Blue-Unisex.png'
  )
  assert.equal(
    inStockRow?.additional_image_link,
    [
      'Utekos-TechDown-Zipper-Closeup.png',
      'Utekos-TechDown-Maritime-Blue-Zipper-Detail.png',
      'Utekos-TechDown-Maritime-Blue-Zipper-Detail-Orange-Bg.png',
      'Utekos-TechDown-Maritime-Blue-Post-Bonfire.png',
      'Utekos-TechDown-Maritime-Blue-Medium-Unisex-Full-Body.png',
      'Utekos-TechDown-Maritime-Blue-Medium-Unisex-1.png',
      'Utekos-TechDown-Maritime-Blue-Folded-Front.png',
      'Utekos-TechDown-Maritime-Blue-Coast-House-Relax.png',
      'Utekos-TechDown-Maritime-Blue-Close.png',
      'Utekos-TechDown-Maritime-Blue-Close-Folded-Back.png'
    ]
      .map(
        fileName =>
          `https://utekos.no/Utekos-TechDown-Maritime-Blue-Unisex/${fileName}`
      )
      .join(',')
  )
  assert.doesNotMatch(
    inStockRow?.image_link ?? '',
    /cdn\.shopify\.com/
  )
  assert.equal(outOfStockRow?.availability, 'out of stock')
  assert.equal(outOfStockRow?.custom_label_1, 'full_price')
  assert.equal(outOfStockRow?.shipping, 'NO:::99.00 NOK')
  assert.equal(outOfStockRow?.free_shipping_label, 'false')
  assert.equal(outOfStockRow?.free_shipping_limit, '999.00 NOK')
  assert.equal(
    rows.some(row => row.id === '201'),
    false
  )
  assert.ok(feed.endsWith('\r\n'))
})

test('uses the latest included Shopify update as feed Last-Modified', () => {
  const document = buildPinterestCatalogFeedDocument([product])

  assert.equal(
    document.lastModified,
    'Sat, 15 Aug 2026 10:00:00 GMT'
  )
})

test('sends dedicated Mikrofiber Patriot Blue images and excludes Vargnatt', () => {
  const feed = buildPinterestCatalogFeed([
    {
      ...product,
      handle: 'utekos-mikrofiber',
      variants: {
        edges: [
          {
            node: {
              ...product.variants.edges[0]!.node,
              id: 'gid://shopify/ProductVariant/303',
              selectedOptions: [
                { name: 'Farge', value: 'Fjellblå' },
                { name: 'Størrelse', value: 'Medium' },
                { name: 'Kjønn', value: 'Unisex' }
              ]
            }
          },
          {
            node: {
              ...product.variants.edges[0]!.node,
              id: 'gid://shopify/ProductVariant/304',
              selectedOptions: [
                { name: 'Farge', value: 'Vargnatt' },
                { name: 'Størrelse', value: 'Medium' },
                { name: 'Kjønn', value: 'Unisex' }
              ]
            }
          }
        ]
      }
    }
  ])
  const rows = parseFeedRows(feed)

  assert.equal(rows.length, 1)
  assert.equal(rows[0]?.id, '303')
  assert.equal(
    rows[0]?.image_link,
    'https://utekos.no/Utekos-TechDown-Maritime-Blue-Unisex/Utekos-Mikrofiber-Patriot-Blue-Unisex..png'
  )
  assert.match(
    rows[0]?.additional_image_link ?? '',
    /Utekos-Mikrofiber-Lifestyle-Woods\.png/
  )
})

test('excludes Utekos Dun from the Pinterest catalog', () => {
  assert.throws(
    () =>
      buildPinterestCatalogFeed([
        {
          ...product,
          handle: 'utekos-dun',
          variants: {
            edges: [
              {
                node: {
                  ...product.variants.edges[0]!.node,
                  selectedOptions: [
                    { name: 'Farge', value: 'Havdyp' },
                    { name: 'Størrelse', value: 'Medium' },
                    { name: 'Kjønn', value: 'Unisex' }
                  ]
                }
              }
            ]
          }
        }
      ]),
    /contains no active offers/
  )
})

test('fails closed when there are no active product offers', () => {
  assert.throws(
    () =>
      buildPinterestCatalogFeed([
        { ...product, status: 'DRAFT' }
      ]),
    /contains no active offers/
  )
})

test('points Pinterest feed registration at the hosted TSV location', () => {
  assert.equal(
    PINTEREST_CATALOG_FEED_URL,
    'https://utekos.no/pinterest-catalog.tsv'
  )
  assert.equal(
    PINTEREST_FEED_CREATE_REQUEST.format,
    PINTEREST_FEED_FORMAT
  )
  assert.equal(
    PINTEREST_FEED_CREATE_REQUEST.location,
    PINTEREST_CATALOG_FEED_URL
  )
  assert.equal(
    PINTEREST_FEED_CREATE_REQUEST.default_country,
    'NO'
  )
  assert.equal(
    PINTEREST_FEED_CREATE_REQUEST.default_currency,
    'NOK'
  )
  assert.equal(
    PINTEREST_FEED_CREATE_REQUEST.default_locale,
    'nb-NO'
  )
})
