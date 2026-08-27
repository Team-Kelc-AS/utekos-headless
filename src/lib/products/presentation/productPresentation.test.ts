import assert from 'node:assert/strict'
import test from 'node:test'
import {
  buildPublicVariantName,
  buildPublicVariantUrl,
  getAllProductPresentations,
  getProductPresentation,
  requireProductPresentation,
  resolveCatalogVariantPresentation
} from './index'
import { SIZE_GUIDANCE } from '../../../app/skreddersy-varmen/utils/constants'
import { TECH_DOWN_PUBLIC_SIZES } from './techDownSizeContract'

test('validates all five public Utekos product presentations', () => {
  const presentations = getAllProductPresentations()

  assert.deepEqual(
    presentations.map(presentation => presentation.publicHandle),
    [
      'utekos-techdown',
      'utekos-mikrofiber',
      'utekos-dun',
      'utekos-stapper',
      'comfyrobe'
    ]
  )
  assert.ok(
    presentations.every(
      presentation =>
        presentation.canonicalUrl ===
          `https://utekos.no${presentation.canonicalPath}` &&
        presentation.productGroupUrl ===
          `${presentation.canonicalUrl}#product-group`
    )
  )
})

test('builds readable public variant names without the gender option', () => {
  const examples = [
    {
      handle: 'utekos-techdown',
      color: 'Havdyp',
      size: 'Middels',
      expected: 'Utekos TechDown™ Havdyp - Middels'
    },
    {
      handle: 'utekos-mikrofiber',
      color: 'Fjellblå',
      size: 'Medium',
      expected: 'Utekos Mikrofiber™ Fjellblå - Medium'
    },
    {
      handle: 'utekos-dun',
      color: 'Vargnatt',
      size: 'Medium',
      expected: 'Utekos Dun™ Vargnatt - Medium'
    },
    {
      handle: 'utekos-stapper',
      color: 'Vargnatt',
      size: 'OneSize',
      expected: 'Utekos Stapper™ Vargnatt - OneSize'
    },
    {
      handle: 'comfyrobe',
      color: 'Fjellnatt',
      size: 'XS',
      expected: 'Comfyrobe™ Fjellnatt - XS'
    }
  ] as const

  for (const example of examples) {
    const name = buildPublicVariantName(
      requireProductPresentation(example.handle),
      {
        color: example.color,
        size: example.size,
        gender: 'Unisex'
      }
    )

    assert.equal(name, example.expected)
    assert.doesNotMatch(name, /Unisex|\//)
  }
})

test('locks the TechDown public identity and fails closed for unknown products', () => {
  const presentation = requireProductPresentation(
    'utekos-techdown'
  )

  assert.equal(presentation.displayName, 'Utekos TechDown™')
  assert.equal(
    presentation.canonicalUrl,
    'https://utekos.no/produkter/utekos-techdown'
  )
  assert.equal(
    presentation.storefrontLookupHandle,
    'utekos-techdown'
  )
  assert.deepEqual(presentation.hiddenOptionValues.size, [
    'Liten'
  ])
  assert.equal(getProductPresentation('shopify-only'), null)
  assert.throws(
    () => requireProductPresentation('shopify-only'),
    /Missing Utekos product presentation/
  )
})

test('builds a stable readable TechDown URL and preserves attribution', () => {
  const presentation = requireProductPresentation(
    'utekos-techdown'
  )
  const url = buildPublicVariantUrl({
    presentation,
    options: {
      color: 'Havdyp',
      size: 'Større',
      gender: 'Unisex'
    },
    searchParams:
      'variant=gid%3A%2F%2Fshopify%2FProductVariant%2F9&utm_medium=paid&utm_source=meta&fbclid=fb&msclkid=ms'
  })

  assert.equal(
    url,
    '/produkter/utekos-techdown?farge=havdyp&storrelse=storre&kjonn=unisex&fbclid=fb&msclkid=ms&utm_medium=paid&utm_source=meta'
  )
  assert.doesNotMatch(url, /variant=|gid|products\//)
})

test('covers every public TechDown size in landing size guidance', () => {
  for (const size of TECH_DOWN_PUBLIC_SIZES) {
    assert.ok(
      SIZE_GUIDANCE[size],
      `Missing Utekos TechDown™ size guidance for ${size}`
    )
  }
})

test('uses Større as the public TechDown XL size', () => {
  const fromShopifyName = resolveCatalogVariantPresentation({
    handle: 'utekos-techdown',
    selectedOptions: [
      { name: 'Farge', value: 'Havdyp' },
      { name: 'Størrelse', value: 'Større' },
      { name: 'Kjønn', value: 'Unisex' }
    ]
  })
  const fromLegacyName = resolveCatalogVariantPresentation({
    handle: 'utekos-techdown',
    selectedOptions: [
      { name: 'Farge', value: 'Havdyp' },
      { name: 'Størrelse', value: 'Ekstra stor' },
      { name: 'Kjønn', value: 'Unisex' }
    ]
  })

  assert.equal(fromShopifyName.status, 'included')
  assert.equal(fromLegacyName.status, 'included')

  if (
    fromShopifyName.status !== 'included' ||
    fromLegacyName.status !== 'included'
  ) {
    throw new Error(
      'Expected TechDown Større to be publicly included'
    )
  }

  assert.equal(fromShopifyName.options.size, 'Større')
  assert.equal(fromLegacyName.options.size, 'Større')
  assert.equal(
    fromShopifyName.publicPath,
    '/produkter/utekos-techdown?farge=havdyp&storrelse=storre&kjonn=unisex'
  )
})

test('excludes hidden and unmapped catalog variants', () => {
  assert.deepEqual(
    resolveCatalogVariantPresentation({
      handle: 'utekos-techdown',
      selectedOptions: [
        { name: 'Farge', value: 'Havdyp' },
        { name: 'Størrelse', value: 'Liten' },
        { name: 'Kjønn', value: 'Unisex' }
      ]
    }),
    { status: 'hidden_public_variant' }
  )
  assert.deepEqual(
    resolveCatalogVariantPresentation({
      handle: 'utekos-techdown',
      selectedOptions: [
        { name: 'Farge', value: 'Ukjent' },
        { name: 'Størrelse', value: 'Stor' },
        { name: 'Kjønn', value: 'Unisex' }
      ]
    }),
    { status: 'invalid_variant_presentation' }
  )
})
