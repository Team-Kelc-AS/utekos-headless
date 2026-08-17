import assert from 'node:assert/strict'
import Module from 'node:module'
import { createRequire } from 'node:module'
import test from 'node:test'
import { createTechDownShopifyProductFixture } from '../testing/createTechDownShopifyProductFixture'

const moduleWithLoad = Module as typeof Module & {
  _load: (
    request: string,
    parent: NodeModule | null,
    isMain: boolean
  ) => unknown
}
const originalLoad = moduleWithLoad._load.bind(Module)

moduleWithLoad._load = (request, parent, isMain) => {
  if (request === 'server-only') return {}
  return originalLoad(request, parent, isMain)
}

const require = createRequire(import.meta.url)
const { buildProductCommerceViewModel } =
  require('./buildProductCommerceViewModel.ts') as typeof import('./buildProductCommerceViewModel')
const { resolveCommerceVariantFromSearchParams } =
  require('./resolveCommerceVariantFromSearchParams.ts') as typeof import('./resolveCommerceVariantFromSearchParams')
const { buildSkreddersyVarmenJsonLd } =
  require('../../../app/skreddersy-varmen/structured-data/buildSkreddersyVarmenJsonLd.ts') as typeof import('../../../app/skreddersy-varmen/structured-data/buildSkreddersyVarmenJsonLd')

test('builds one TechDown commerce model with three public sizes', () => {
  const commerce = buildProductCommerceViewModel(
    createTechDownShopifyProductFixture()
  )

  assert.equal(commerce.displayName, 'Utekos TechDown™')
  assert.equal(
    commerce.defaultVariantId,
    'gid://shopify/ProductVariant/102'
  )
  assert.deepEqual(
    commerce.variants.map(variant => variant.options.size),
    ['Middels', 'Stor', 'Større']
  )
  assert.deepEqual(
    commerce.variants.map(variant => variant.publicName),
    [
      'Utekos TechDown™ / Havdyp / Middels / Unisex',
      'Utekos TechDown™ / Havdyp / Stor / Unisex',
      'Utekos TechDown™ / Havdyp / Større / Unisex'
    ]
  )
  assert.equal(
    commerce.variants[1]?.publicPath,
    '/produkter/utekos-techdown?farge=havdyp&storrelse=stor&kjonn=unisex'
  )
  assert.equal(
    commerce.variants[1]?.imageAlt,
    'Utekos TechDown™ i Havdyp, størrelse Stor, Unisex.'
  )
  assert.doesNotMatch(
    JSON.stringify(
      commerce.variants.map(variant => variant.publicUrl)
    ),
    /gid:\/\/shopify|\/products\//
  )
  assert.match(
    commerce.variants[0]?.commerce.id ?? '',
    /^gid:\/\/shopify\//
  )
})

test('resolves a readable sold-out variant without changing the default', () => {
  const commerce = buildProductCommerceViewModel(
    createTechDownShopifyProductFixture()
  )
  const resolved = resolveCommerceVariantFromSearchParams(
    commerce,
    {
      farge: 'havdyp',
      storrelse: 'ekstra-stor',
      kjonn: 'unisex'
    }
  )

  assert.equal(resolved?.options.size, 'Større')
  assert.equal(resolved?.commerce.availableForSale, false)
  assert.equal(
    commerce.defaultVariantId,
    'gid://shopify/ProductVariant/102'
  )
})

test('uses the product image when Shopify omits a variant image', () => {
  const product = createTechDownShopifyProductFixture()
  const mediumVariant = product.variants.edges.find(edge =>
    edge.node.selectedOptions.some(
      option =>
        option.name === 'Størrelse' && option.value === 'Middels'
    )
  )

  assert.ok(mediumVariant)
  mediumVariant.node.image = null

  const commerce = buildProductCommerceViewModel(product)
  const medium = commerce.variants.find(
    variant => variant.options.size === 'Middels'
  )

  assert.equal(
    medium?.commerce.image?.url,
    product.featuredImage?.url
  )
  assert.equal(
    medium?.commerce.image?.altText,
    'Utekos TechDown™ i Havdyp, størrelse Middels, Unisex.'
  )
})

test('builds the landing graph as one ItemPage and one complete ProductGroup', () => {
  const commerce = buildProductCommerceViewModel(
    createTechDownShopifyProductFixture()
  )
  const data = buildSkreddersyVarmenJsonLd(commerce)
  const graph = data['@graph']
  const productGroup = graph.find(
    node => node['@type'] === 'ProductGroup'
  )
  const itemPage = graph.find(node => node['@type'] === 'ItemPage')

  assert.equal(graph.length, 3)
  assert.deepEqual(itemPage, {
    '@type': 'ItemPage',
    '@id': 'https://utekos.no/skreddersy-varmen#webpage',
    'url': 'https://utekos.no/skreddersy-varmen',
    'name': 'Utekos TechDown™ | Skreddersy varmen',
    'description':
      'Opplev kompromissløs komfort og overlegen allsidighet. Tilpass lengde, reguler ventilasjon og skreddersy passform. Juster, form og nyt.',
    'inLanguage': 'nb-NO',
    'dateModified': '2026-08-12',
    'isPartOf': { '@id': 'https://utekos.no/#website' },
    'publisher': { '@id': 'https://utekos.no/#organization' },
    'breadcrumb': {
      '@id': 'https://utekos.no/skreddersy-varmen#breadcrumb'
    },
    'mainEntity': { '@id': commerce.productGroupUrl }
  })
  assert.equal(
    graph.filter(node => node['@type'] === 'ProductGroup')
      .length,
    1
  )
  assert.ok(productGroup && 'hasVariant' in productGroup)

  if (!productGroup || !('hasVariant' in productGroup)) return

  assert.equal(productGroup.productGroupID, 'utekos-techdown')
  assert.deepEqual(productGroup.variesBy, [
    'https://schema.org/size'
  ])
  assert.equal(productGroup.hasVariant.length, 3)
  assert.deepEqual(
    productGroup.hasVariant.map(variant => variant['@id']),
    [
      'https://utekos.no/produkter/utekos-techdown#variant-havdyp-middels-unisex',
      'https://utekos.no/produkter/utekos-techdown#variant-havdyp-stor-unisex',
      'https://utekos.no/produkter/utekos-techdown#variant-havdyp-storre-unisex'
    ]
  )
  assert.equal(
    productGroup.hasVariant[2]?.offers.availability,
    'https://schema.org/OutOfStock'
  )
  assert.equal(productGroup.aggregateRating?.reviewCount, 16)
  assert.equal(productGroup.aggregateRating?.ratingCount, 16)
  assert.equal(productGroup.aggregateRating?.bestRating, 5)
  assert.equal(productGroup.aggregateRating?.worstRating, 1)
  assert.equal(productGroup.review?.length, 16)
  assert.equal(
    graph.filter(node => node['@type'] === 'Review').length,
    0
  )

  const serialized = JSON.stringify(data)
  assert.doesNotMatch(
    serialized,
    /Mikrofiber|ItemList|CollectionPage|FAQPage|priceValidUntil|ListPrice|shippingDetails|hasMerchantReturnPolicy|gid:\/\/shopify|kasse\.utekos\.no|\/products\//
  )
  assert.doesNotMatch(serialized, /Rå Shopify/)
})
