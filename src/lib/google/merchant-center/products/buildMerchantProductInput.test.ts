import assert from 'node:assert/strict'
import test from 'node:test'

import type { CatalogSyncProduct } from '@/lib/catalog-sync/types'

import { buildMerchantProductInput } from './buildMerchantProductInput'

process.env.GOOGLE_MERCHANT_ACCOUNT_ID = '123456789'
process.env.GOOGLE_MERCHANT_SERVICE_ACCOUNT_JSON = JSON.stringify({
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
  featuredImage: { url: 'https://cdn.shopify.com/product.jpg' },
  images: [],
  variants: {
    edges: [
      {
        node: {
          id: 'gid://shopify/ProductVariant/200',
          title: 'Havdyp / Liten',
          sku: 'UTEKOS-HAV-LITEN',
          barcode: null,
          price: '1790.00',
          compareAtPrice: null,
          inventoryQuantity: 1,
          availableForSale: true,
          image: null,
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

test('sends the normalized variant title to Google Merchant Center', () => {
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
    'Utekos TechDown™ Havdyp – Liten'
  )
  assert.equal(result.input.productAttributes.color, 'Havdyp')
  assert.equal(result.input.productAttributes.size, 'Liten')
})
