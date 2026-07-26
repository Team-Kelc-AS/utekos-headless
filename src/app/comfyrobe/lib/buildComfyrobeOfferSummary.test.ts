import assert from 'node:assert/strict'
import test from 'node:test'
import { buildComfyrobeOfferSummary } from './buildComfyrobeOfferSummary'
import type { Money } from 'types/commerce/Money'

const nok = (amount: string): Money => ({
  amount,
  currencyCode: 'NOK'
})

function productWithVariants(
  variants: Array<{
    availableForSale: boolean
    price: Money
    compareAtPrice: Money | null
  }>
) {
  return {
    variants: { edges: variants.map(node => ({ node })) }
  }
}

test('builds a valid Comfyrobe offer from the first available variant', () => {
  const offer = buildComfyrobeOfferSummary(
    productWithVariants([
      {
        availableForSale: false,
        price: nok('1099'),
        compareAtPrice: nok('1690')
      },
      {
        availableForSale: true,
        price: nok('999'),
        compareAtPrice: nok('1690')
      }
    ])
  )

  assert.equal(offer?.priceLabel, '999\u00a0kr')
  assert.equal(offer?.compareAtPriceLabel, '1\u00a0690\u00a0kr')
  assert.equal(offer?.savingsAmountLabel, '691\u00a0kr')
  assert.equal(offer?.savingsPercentage, 41)
  assert.equal(offer?.availabilityLabel, 'På lager')
  assert.equal(offer?.klarnaPurchaseAmount, '99900')
})

test('omits savings when the compare-at price is missing or invalid', () => {
  const missing = buildComfyrobeOfferSummary(
    productWithVariants([
      {
        availableForSale: true,
        price: nok('999'),
        compareAtPrice: null
      }
    ])
  )
  const lower = buildComfyrobeOfferSummary(
    productWithVariants([
      {
        availableForSale: true,
        price: nok('999'),
        compareAtPrice: nok('899')
      }
    ])
  )

  assert.equal(missing?.compareAtPriceLabel, null)
  assert.equal(missing?.savingsAmountLabel, null)
  assert.equal(missing?.savingsPercentage, null)
  assert.equal(lower?.compareAtPriceLabel, null)
  assert.equal(lower?.savingsPercentage, null)
})

test('reports unavailable inventory without inventing scarcity', () => {
  const offer = buildComfyrobeOfferSummary(
    productWithVariants([
      {
        availableForSale: false,
        price: nok('999'),
        compareAtPrice: nok('1690')
      }
    ])
  )

  assert.equal(offer?.availableForSale, false)
  assert.equal(offer?.availabilityLabel, 'Midlertidig utsolgt')
})

test('fails closed when the product or price is invalid', () => {
  assert.equal(buildComfyrobeOfferSummary(null), null)
  assert.equal(
    buildComfyrobeOfferSummary(
      productWithVariants([
        {
          availableForSale: true,
          price: nok('not-a-price'),
          compareAtPrice: nok('1690')
        }
      ])
    ),
    null
  )
})
