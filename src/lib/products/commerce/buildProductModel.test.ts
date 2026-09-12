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
const { buildProductModel } =
  require('./buildProductModel.ts') as typeof import('./buildProductModel')
const { resolveCommerceVariantFromSearchParams } =
  require('./resolveCommerceVariantFromSearchParams.ts') as typeof import('./resolveCommerceVariantFromSearchParams')
const { buildSkreddersyVarmenJsonLd } =
  require('../../../app/skreddersy-varmen/structured-data/buildSkreddersyVarmenJsonLd.ts') as typeof import('../../../app/skreddersy-varmen/structured-data/buildSkreddersyVarmenJsonLd')

test('builds one TechDown commerce model with three public sizes', () => {
  const commerce = buildProductModel(
    createTechDownShopifyProductFixture()
  )

  assert.equal(commerce.title, 'Utekos TechDown™')
  assert.equal(
    commerce.defaultVariantId,
    'gid://shopify/ProductVariant/102'
  )
  assert.deepEqual(
    commerce.variants.map(variant => variant.options.size),
    ['Middels', 'Stor', 'Større']
  )
  assert.deepEqual(
    commerce.variants.map(variant => variant.title),
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
    commerce.variants[1]?.image?.altText,
    'Utekos TechDown™ i Havdyp, størrelse Stor, Unisex.'
  )
  assert.doesNotMatch(
    JSON.stringify(
      commerce.variants.map(variant => variant.publicUrl)
    ),
    /gid:\/\/shopify|\/products\//
  )
  assert.match(
    commerce.variants[0]?.id ?? '',
    /^gid:\/\/shopify\//
  )
})

test('falls back to the default variant when search params are missing', () => {
  const commerce = buildProductModel(
    createTechDownShopifyProductFixture()
  )
  const resolved =
    resolveCommerceVariantFromSearchParams(commerce)

  assert.equal(resolved?.id, commerce.defaultVariantId)
})

