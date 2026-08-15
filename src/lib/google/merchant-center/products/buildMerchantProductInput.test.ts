import assert from 'node:assert/strict'
import test from 'node:test'

import type { CatalogSyncProduct } from '@/lib/catalog-sync/types'

import { buildMerchantProductInput } from './buildMerchantProductInput'

process.env.GOOGLE_MERCHANT_ACCOUNT_ID = '123456789'
process.env.GOOGLE_MERCHANT_SERVICE_ACCOUNT_JSON =
  JSON.stringify({
    client_email:
      'mercchant-center-api@project-c683eb2c-20ae-4ec2-ac3.iam.gserviceaccount.com',
    private_key: 'test-private-key'
  })

const product: CatalogSyncProduct = {
  id: 'gid://shopify/Product/100',
  title: 'Utekos TechDown™',
  handle: 'utekos-techdown',
  productType: 'Uteklær',
  descriptionHtml: '<p>Varm og lett.</p>',
  vendor: 'Utekos',
  status: 'ACTIVE',
  updatedAt: '2026-08-15T08:00:00Z',
  featuredImage: { url: 'https://cdn.shopify.com/product.jpg' },
  images: [],
  variants: {
    edges: [
      {
        node: {
          id: 'gid://shopify/ProductVariant/200',
          title: 'Havdyp / Stor',
          sku: 'UTEKOS-HAV-STOR',
          barcode: null,
          price: '1790.00',
          compareAtPrice: null,
          inventoryQuantity: 1,
          availableForSale: true,
          updatedAt: '2026-08-15T08:30:00Z',
          image: null,
          selectedOptions: [
            { name: 'Farge', value: 'Havdyp' },
            { name: 'Størrelse', value: 'Stor' },
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

test('sends the Utekos presentation to Google Merchant Center', () => {
  const result = buildMerchantProductInput(
    product,
    product.variants.edges[0]!.node
  )

  assert.equal(result.ok, true)

  if (!result.ok) {
    return
  }

  assert.equal(
    result.input.productAttributes.title,
    'Utekos TechDown™ / Havdyp / Stor / Unisex'
  )
  assert.equal(
    result.input.productAttributes.description,
    'Utekos TechDown™ er et varmt og allsidig 3-i-1-plagg med Luméa™-ytterstoff og CloudWeave™-isolasjon for terrasse, hytte, båt og bobil.'
  )
  assert.equal(
    result.input.productAttributes.link,
    'https://utekos.no/produkter/utekos-techdown?farge=havdyp&storrelse=stor&kjonn=unisex'
  )
  assert.equal(
    result.input.productAttributes.canonicalLink,
    'https://utekos.no/produkter/utekos-techdown'
  )
  assert.equal(result.input.productAttributes.color, 'Havdyp')
  assert.equal(result.input.productAttributes.size, 'Stor')
  assert.equal(
    String(result.input.productAttributes.link).includes(
      'gid://shopify'
    ),
    false
  )
})

test('excludes a hidden TechDown size', () => {
  const hiddenVariant = {
    ...product.variants.edges[0]!.node,
    selectedOptions: [
      { name: 'Farge', value: 'Havdyp' },
      { name: 'Størrelse', value: 'Liten' },
      { name: 'Kjønn', value: 'Unisex' }
    ]
  }

  assert.deepEqual(
    buildMerchantProductInput(product, hiddenVariant),
    { ok: false, reason: 'hidden_public_variant' }
  )
})

test('fails closed for a product without an Utekos presentation', () => {
  const unknownProduct = {
    ...product,
    handle: 'shopify-only-product'
  }

  assert.deepEqual(
    buildMerchantProductInput(
      unknownProduct,
      unknownProduct.variants.edges[0]!.node
    ),
    { ok: false, reason: 'missing_product_presentation' }
  )
})
