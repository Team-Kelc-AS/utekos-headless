import assert from 'node:assert/strict'
import test from 'node:test'
import type {
  StorefrontProductOptions,
  StorefrontProductOptionVariant
} from '@/api/shopify/types/storefrontProductOptions'
import {
  parseStorefrontProductOptions,
  parseStorefrontProductOptionsVariables
} from '@/api/lib/products/parseStorefrontProductOptions'
import { createUtekosProductOptions } from './createUtekosProductOptions'

const PARENT_HANDLE = 'utekos-mikrofiber'

function createVariant(
  id: string,
  color: string,
  size: string,
  availableForSale: boolean,
  handle = PARENT_HANDLE
): StorefrontProductOptionVariant {
  return {
    id,
    availableForSale,
    product: { handle },
    selectedOptions: [
      { name: 'Farge', value: color },
      { name: 'Størrelse', value: size },
      { name: 'Kjønn', value: 'Unisex' }
    ]
  }
}

const vargnattMedium = createVariant(
  'gid://shopify/ProductVariant/1',
  'Vargnatt',
  'Medium',
  true
)
const fjellblaMedium = createVariant(
  'gid://shopify/ProductVariant/2',
  'Fjellblå',
  'Medium',
  true
)
const vargnattLarge = createVariant(
  'gid://shopify/ProductVariant/3',
  'Vargnatt',
  'Large',
  false
)
const fjellblaLarge = createVariant(
  'gid://shopify/ProductVariant/4',
  'Fjellblå',
  'Large',
  true
)

function createProductOptions(
  selectedOrFirstAvailableVariant: StorefrontProductOptionVariant,
  adjacentVariants: StorefrontProductOptionVariant[]
): StorefrontProductOptions {
  return {
    handle: PARENT_HANDLE,
    encodedVariantExistence: 'v1_0:0:0,1:0,,1:0:0,1:0,,',
    encodedVariantAvailability: 'v1_0:0:0,,1:0:0,1:0,,',
    options: [
      {
        name: 'Farge',
        optionValues: [
          {
            name: 'Vargnatt',
            firstSelectableVariant: vargnattMedium
          },
          {
            name: 'Fjellblå',
            firstSelectableVariant: fjellblaMedium
          }
        ]
      },
      {
        name: 'Størrelse',
        optionValues: [
          {
            name: 'Medium',
            firstSelectableVariant: vargnattMedium
          },
          {
            name: 'Large',
            firstSelectableVariant: vargnattLarge
          }
        ]
      },
      {
        name: 'Kjønn',
        optionValues: [
          {
            name: 'Unisex',
            firstSelectableVariant: vargnattMedium
          }
        ]
      }
    ],
    selectedOrFirstAvailableVariant,
    adjacentVariants
  }
}

function findValue(
  productOptions: ReturnType<typeof createUtekosProductOptions>,
  optionName: string,
  valueName: string
) {
  const option = productOptions.options.find(
    candidate => candidate.name === optionName
  )
  const value = option?.optionValues.find(
    candidate => candidate.name === valueName
  )

  assert.ok(value)
  return value
}

test('normalizes Hydrogen options to canonical Utekos variant links', () => {
  const productOptions = createUtekosProductOptions(
    createProductOptions(vargnattMedium, [
      fjellblaMedium,
      vargnattLarge
    ])
  )

  const fjellbla = findValue(productOptions, 'Farge', 'Fjellblå')

  assert.equal(
    productOptions.selectedVariantId,
    vargnattMedium.id
  )
  assert.equal(
    productOptions.selectedVariantAvailableForSale,
    true
  )
  assert.equal(fjellbla.variantId, fjellblaMedium.id)
  assert.equal(fjellbla.variantAvailableForSale, true)
  assert.equal(
    fjellbla.variantHref,
    '/produkter/utekos-mikrofiber?farge=fjellbla&storrelse=medium&kjonn=unisex'
  )
  assert.equal(fjellbla.variantHref.includes('variant='), false)
})

test('requires fresh adjacency data after the selected combination changes', () => {
  const initialOptions = createUtekosProductOptions(
    createProductOptions(vargnattMedium, [
      fjellblaMedium,
      vargnattLarge
    ])
  )
  const refreshedOptions = createUtekosProductOptions(
    createProductOptions(fjellblaMedium, [
      vargnattMedium,
      fjellblaLarge
    ])
  )

  const initialLarge = findValue(
    initialOptions,
    'Størrelse',
    'Large'
  )
  const refreshedLarge = findValue(
    refreshedOptions,
    'Størrelse',
    'Large'
  )

  assert.equal(initialLarge.variantId, vargnattLarge.id)
  assert.equal(initialLarge.available, false)
  assert.equal(initialLarge.variantAvailableForSale, false)
  assert.equal(refreshedLarge.variantId, fjellblaLarge.id)
  assert.equal(refreshedLarge.available, true)
  assert.equal(refreshedLarge.variantAvailableForSale, true)
})

test('keeps top-down option availability separate from exact variant inventory', () => {
  const productOptions = createUtekosProductOptions(
    createProductOptions(vargnattLarge, [
      fjellblaLarge,
      vargnattMedium
    ])
  )

  const vargnatt = findValue(productOptions, 'Farge', 'Vargnatt')

  assert.equal(
    productOptions.selectedVariantAvailableForSale,
    false
  )
  assert.equal(vargnatt.selected, true)
  assert.equal(vargnatt.available, true)
  assert.equal(vargnatt.variantAvailableForSale, false)
})

test('keeps the Utekos-owned public handle for a combined-listing variant', () => {
  const childFjellblaMedium = createVariant(
    fjellblaMedium.id,
    'Fjellblå',
    'Medium',
    true,
    'utekos-mikrofiber-fjellbla'
  )
  const productOptions = createUtekosProductOptions(
    createProductOptions(vargnattMedium, [
      childFjellblaMedium,
      vargnattLarge
    ])
  )

  const fjellbla = findValue(productOptions, 'Farge', 'Fjellblå')

  assert.equal(fjellbla.isDifferentProduct, true)
  assert.equal(
    fjellbla.variantHref,
    '/produkter/utekos-mikrofiber?farge=fjellbla&storrelse=medium&kjonn=unisex'
  )
})

test('fails closed when required Storefront fields are missing', () => {
  const invalidProduct = {
    ...createProductOptions(vargnattMedium, [
      fjellblaMedium,
      vargnattLarge
    ])
  } as Partial<StorefrontProductOptions>

  delete invalidProduct.encodedVariantAvailability

  assert.throws(
    () => parseStorefrontProductOptions(invalidProduct),
    /Invalid Shopify product-options response/
  )
})

test('rejects incomplete selected-option input before Storefront fetch', () => {
  assert.throws(
    () =>
      parseStorefrontProductOptionsVariables({
        handle: PARENT_HANDLE,
        selectedOptions: [{ name: 'Farge' }]
      }),
    /Invalid Shopify product-options variables/
  )
})