test('resolves a readable sold-out variant without changing the default', () => {
  const commerce = buildProductModel(
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
  assert.equal(resolved?.availableForSale, false)
  assert.equal(
    commerce.defaultVariantId,
    'gid://shopify/ProductVariant/102'
  )
})

test('resolves browser and server variant parameters identically', () => {
  const commerce = buildProductModel(
    createTechDownShopifyProductFixture()
  )
  const cases = [
    ['', 'Stor'],
    ['storrelse=middels&utm_source=variant-test', 'Middels'],
    ['storrelse=storre', 'Større'],
    ['storrelse=ekstra-stor', 'Større'],
    ['storrelse=middels&storrelse=stor', 'Middels'],
    ['storrelse=ukjent', 'Stor'],
    ['farge=ukjent&storrelse=middels', 'Stor'],
    ['variant=ukjent&storrelse=middels', 'Middels'],
    [
      'variant=gid%3A%2F%2Fshopify%2FProductVariant%2F102&storrelse=middels',
      'Stor'
    ]
  ] as const

  for (const [query, expectedSize] of cases) {
    const browserParams = new URLSearchParams(query)
    const serverParams = Object.fromEntries(
      [...new Set(browserParams.keys())].map(key => [
        key,
        browserParams.getAll(key)
      ])
    )
    const browserVariant =
      resolveCommerceVariantFromSearchParams(
        commerce,
        browserParams
      )
    const serverVariant = resolveCommerceVariantFromSearchParams(
      commerce,
      serverParams
    )

    assert.equal(browserVariant, serverVariant, query)
    assert.equal(
      browserVariant?.options.size,
      expectedSize,
      query
    )
  }
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

  const commerce = buildProductModel(product)
  const medium = commerce.variants.find(
    variant => variant.options.size === 'Middels'
  )

  assert.equal(medium?.image?.url, product.featuredImage?.url)
  assert.equal(
    medium?.image?.altText,
    'Utekos TechDown™ i Havdyp, størrelse Middels, Unisex.'
  )
})

test('builds the landing graph as one ItemPage and one complete ProductGroup', () => {
  const commerce = buildProductModel(
    createTechDownShopifyProductFixture()
  )
  const data = buildSkreddersyVarmenJsonLd(commerce)
  const graph = data['@graph']
  const productGroup = graph.find(
    node => node['@type'] === 'ProductGroup'
  )
  const itemPage = graph.find(
    node => node['@type'] === 'ItemPage'
  )

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

for (const [handle, color, sizes] of [
  ['utekos-mikrofiber', 'Fjellblå', ['Medium', 'Large']],
  ['utekos-dun', 'Vargnatt', ['Medium', 'Large']],
  ['utekos-stapper', 'Vargnatt', ['OneSize']],
  ['comfyrobe', 'Fjellnatt', ['XS', 'S', 'M', 'L', 'XL']]
] as const) {
  test(`preserves ${handle} sizes, selection and variant URLs`, () => {
    const product = createTechDownShopifyProductFixture()
    const template = product.variants.edges[1]!.node
    product.handle = handle
    product.variants.edges = sizes.map((size, index) => ({
      node: {
        ...template,
        id: `gid://shopify/ProductVariant/${200 + index}`,
        selectedOptions: [
          { name: 'Color', value: color },
          { name: 'Size', value: size }
        ],
        availableForSale: index === sizes.length - 1
      }
    }))
    const model = buildProductModel(product)
    assert.equal(model.handle, handle)
    assert.deepEqual(
      model.variants.map(variant => variant.options.size),
      sizes
    )
    assert.equal(
      model.defaultVariantId,
      model.variants.at(-1)!.id
    )
    for (const variant of model.variants) {
      assert.equal(
        resolveCommerceVariantFromSearchParams(
          model,
          new URL(variant.publicUrl).searchParams
        ),
        variant
      )
      assert.equal(variant.options.color, color)
      assert.equal(variant.options.gender, 'Unisex')
    }
  })
}

test('preserves profile images, dimensions and swatches in the shared PDP variant', () => {
  const product = createTechDownShopifyProductFixture()
  const source = product.variants.edges[1]!.node
  source.variantProfileData = {
    images: [
      {
        ...source.image!,
        url: 'https://cdn.shopify.com/techdown-detail.jpg'
      }
    ],
    colorLabel: { value: 'Havdyp' },
    subtitle: { value: 'CloudWeave™' },
    swatchHexcolorForVariant: { value: '#123456' },
    length: { value: '162' }
  }
  const model = buildProductModel(product, {
    includeVariantProfiles: true
  })
  const variant = model.variants.find(
    candidate => candidate.id === source.id
  )!
  assert.deepEqual(
    variant.variantProfileData,
    source.variantProfileData
  )
  assert.equal(variant.price.amount, source.price.amount)
  assert.equal(
    variant.quantityAvailable,
    source.quantityAvailable
  )
})

test('rejects an incomplete TechDown size set without publishing partial purchase or SEO data', () => {
  const product = createTechDownShopifyProductFixture()
  product.variants.edges = product.variants.edges.filter(
    ({ node }) => node.id !== 'gid://shopify/ProductVariant/103'
  )
  assert.throws(
    () => buildProductModel(product),
    /does not match the public size contract/
  )
})

test('normalizes legacy Shopify size aliases once and keeps all three public variants', () => {
  const product = createTechDownShopifyProductFixture()
  const aliases = ['S', 'Medium', 'L', 'Ekstra stor']
  product.variants.edges.forEach(({ node }, index) => {
    node.selectedOptions.find(
      option => option.name === 'Størrelse'
    )!.value = aliases[index]!
  })
  const model = buildProductModel(product)
  assert.deepEqual(
    model.variants.map(variant => variant.options.size),
    ['Middels', 'Stor', 'Større']
  )
  assert.deepEqual(
    model.options.find(option => option.name === 'Størrelse')
      ?.optionValues,
    [{ name: 'Middels' }, { name: 'Stor' }, { name: 'Større' }]
  )
})

test('keeps a readable default when every public size is sold out', () => {
  const product = createTechDownShopifyProductFixture()
  product.variants.edges.forEach(({ node }) => {
    node.availableForSale = false
  })
  const model = buildProductModel(product)
  assert.equal(
    model.defaultVariantId,
    'gid://shopify/ProductVariant/101'
  )
  assert.ok(
    model.variants.every(variant => !variant.availableForSale)
  )
})

test('accepts Shopify gallery images without alt text and preserves the product', () => {
  const product = createTechDownShopifyProductFixture()
  const source = product.variants.edges[1]!.node
  const image = { ...source.image! }
  // Shopify allows null altText; old transport types claimed it was always a string.
  Reflect.set(image, 'altText', null)
  source.variantProfileData = { images: [image] }
  const model = buildProductModel(product, {
    includeVariantProfiles: true
  })
  const variant = model.variants.find(
    candidate => candidate.id === source.id
  )!
  assert.equal(
    variant.variantProfileData?.images?.[0]?.altText,
    ''
  )
  assert.equal(
    variant.variantProfileData?.images?.[0]?.url,
    image.url
  )
  assert.equal(variant.availableForSale, true)
  assert.equal(model.variants.length, 3)
})

test('keeps unused PDP gallery profiles out of the landing payload with identical purchase and SEO data', () => {
  const product = createTechDownShopifyProductFixture()
  for (const { node } of product.variants.edges) {
    node.variantProfileData = {
      images: Array.from({ length: 8 }, () => ({
        ...node.image!
      }))
    }
  }
  const landing = buildProductModel(product)
  const pdp = buildProductModel(product, {
    includeVariantProfiles: true
  })
  assert.ok(
    landing.variants.every(
      variant => variant.variantProfileData === undefined
    )
  )
  assert.ok(
    pdp.variants.every(
      variant => variant.variantProfileData?.images?.length === 8
    )
  )
  assert.deepEqual(landing, {
    ...pdp,
    variants: pdp.variants.map(
      ({ variantProfileData: _profile, ...variant }) => variant
    )
  })
  assert.deepEqual(
    buildSkreddersyVarmenJsonLd(landing),
    buildSkreddersyVarmenJsonLd(pdp)
  )
  assert.ok(
    JSON.stringify(landing).length < JSON.stringify(pdp).length
  )
})
