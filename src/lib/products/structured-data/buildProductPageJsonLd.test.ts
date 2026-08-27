import assert from 'node:assert/strict'
import test from 'node:test'

import type {
  ProductCommerceViewModel,
  PublicCommerceVariant
} from '@/lib/products/commerce'
import { MERCHANT_RETURN_POLICY_ID } from '@/lib/policies/merchantReturnPolicyJsonLd'
import { MERCHANT_SHIPPING_SERVICE_ID } from '@/lib/policies/merchantShippingServiceJsonLd'
import { buildProductPageJsonLd } from './buildProductPageJsonLd'

type VariantInput = {
  gtin: string | null
  sku: string
  color: string
  size: string
}

function createVariant(
  productHandle: string,
  input: VariantInput
): PublicCommerceVariant {
  const slug = `${input.color}-${input.size}`.toLowerCase()
  const publicUrl =
    `https://utekos.no/produkter/${productHandle}` +
    `?farge=${input.color.toLowerCase()}` +
    `&storrelse=${input.size.toLowerCase()}` +
    '&kjonn=unisex'

  return {
    publicId: `variant-${slug}`,
    publicPath:
      new URL(publicUrl).pathname + new URL(publicUrl).search,
    publicUrl,
    publicName: `${productHandle} / ${input.color} / ${input.size} / Unisex`,
    description:
      `Dette er en komplett og kuratert variantbeskrivelse for ${productHandle}. ` +
      `Varianten har fargen ${input.color} og størrelse ${input.size}.`,
    imageAlt: `${productHandle} ${input.color} ${input.size}`,
    options: {
      color: input.color,
      size: input.size,
      gender: 'Unisex'
    },
    commerce: {
      id: `gid://shopify/ProductVariant/${input.sku}`,
      title: input.sku,
      gtin: input.gtin,
      availableForSale: true,
      currentlyNotInStock: false,
      taxable: true,
      selectedOptions: [
        { name: 'Farge', value: input.color },
        { name: 'Størrelse', value: input.size },
        { name: 'Kjønn', value: 'Unisex' }
      ],
      price: { amount: '1790.00', currencyCode: 'NOK' },
      image: {
        id: 'gid://shopify/ProductImage/forbidden',
        url: 'https://cdn.shopify.com/forbidden.jpg',
        altText: 'Shopify-bilde skal aldri inn i JSON-LD',
        width: 1200,
        height: 1500
      },
      compareAtPrice: null,
      sku: input.sku,
      quantityAvailable: 10
    }
  }
}

function createModel(input: {
  productKey: ProductCommerceViewModel['productKey']
  variants: VariantInput[]
  suggestedMinAge?: 13
}): ProductCommerceViewModel {
  const canonicalUrl = `https://utekos.no/produkter/${input.productKey}`
  const variants = input.variants.map(variant =>
    createVariant(input.productKey, variant)
  )

  return {
    productKey: input.productKey,
    publicHandle: input.productKey,
    canonicalPath: `/produkter/${input.productKey}`,
    canonicalUrl,
    productGroupID: input.productKey,
    productGroupUrl: `${canonicalUrl}#product-group`,
    displayName: input.productKey,
    description:
      'Dette er en kuratert produktbeskrivelse som er lang nok for den validerte produktmodellen.',
    category: 'Yttertøy',
    material: 'Kuratert materialbeskrivelse',
    audience: 'Unisex',
    ...(input.suggestedMinAge ?
      { suggestedMinAge: input.suggestedMinAge }
    : {}),
    updatedAt: '2026-08-27T09:00:00.000Z',
    product: {
      id: 'gid://shopify/Product/forbidden',
      title: input.productKey,
      handle: input.productKey,
      productType: 'Yttertøy',
      vendor: 'Utekos',
      featuredImage: null,
      collections: { nodes: [] }
    },
    variants,
    defaultVariantId:
      variants[0]?.commerce.id ?? 'missing-default-variant'
  }
}

