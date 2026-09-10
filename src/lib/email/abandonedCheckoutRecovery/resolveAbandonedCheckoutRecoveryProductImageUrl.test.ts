import assert from 'node:assert/strict'
import test from 'node:test'

import {
  ABANDONED_CHECKOUT_RECOVERY_IMAGE_PATH_BY_GTIN,
  resolveAbandonedCheckoutRecoveryProductImageUrl
} from './resolveAbandonedCheckoutRecoveryProductImageUrl'

const emptySource = {
  variantId: null,
  barcode: null,
  curatedImageUrl: null,
  shopifyLineItemImageUrl: null
}

test('uses the safe curated metafield image before every fallback', () => {
  assert.equal(
    resolveAbandonedCheckoutRecoveryProductImageUrl(
      {
        variantId: 'gid://shopify/ProductVariant/1001',
        barcode: '07090062980009',
        curatedImageUrl:
          'https://cdn.shopify.com/s/files/1/curated.jpg?v=2',
        shopifyLineItemImageUrl:
          'https://cdn.shopify.com/s/files/1/line-item.jpg'
      },
      {
        variantImagePathById: {
          'gid://shopify/ProductVariant/1001':
            '/email/abandoned-checkout/variant.jpg'
        }
      }
    ),
    'https://cdn.shopify.com/s/files/1/curated.jpg?v=2'
  )
})

test('uses the fixed variant-id mapping before the GTIN and Shopify image', () => {
  assert.equal(
    resolveAbandonedCheckoutRecoveryProductImageUrl(
      {
        variantId: 'gid://shopify/ProductVariant/1001',
        barcode: '07090062980009',
        curatedImageUrl: null,
        shopifyLineItemImageUrl:
          'https://cdn.shopify.com/s/files/1/line-item.jpg'
      },
      {
        variantImagePathById: {
          'gid://shopify/ProductVariant/1001':
            '/email/abandoned-checkout/variant.jpg'
        }
      }
    ),
    'https://utekos.no/email/abandoned-checkout/variant.jpg'
  )
})

test('uses only an explicitly allowlisted existing GTIN asset', () => {
  assert.deepEqual(
    Object.keys(ABANDONED_CHECKOUT_RECOVERY_IMAGE_PATH_BY_GTIN),
    [
      '07090062980009',
      '07090062980016',
      '07090062980023',
      '07090062980030',
      '07090062980047',
      '07090062980054',
      '07090062980061',
      '07090062980078',
      '07090062980085',
      '07090062980092',
      '07090062980108',
      '07090062980115',
      '07090062980122',
      '07090062980139',
      '07090062980146'
    ]
  )
  assert.equal(
    resolveAbandonedCheckoutRecoveryProductImageUrl({
      ...emptySource,
      barcode: '07090062980009'
    }),
    'https://utekos.no/gtin/product-images/07090062980009.png'
  )
  assert.equal(
    resolveAbandonedCheckoutRecoveryProductImageUrl({
      ...emptySource,
      barcode: '07090062989999'
    }),
    null
  )
})

test('uses a safe Shopify line-item image after invalid higher-priority candidates', () => {
  assert.equal(
    resolveAbandonedCheckoutRecoveryProductImageUrl(
      {
        variantId: 'gid://shopify/ProductVariant/1001',
        barcode: '07090062980009',
        curatedImageUrl: 'https://example.com/curated.jpg',
        shopifyLineItemImageUrl:
          'https://cdn.shopify.com/s/files/1/line-item.jpg?v=4'
      },
      {
        variantImagePathById: {
          'gid://shopify/ProductVariant/1001':
            '/email/abandoned-checkout/../secret.jpg'
        },
        gtinImagePathByBarcode: {
          '07090062980009':
            '/gtin/product-images/07090062980009.png?token=secret'
        }
      }
    ),
    'https://cdn.shopify.com/s/files/1/line-item.jpg?v=4'
  )
})

test('accepts exactly the Utekos and Shopify CDN HTTPS hosts without credentials', () => {
  for (const curatedImageUrl of [
    'https://utekos.no/email/abandoned-checkout/variant.jpg',
    'https://cdn.shopify.com/s/files/1/variant.jpg'
  ]) {
    assert.equal(
      resolveAbandonedCheckoutRecoveryProductImageUrl({
        ...emptySource,
        curatedImageUrl
      }),
      curatedImageUrl
    )
  }

  for (const curatedImageUrl of [
    'http://utekos.no/email/abandoned-checkout/variant.jpg',
    'https://utekos.no/email/abandoned-checkout/variant.jpg?',
    'https://utekos.no/email/abandoned-checkout/variant.jpg?v=2',
    'https://utekos.no/email/abandoned-checkout/variant.jpg#',
    'https://utekos.no/email/abandoned-checkout/variant.jpg#fragment',
    'https://images.utekos.no/variant.jpg',
    'https://cdn.shopify.com.evil.example/variant.jpg',
    'https://cdn.shopify.com/s/files/1/variant.jpg?',
    'https://cdn.shopify.com/s/files/1/variant.jpg?token=secret',
    'https://cdn.shopify.com/s/files/1/variant.jpg#',
    'https://cdn.shopify.com/s/files/1/variant.jpg?v=2&v=3',
    'https://cdn.shopify.com/s/files/1/variant.jpg?v=release',
    'https://user:password@utekos.no/variant.jpg',
    'https://utekos.no:444/variant.jpg',
    'not-a-url'
  ]) {
    assert.equal(
      resolveAbandonedCheckoutRecoveryProductImageUrl({
        ...emptySource,
        curatedImageUrl
      }),
      null
    )
  }
})

test('rejects mapped path traversal, query, fragment, and wrong prefixes', () => {
  for (const path of [
    '/email/abandoned-checkout/../secret.jpg',
    '/email/abandoned-checkout/variant.jpg?token=secret',
    '/email/abandoned-checkout/variant.jpg#token',
    '/email/abandoned-checkout//variant.jpg',
    '/gtin/product-images/variant.jpg',
    'https://utekos.no/email/abandoned-checkout/variant.jpg'
  ]) {
    assert.equal(
      resolveAbandonedCheckoutRecoveryProductImageUrl(
        {
          ...emptySource,
          variantId: 'gid://shopify/ProductVariant/1001'
        },
        {
          variantImagePathById: {
            'gid://shopify/ProductVariant/1001': path
          },
          gtinImagePathByBarcode: {}
        }
      ),
      null
    )
  }
})

test('returns null when every image source is absent or unsafe', () => {
  assert.equal(
    resolveAbandonedCheckoutRecoveryProductImageUrl(emptySource),
    null
  )
  assert.equal(
    resolveAbandonedCheckoutRecoveryProductImageUrl({
      ...emptySource,
      curatedImageUrl: 'https://example.com/curated.jpg',
      shopifyLineItemImageUrl: 'javascript:alert(1)'
    }),
    null
  )
})
