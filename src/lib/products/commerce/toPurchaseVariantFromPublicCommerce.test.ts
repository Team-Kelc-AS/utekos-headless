import assert from 'node:assert/strict'
import test from 'node:test'
import type { PublicCommerceVariant } from './productCommerceViewModelSchema'
import { toPurchaseVariantFromPublicCommerce } from './toPurchaseVariantFromPublicCommerce'

function createPublicCommerceVariant(
  gtin: string | null
): PublicCommerceVariant {
  return {
    publicId: 'variant-havdyp-middels-unisex',
    publicPath:
      '/produkter/utekos-techdown?farge=havdyp&storrelse=middels&kjonn=unisex',
    publicUrl:
      'https://utekos.no/produkter/utekos-techdown?farge=havdyp&storrelse=middels&kjonn=unisex',
    publicName: 'Utekos TechDown™ / Havdyp / Middels / Unisex',
    description:
      'Utekos TechDown™ er et varmt og allsidig 3-i-1-plagg. Denne varianten har fargen Havdyp og størrelse Middels.',
    imageAlt: 'Utekos TechDown™ i Havdyp, størrelse Middels, Unisex.',
    options: {
      color: 'Havdyp',
      size: 'Middels',
      gender: 'Unisex'
    },
    commerce: {
      id: 'gid://shopify/ProductVariant/101',
      title: 'Utekos TechDown™ / Havdyp / Middels / Unisex',
      gtin,
      availableForSale: true,
      currentlyNotInStock: false,
      taxable: true,
      selectedOptions: [
        { name: 'Farge', value: 'Havdyp' },
        { name: 'Størrelse', value: 'Middels' },
        { name: 'Kjønn', value: 'Unisex' }
      ],
      price: { amount: '1999', currencyCode: 'NOK' },
      image: {
        id: 'gid://shopify/ProductImage/techdown',
        url: 'https://cdn.shopify.com/techdown.jpg',
        altText: 'Utekos TechDown™',
        width: 1200,
        height: 1500
      },
      compareAtPrice: null,
      sku: 'TECHDOWN-HAVDYP-M',
      quantityAvailable: 7
    }
  }
}

test('maps public commerce gtin onto the purchase barcode contract', () => {
  const purchaseVariant = toPurchaseVariantFromPublicCommerce(
    createPublicCommerceVariant('4006381333931')
  )

  assert.equal(purchaseVariant.barcode, '4006381333931')
  assert.equal(
    purchaseVariant.id,
    'gid://shopify/ProductVariant/101'
  )
  assert.equal(purchaseVariant.sku, 'TECHDOWN-HAVDYP-M')
})

test('keeps a missing public gtin as a null purchase barcode', () => {
  const purchaseVariant = toPurchaseVariantFromPublicCommerce(
    createPublicCommerceVariant(null)
  )

  assert.equal(purchaseVariant.barcode, null)
})
