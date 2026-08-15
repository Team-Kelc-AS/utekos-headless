import assert from 'node:assert/strict'
import test from 'node:test'

import type { CatalogSyncProduct } from '@/lib/catalog-sync/types'

import {
  buildKlarnaFeed,
  buildKlarnaFeedDocument,
  KLARNA_FEED_DELIVERY_TIME,
  KLARNA_FEED_PAID_SHIPPING
} from './buildKlarnaFeed'

const product: CatalogSyncProduct = {
  id: 'gid://shopify/Product/100',
  title: 'Utekos TechDown™',
  handle: 'utekos-techdown',
  productType: 'Uteklær',
  descriptionHtml:
    '<p>Varm &amp; lett\nfor terrasse\tog tur.</p>',
  vendor: 'Utekos',
  status: 'ACTIVE',
  updatedAt: '2026-08-14T12:00:00Z',
  featuredImage: {
    url: 'https://cdn.shopify.com/featured.jpg?v=1785855277'
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
          updatedAt: '2026-08-15T08:30:00Z',
          image: null,
          selectedOptions: [
            { name: 'Farge', value: 'Havdyp' },
            { name: 'Størrelse', value: 'Stor' }
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
          barcode: '4006381333932',
          price: '1790.00',
          compareAtPrice: null,
          inventoryQuantity: 0,
          availableForSale: false,
          updatedAt: '2026-08-15T09:00:00Z',
          image: { url: 'https://cdn.shopify.com/variant.jpg' },
          selectedOptions: [
            { name: 'Farge', value: 'Havdyp' },
            { name: 'Størrelse', value: 'Liten' }
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
          title: 'Havdyp / Medium',
          sku: 'UTEKOS-HAV-MEDIUM',
          barcode: null,
          price: '1790.00',
          compareAtPrice: null,
          inventoryQuantity: 2,
          availableForSale: true,
          updatedAt: '2026-08-15T10:00:00Z',
          image: null,
          selectedOptions: [
            { name: 'Farge', value: 'Havdyp' },
            { name: 'Størrelse', value: 'Medium' }
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

test('builds Klarna XML with only purchasable GTIN offers and headless URLs', () => {
  const feed = buildKlarnaFeed([product])

  assert.match(
    feed,
    /^<\?xml version="1\.0" encoding="UTF-8"\?>/
  )
  assert.match(feed, /<products>/)
  assert.match(feed, /<sku>UTEKOS-HAV-STOR<\/sku>/)
  assert.match(
    feed,
    /<name>Utekos TechDown™, Havdyp, Stor<\/name>/
  )
  assert.match(feed, /<price>1990\.00 NOK<\/price>/)
  assert.match(feed, /<sale_price>1790\.00 NOK<\/sale_price>/)
  assert.match(feed, /<shipping>0 NOK<\/shipping>/)
  assert.match(feed, /<stock_status>InStock<\/stock_status>/)
  assert.match(
    feed,
    new RegExp(
      `<delivery_time>${KLARNA_FEED_DELIVERY_TIME}</delivery_time>`
    )
  )
  assert.match(feed, /<ean>4006381333931<\/ean>/)
  assert.match(feed, /<Brand>Utekos<\/Brand>/)
  assert.match(feed, /<manufacturer>Utekos<\/manufacturer>/)
  assert.match(feed, /<condition>New<\/condition>/)
  assert.match(feed, /<mpn>UTEKOS-HAV-STOR<\/mpn>/)
  assert.match(
    feed,
    /<url>https:\/\/utekos\.no\/produkter\/utekos-techdown\?variant=gid%3A%2F%2Fshopify%2FProductVariant%2F200&amp;utm_source=klarna&amp;utm_medium=shopping&amp;utm_campaign=klarna_search_compare&amp;utm_content=UTEKOS-HAV-STOR<\/url>/
  )
  assert.match(
    feed,
    /<image_url>https:\/\/utekos\.no\/Utekos-TechDown-Maritime-Blue-Unisex-Full-Mode\.jpg<\/image_url>/
  )
  assert.match(
    feed,
    /<additional_image_url_1>https:\/\/utekos\.no\/Utekos-TechDown-Maritime-Blue-Medium-Unisex\.jpg<\/additional_image_url_1>/
  )
  assert.match(
    feed,
    /<additional_image_url_2>https:\/\/utekos\.no\/Utekos-TechDown-Maritime-Blue-XL-Unisex\.jpg<\/additional_image_url_2>/
  )
  assert.match(
    feed,
    /<additional_image_url_3>https:\/\/utekos\.no\/Utekos-TechDown-Maritime-Blue-Unisex-Folded-Back-View\.jpg<\/additional_image_url_3>/
  )
  assert.match(
    feed,
    /<category>Klær &gt; Unisex &gt; Yttertøy<\/category>/
  )
  assert.match(
    feed,
    /<description>Varm &amp; lett for terrasse og tur\.<\/description>/
  )
  assert.match(feed, /<color>Havdyp<\/color>/)
  assert.match(feed, /<size>Stor<\/size>/)
  assert.match(feed, /<gender>unisex<\/gender>/)
  assert.match(feed, /<group_id>100<\/group_id>/)
  assert.match(feed, /<size_system>NO<\/size_system>/)
  assert.doesNotMatch(feed, /UTEKOS-HAV-LITEN/)
  assert.doesNotMatch(feed, /UTEKOS-HAV-MEDIUM/)
  assert.doesNotMatch(feed, /kasse\.utekos\.no/)
  assert.ok(feed.endsWith('\n'))
})

test('uses stable variant-specific public images for known Klarna offers', () => {
  const cases = [
    {
      handle: 'comfyrobe',
      title: 'Comfyrobe™',
      sku: 'COMFYROBE-FJELLNATT-S',
      size: 'XS',
      expectedImage: 'Comfyrobe-Fjellnatt-XS-Unisex.jpg'
    },
    {
      handle: 'comfyrobe',
      title: 'Comfyrobe™',
      sku: 'COMFYROBE-FJELLNATT-L',
      size: 'XL',
      expectedImage: 'Comfyrobe-Fjellnatt-XL-Unisex.jpg'
    },
    {
      handle: 'utekos-techdown',
      title: 'Utekos TechDown™',
      sku: 'TECHDOWN-HAVDYP-M',
      size: 'Middels',
      expectedImage:
        'Utekos-TechDown-Maritime-Blue-Medium-Unisex.jpg'
    },
    {
      handle: 'utekos-techdown',
      title: 'Utekos TechDown™',
      sku: 'TECHDOWN-HAVDYP-XL',
      size: 'Ekstra stor',
      expectedImage:
        'Utekos-TechDown-Maritime-Blue-XL-Unisex.jpg'
    },
    {
      handle: 'utekos-mikrofiber',
      title: 'Utekos Mikrofiber',
      sku: 'UTEKOS-MIKRO-M-BLUE',
      size: 'Medium',
      expectedImage:
        'Utekos-Mikrofiber-Patriot-Blue-Unisex-Parkas-Mode.jpg'
    },
    {
      handle: 'utekos-mikrofiber',
      title: 'Utekos Mikrofiber',
      sku: 'UTEKOS-MIKRO-L-BLUE',
      size: 'Large',
      expectedImage:
        'Utekos-Mikrofiber-Patriot-Blue-Unisex-Parkas-Mode.jpg'
    }
  ] as const

  for (const imageCase of cases) {
    const feed = buildKlarnaFeed([
      {
        ...product,
        handle: imageCase.handle,
        title: imageCase.title,
        variants: {
          edges: [
            {
              node: {
                ...product.variants.edges[0]!.node,
                sku: imageCase.sku,
                selectedOptions: [
                  { name: 'Farge', value: 'Fjellnatt' },
                  { name: 'Størrelse', value: imageCase.size }
                ]
              }
            }
          ]
        }
      }
    ])

    assert.match(
      feed,
      new RegExp(
        `<image_url>https://utekos\\.no/${imageCase.expectedImage}</image_url>`
      )
    )

    const imageUrls = [
      ...feed.matchAll(
        /<(?:image_url|additional_image_url_[1-3])>([^<]+)<\/(?:image_url|additional_image_url_[1-3])>/g
      )
    ].map(match => match[1])

    assert.equal(imageUrls.length, 4)
    assert.equal(new Set(imageUrls).size, 4)
  }
})

test('excludes Stapper from the Klarna assortment', () => {
  const feed = buildKlarnaFeed([
    product,
    {
      ...product,
      id: 'gid://shopify/Product/300',
      handle: 'utekos-stapper',
      title: 'Utekos Stapper',
      variants: {
        edges: [
          {
            node: {
              ...product.variants.edges[0]!.node,
              id: 'gid://shopify/ProductVariant/301',
              sku: 'UTEKOS-STAPPER-UNISEX-SVART'
            }
          }
        ]
      }
    }
  ])

  assert.doesNotMatch(feed, /UTEKOS-STAPPER-UNISEX-SVART/)
})

test('fails closed when an included offer has fewer than four unique images', () => {
  assert.throws(
    () =>
      buildKlarnaFeed([
        {
          ...product,
          handle: 'utekos-dun',
          variants: {
            edges: [
              {
                node: {
                  ...product.variants.edges[0]!.node,
                  image: null
                }
              }
            ]
          }
        }
      ]),
    /requires 4 unique image URLs, found 2/
  )
})

test('uses paid shipping below the free-shipping threshold', () => {
  const feed = buildKlarnaFeed([
    {
      ...product,
      variants: {
        edges: [
          {
            node: {
              ...product.variants.edges[0]!.node,
              price: '998.99',
              compareAtPrice: null
            }
          }
        ]
      }
    }
  ])

  assert.match(
    feed,
    new RegExp(
      `<shipping>${KLARNA_FEED_PAID_SHIPPING}</shipping>`
    )
  )
})

test('uses the latest included Shopify update as feed Last-Modified', () => {
  const document = buildKlarnaFeedDocument([product])

  assert.equal(
    document.lastModified,
    'Sat, 15 Aug 2026 08:30:00 GMT'
  )
})

test('fails closed when no purchasable GTIN offers exist', () => {
  assert.throws(
    () =>
      buildKlarnaFeed([
        {
          ...product,
          variants: {
            edges: product.variants.edges.filter(
              edge =>
                !edge.node.availableForSale || !edge.node.barcode
            )
          }
        }
      ]),
    /no purchasable offers with valid GTIN/
  )
})
