import assert from 'node:assert/strict'
import Module from 'node:module'
import { createRequire } from 'node:module'
import test from 'node:test'
import type { ShopifyProduct } from 'types/product'

const moduleWithLoad = Module as typeof Module & {
  _load: (
    request: string,
    parent: NodeModule | null,
    isMain: boolean
  ) => unknown
}
const originalLoad = moduleWithLoad._load.bind(Module)

moduleWithLoad._load = (request, parent, isMain) => {
  if (request === 'server-only') {
    return {}
  }

  return originalLoad(request, parent, isMain)
}

const require = createRequire(import.meta.url)
const { buildProductCardModel, buildProductPurchaseModel } =
  require('./buildProductPurchaseModel.ts') as typeof import('./buildProductPurchaseModel')

const image = {
  id: 'gid://shopify/ProductImage/1',
  url: 'https://cdn.shopify.com/product.jpg',
  altText: 'Utekos TechDown i Vargnatt',
  width: 1600,
  height: 2000
}

function createProduct(): ShopifyProduct {
  const variant = {
    id: 'gid://shopify/ProductVariant/1',
    title: 'Vargnatt / Medium',
    barcode: '7090057000012',
    availableForSale: true,
    currentlyNotInStock: false,
    taxable: true,
    selectedOptions: [
      { name: 'Farge', value: 'Vargnatt' },
      { name: 'Størrelse', value: 'Medium' }
    ],
    price: { amount: '1999.00', currencyCode: 'NOK' },
    image,
    compareAtPrice: null,
    metafield: {
      key: 'technical_details',
      value:
        'Rå Shopify-data med materialspesifikasjon, vedlikeholdsinstruksjoner, opprinnelse og andre felt som ikke brukes av kjøpsgrensesnittet. '.repeat(
          8
        )
    },
    sku: 'TD-VN-M',
    variantProfile: {
      reference: {
        images: Array.from({ length: 6 }, (_, index) => ({
          ...image,
          id: `gid://shopify/ProductImage/${index + 10}`,
          url: `https://cdn.shopify.com/product-${index + 10}.jpg`
        })),
        subtitle: { value: 'Teknisk dunponcho' },
        colorLabel: { value: 'Vargnatt' },
        backgroundColor: { value: '#121722' },
        swatchHexcolorForVariant: { value: '#121722' },
        swatchHexcolorForUnselectedVariant: {
          value: '#6b7280'
        },
        length: { value: '112 cm' },
        centerToWrist: { value: '84 cm' },
        flatWidth: { value: '78 cm' }
      }
    },
    variantProfileData: {
      images: [image],
      subtitle: { value: 'Teknisk dunponcho' },
      colorLabel: { value: 'Vargnatt' },
      backgroundColor: { value: '#121722' },
      swatchHexcolorForVariant: { value: '#121722' },
      length: { value: '112 cm' },
      centerToWrist: { value: '84 cm' },
      flatWidth: { value: '78 cm' }
    },
    weight: 1.2,
    weightUnit: 'KILOGRAMS',
    quantityAvailable: 9
  }

  return {
    id: 'gid://shopify/Product/1',
    title: 'Utekos TechDown',
    handle: 'utekos-techdown',
    productType: 'Utekos',
    totalInventory: 9,
    updatedAt: '2026-07-30T00:00:00.000Z',
    collections: {
      nodes: [
        {
          id: 'gid://shopify/Collection/1',
          title: 'Utekos',
          handle: 'utekos'
        }
      ]
    },
    compareAtPriceRange: {
      minVariantPrice: {
        amount: '2199.00',
        currencyCode: 'NOK'
      },
      maxVariantPrice: {
        amount: '2199.00',
        currencyCode: 'NOK'
      }
    },
    priceRange: {
      minVariantPrice: {
        amount: '1999.00',
        currencyCode: 'NOK'
      },
      maxVariantPrice: {
        amount: '1999.00',
        currencyCode: 'NOK'
      }
    },
    availableForSale: true,
    images: { edges: [] },
    options: [
      {
        name: 'Farge',
        optionValues: [{ name: 'Vargnatt' }]
      },
      {
        name: 'Størrelse',
        optionValues: [{ name: 'Medium' }]
      }
    ],
    description: 'Server-rendered produktbeskrivelse',
    featuredImage: image,
    vendor: 'Utekos',
    tags: ['poncho', 'dun'],
    relatedProducts: [],
    seo: {
      title: 'Utekos TechDown',
      description: 'Teknisk dunponcho'
    },
    variants: { edges: [{ node: variant }] }
  } as unknown as ShopifyProduct
}

test('buildProductPurchaseModel exposes only the compact PDP purchase contract', () => {
  const product = createProduct()
  const model = buildProductPurchaseModel(product)
  const serialized = JSON.stringify(model)
  const variant = model.variants[0]

  assert.equal(model.handle, 'utekos-techdown')
  assert.equal(variant?.id, 'gid://shopify/ProductVariant/1')
  assert.deepEqual(variant?.selectedOptions, [
    { name: 'Farge', value: 'Vargnatt' },
    { name: 'Størrelse', value: 'Medium' }
  ])
  assert.equal(
    variant?.variantProfileData?.subtitle?.value,
    'Teknisk dunponcho'
  )
  assert.doesNotMatch(
    serialized,
    /technical_details|compareAtPriceRange|relatedProducts|"seo"|"metafield"|"variantProfile"|"weight"/
  )
})

test('the compact variant payload is at least 50 percent smaller than the source connection', () => {
  const product = createProduct()
  const model = buildProductPurchaseModel(product)
  const sourceBytes = Buffer.byteLength(
    JSON.stringify(product.variants)
  )
  const compactBytes = Buffer.byteLength(
    JSON.stringify(model.variants)
  )

  assert.ok(
    compactBytes <= sourceBytes * 0.5,
    `expected ${compactBytes} compact bytes to be <= 50% of ${sourceBytes} source bytes`
  )
})

test('buildProductCardModel excludes full PDP-only product fields', () => {
  const model = buildProductCardModel(createProduct())
  const serialized = JSON.stringify(model)

  assert.equal(model.priceRange.minVariantPrice.amount, '1999.00')
  assert.doesNotMatch(
    serialized,
    /compareAtPriceRange|relatedProducts|"seo"|technical_details|"totalInventory"/
  )
})
