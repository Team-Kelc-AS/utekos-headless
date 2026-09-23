import assert from 'node:assert/strict'
import test from 'node:test'
import {
  getDefaultStickySelection,
  getStickyVariantLabel,
  getStickyProductName
} from './selection'

const products = [
  {
    handle: 'utekos-dun',
    variants: [
      {
        id: 'dun-m',
        options: { size: 'Medium' },
        availableForSale: true
      }
    ]
  },
  {
    handle: 'utekos-techdown',
    variants: [
      {
        id: 'techdown-l',
        options: { size: 'Stor', color: 'Havdyp' },
        availableForSale: true
      },
      {
        id: 'techdown-m',
        options: { size: 'Middels', color: 'Havdyp' },
        availableForSale: false
      }
    ]
  }
]

test('defaults to TechDown M even when another product is first and M is sold out', () => {
  assert.equal(getDefaultStickySelection(products), 'techdown-m')
})

test('does not silently select another product or size if TechDown M is missing', () => {
  assert.equal(getDefaultStickySelection([]), null)
  assert.equal(
    getDefaultStickySelection(products.slice(0, 1)),
    null
  )
  assert.equal(
    getDefaultStickySelection([
      {
        handle: 'utekos-techdown',
        variants: products[1]!.variants.slice(0, 1)
      }
    ]),
    null
  )
})

test('labels use full size names and preserve color differences', () => {
  assert.equal(
    getStickyVariantLabel({
      size: 'Middels',
      color: 'Havdyp',
      gender: 'Unisex'
    }),
    'Havdyp - Middels'
  )
  assert.equal(
    getStickyVariantLabel({ size: 'Medium', color: 'Fjellblå' }),
    'Fjellblå - Medium'
  )
  assert.equal(
    getStickyProductName('Utekos TechDown™', {
      size: 'Middels',
      color: 'Havdyp'
    }),
    'TechDown™ Havdyp - Middels'
  )
})