test('builds one product-first graph with dynamic size and color variation', () => {
  const data = buildProductPageJsonLd(
    createModel({
      productKey: 'utekos-mikrofiber',
      suggestedMinAge: 13,
      variants: [
        {
          gtin: '07090062980047',
          sku: 'UTEKOS-MIKRO-M-BLUE',
          color: 'Fjellblå',
          size: 'Medium'
        },
        {
          gtin: '07090062980054',
          sku: 'UTEKOS-MIKRO-L-BLUE',
          color: 'Fjellblå',
          size: 'Large'
        },
        {
          gtin: '07090062980061',
          sku: 'UTEKOS-MIKRO-M-SVART',
          color: 'Vargnatt',
          size: 'Medium'
        }
      ]
    })
  )
  const graph = data['@graph']
  const itemPage = graph.find(
    node => node['@type'] === 'ItemPage'
  )
  const productGroup = graph.find(
    node => node['@type'] === 'ProductGroup'
  )
  const breadcrumb = graph.find(
    node => node['@type'] === 'BreadcrumbList'
  )

  assert.deepEqual(
    graph.map(node => node['@type']),
    ['ItemPage', 'ProductGroup', 'BreadcrumbList']
  )
  assert.ok(itemPage && 'mainEntity' in itemPage)

  if (!itemPage || !('mainEntity' in itemPage)) return

  assert.deepEqual(itemPage.mainEntity, {
    '@id':
      'https://utekos.no/produkter/utekos-mikrofiber#product-group'
  })
  assert.ok(productGroup && 'hasVariant' in productGroup)
  assert.ok(breadcrumb && 'itemListElement' in breadcrumb)

  if (!productGroup || !('hasVariant' in productGroup)) return

  assert.deepEqual(productGroup.variesBy, [
    'https://schema.org/size',
    'https://schema.org/color'
  ])
  assert.equal(productGroup.audience.suggestedMinAge, 13)
  assert.equal(productGroup.hasVariant.length, 3)

  for (const variant of productGroup.hasVariant) {
    assert.equal(variant.image[0]?.['@type'], 'ImageObject')
    assert.equal(
      (variant.image[0]?.contentUrl ?? '').startsWith(
        'https://utekos.no/gtin/product-images/'
      ),
      true
    )
    assert.deepEqual(variant.offers.shippingDetails, {
      '@type': 'OfferShippingDetails',
      'hasShippingService': {
        '@id': MERCHANT_SHIPPING_SERVICE_ID
      }
    })
    assert.deepEqual(variant.offers.hasMerchantReturnPolicy, {
      '@id': MERCHANT_RETURN_POLICY_ID
    })
  }

  const serialized = JSON.stringify(data)
  assert.doesNotMatch(serialized, /cdn\.shopify\.com/i)
  assert.doesNotMatch(serialized, /gid:\/\/shopify/i)
  assert.doesNotMatch(
    serialized,
    /CategoryCode|priceValidUntil|mpn|pattern|hasCertification|3DModel/i
  )
})

test('omits invalid, missing, hidden and cross-product GTIN variants', () => {
  const data = buildProductPageJsonLd(
    createModel({
      productKey: 'utekos-techdown',
      variants: [
        {
          gtin: '07090062980016',
          sku: 'VALID',
          color: 'Havdyp',
          size: 'Middels'
        },
        {
          gtin: '07090062980009',
          sku: 'HIDDEN',
          color: 'Havdyp',
          size: 'Liten'
        },
        {
          gtin: '07090062980017',
          sku: 'INVALID-CHECKSUM',
          color: 'Havdyp',
          size: 'Ugyldig'
        },
        {
          gtin: '07090062980085',
          sku: 'WRONG-PRODUCT',
          color: 'Havdyp',
          size: 'Feil produkt'
        },
        {
          gtin: null,
          sku: 'MISSING-GTIN',
          color: 'Havdyp',
          size: 'Mangler'
        }
      ]
    })
  )
  const productGroup = data['@graph'].find(
    node => node['@type'] === 'ProductGroup'
  )

  assert.ok(productGroup && 'hasVariant' in productGroup)

  if (!productGroup || !('hasVariant' in productGroup)) return

  assert.equal(productGroup.hasVariant.length, 1)
  assert.equal(productGroup.hasVariant[0]?.sku, 'VALID')
  assert.equal(
    (
      productGroup.hasVariant[0] as unknown as Record<
        string,
        unknown
      >
    ).gtin14,
    '07090062980016'
  )
  assert.equal('variesBy' in productGroup, false)

  const serialized = JSON.stringify(data)
  assert.doesNotMatch(
    serialized,
    /HIDDEN|INVALID-CHECKSUM|WRONG-PRODUCT|MISSING-GTIN|07090062980009/
  )
})

test('omits intentionally discontinued Comfyrobe M without a GTIN', () => {
  const data = buildProductPageJsonLd(
    createModel({
      productKey: 'comfyrobe',
      variants: [
        {
          gtin: '07090062980085',
          sku: 'COMFYROBE-FJELLNATT-S',
          color: 'Fjellnatt',
          size: 'XS'
        },
        {
          gtin: null,
          sku: 'COMFYROBE-FJELLNATT-M',
          color: 'Fjellnatt',
          size: 'M'
        },
        {
          gtin: '07090062980092',
          sku: 'COMFYROBE-FJELLNATT-L',
          color: 'Fjellnatt',
          size: 'XL'
        }
      ]
    })
  )
  const productGroup = data['@graph'].find(
    node => node['@type'] === 'ProductGroup'
  )

  assert.ok(productGroup && 'hasVariant' in productGroup)

  if (!productGroup || !('hasVariant' in productGroup)) return

  assert.deepEqual(
    productGroup.hasVariant.map(variant => variant.sku),
    ['COMFYROBE-FJELLNATT-S', 'COMFYROBE-FJELLNATT-L']
  )
  assert.doesNotMatch(
    JSON.stringify(data),
    /COMFYROBE-FJELLNATT-M/
  )
})
