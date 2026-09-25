import assert from 'node:assert/strict'
import test from 'node:test'
import type {
  StorefrontProductOptionVariant,
  StorefrontProductOptions
} from '@/api/shopify/types/storefrontProductOptions'
import { createTechdownSizeSelectorModel } from './techdownSizeSelectorModel'

function variant(
  id: string,
  size: 'Liten' | 'Middels' | 'Stor' | 'Større',
  availableForSale: boolean
): StorefrontProductOptionVariant {
  return {
    id,
    title: `Havdyp / ${size} / Unisex`,
    barcode: null,
    availableForSale,
    currentlyNotInStock: !availableForSale,
    taxable: true,
    quantityAvailable: availableForSale ? 8 : 0,
    sku: `TECHDOWN-${size}`,
    price: { amount: '1990.00', currencyCode: 'NOK' },
    compareAtPrice: null,
    product: { handle: 'utekos-techdown' },
    selectedOptions: [
      { name: 'Farge', value: 'Havdyp' },
      { name: 'Størrelse', value: size },
      { name: 'Kjønn', value: 'Unisex' }
    ]
  }
}

test('builds the public TechDown size model from adjacent Shopify variants', () => {
  const small = variant('variant-small', 'Liten', false)
  const medium = variant('variant-medium', 'Middels', true)
  const large = variant('variant-large', 'Stor', true)
  const extraLarge = variant(
    'variant-extra-large',
    'Større',
    true
  )
  const product: StorefrontProductOptions = {
    id: 'gid://shopify/Product/9240112693496',
    title: 'Utekos TechDown™',
    handle: 'utekos-techdown',
    productType: 'Yttertøy',
    vendor: 'Utekos',
    collections: {
      nodes: [{ id: 'collection-1', title: 'Yttertøy' }]
    },
    encodedVariantExistence: 'v1_0:0:0,1:0,2:0,3:0,,',
    encodedVariantAvailability: 'v1_0:1:0,2:0,3:0,,',
    options: [
      {
        name: 'Farge',
        optionValues: [
          { name: 'Havdyp', firstSelectableVariant: medium }
        ]
      },
      {
        name: 'Størrelse',
        optionValues: [
          { name: 'Liten', firstSelectableVariant: small },
          { name: 'Middels', firstSelectableVariant: medium },
          { name: 'Stor', firstSelectableVariant: large },
          { name: 'Større', firstSelectableVariant: extraLarge }
        ]
      },
      {
        name: 'Kjønn',
        optionValues: [
          { name: 'Unisex', firstSelectableVariant: medium }
        ]
      }
    ],
    selectedOrFirstAvailableVariant: medium,
    adjacentVariants: [small, large, extraLarge]
  }

  const model = createTechdownSizeSelectorModel(product)

  assert.equal(model.initialVariantId, medium.id)
  assert.deepEqual(
    model.choices.map(choice => [
      choice.label,
      choice.code,
      choice.available
    ]),
    [
      ['Middels', 'M', true],
      ['Stor', 'L', true],
      ['Større', 'XL', true]
    ]
  )
  assert.equal(
    model.choices[0]?.href,
    '/produkter/techdown?farge=havdyp&storrelse=middels&kjonn=unisex'
  )
  assert.equal(
    model.choices[0]?.tracking.item_list_id,
    'techdown-size-selector'
  )
  assert.equal(model.choices[0]?.tracking.currency, 'NOK')
  assert.equal(model.choices[0]?.tracking.gross_value, 1990)
  assert.equal(
    model.choices[0]?.tracking.destination_url,
    undefined
  )
  assert.equal(
    model.choices[0]?.tracking.items[0]?.variant_id,
    medium.id
  )
  assert.equal(model.product.handle, 'utekos-techdown')
  assert.equal(model.choices[0]?.variant.id, medium.id)
  assert.equal(model.choices[1]?.variant.id, large.id)
})
