import assert from 'node:assert/strict'
import test from 'node:test'

import type { CatalogSyncProduct } from '@/lib/catalog-sync/types'

import {
  buildOpenAiAdsProductFeed,
  OPENAI_ADS_PRODUCT_FEED_COLUMNS
} from './buildOpenAiAdsProductFeed'

const product: CatalogSyncProduct = {
  id: 'gid://shopify/Product/100',
  title: 'Utekos TechDown™',
  handle: 'utekos-techdown',
  productType: 'Uteklær',
  descriptionHtml:
    '<p>Shopify-tekst skal ikke overstyre presentasjonskontrakten.</p>',
  vendor: 'Utekos',
  status: 'ACTIVE',
  updatedAt: '2026-09-15T08:00:00Z',
  featuredImage: { url: 'https://cdn.shopify.com/featured.jpg' },
  images: [{ url: 'https://cdn.shopify.com/featured.jpg' }],
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
          updatedAt: '2026-09-15T08:30:00Z',
          image: { url: 'https://cdn.shopify.com/variant.jpg' },
          selectedOptions: [
            { name: 'Farge', value: 'Havdyp' },
            { name: 'Størrelse', value: 'Stor' },
            { name: 'Kjønn', value: 'Unisex' }
          ],
          weight: null,
          weightUnit: 'kg',
          customLabel0: { value: 'Bestselger, helårs' },
          customLabel1: null,
          customLabel2: null,
          customLabel3: null,
          customLabel4: null
        }
      }
    ]
  }
}

function parseCsvLine(line: string) {
  const values: string[] = []
  let value = ''
  let quoted = false

  for (let index = 0; index < line.length; index += 1) {
    const character = line[index]
    if (character === '"' && quoted && line[index + 1] === '"') {
      value += '"'
      index += 1
    } else if (character === '"') {
      quoted = !quoted
    } else if (character === ',' && !quoted) {
      values.push(value)
      value = ''
    } else {
      value += character
    }
  }

  values.push(value)
  return values
}

test('builds a rich OpenAI Ads CSV from the curated Utekos variant', () => {
  const feed = buildOpenAiAdsProductFeed([product])
  const lines = feed.trimEnd().split('\r\n')
  const columns = parseCsvLine(lines[0] ?? '')
  const values = parseCsvLine(lines[1] ?? '')
  const row = Object.fromEntries(
    columns.map((column, index) => [column, values[index] ?? ''])
  )

  assert.deepEqual(columns, [...OPENAI_ADS_PRODUCT_FEED_COLUMNS])
  assert.equal(lines.length, 2)
  assert.equal(row.item_id, '200')
  assert.equal(row.group_id, '100')
  assert.equal(row.offer_id, '200')
  assert.equal(row.listing_has_variations, 'true')
  assert.deepEqual(JSON.parse(row.variant_dict ?? '{}'), {
    Farge: 'Havdyp',
    Størrelse: 'Stor',
    Kjønn: 'Unisex'
  })
  assert.equal(
    row.title,
    'Utekos TechDown™ / Havdyp / Stor / Unisex'
  )
  assert.match(row.description ?? '', /CloudWeave™-isolasjon/)
  assert.match(
    row.url ?? '',
    /^https:\/\/utekos\.no\/produkter\/utekos-techdown\?/
  )
  assert.match(row.url ?? '', /utm_source=openai/)
  assert.match(row.url ?? '', /utm_content=200/)
  assert.equal(
    row.image_url,
    'https://cdn.shopify.com/variant.jpg'
  )
  assert.equal(row.price, '1990.00 NOK')
  assert.equal(row.sale_price, '1790.00 NOK')
  assert.equal(row.availability, 'in_stock')
  assert.equal(row.gtin, '4006381333931')
  assert.equal(row.mpn, 'UTEKOS-HAV-STOR')
  assert.equal(
    row.material,
    'Luméa™-ytterstoff i nylon og syntetisk CloudWeave™-isolasjon'
  )
  assert.equal(row.google_product_category, '5598')
  assert.equal(
    row.return_policy,
    'https://utekos.no/frakt-og-retur'
  )
  assert.equal(row.target_countries, 'NO')
  assert.equal(row.custom_label_0, 'Bestselger, helårs')
  assert.equal(row.is_eligible_search, 'true')
  assert.equal(row.is_eligible_checkout, 'false')
  assert.equal(row.is_ads_eligible, 'true')
  assert.ok(feed.endsWith('\r\n'))
})

test('is deterministic and fails closed without active publishable offers', () => {
  const second = {
    ...product,
    id: 'gid://shopify/Product/101',
    variants: {
      edges: [
        {
          node: {
            ...product.variants.edges[0]!.node,
            id: 'gid://shopify/ProductVariant/199'
          }
        }
      ]
    }
  }

  assert.equal(
    buildOpenAiAdsProductFeed([product, second]),
    buildOpenAiAdsProductFeed([second, product])
  )
  assert.throws(
    () =>
      buildOpenAiAdsProductFeed([
        { ...product, status: 'DRAFT' }
      ]),
    /contains no active offers/
  )
})

test('fails closed on invalid public media and price data', () => {
  const baseVariant = product.variants.edges[0]!.node

  assert.throws(
    () =>
      buildOpenAiAdsProductFeed([
        {
          ...product,
          featuredImage: null,
          variants: {
            edges: [{ node: { ...baseVariant, image: null } }]
          }
        }
      ]),
    /missing a public image URL/
  )
  assert.throws(
    () =>
      buildOpenAiAdsProductFeed([
        {
          ...product,
          variants: {
            edges: [
              { node: { ...baseVariant, price: 'gratis' } }
            ]
          }
        }
      ]),
    /invalid price/
  )
})
