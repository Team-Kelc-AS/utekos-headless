import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

const cartBody = readFileSync(
  new URL(
    '../../../../src/components/cart/CartBody/CartBody.tsx',
    import.meta.url
  ),
  'utf8'
)
const recommendations = readFileSync(
  new URL(
    '../../../../src/components/cart/EmptyCart/EmptyCartRecommendations.tsx',
    import.meta.url
  ),
  'utf8'
)

test('shows identity choices only through the empty-cart branch', () => {
  assert.match(
    cartBody,
    /if \(isEmpty && !isPending\)[\s\S]*?<EmptyCartRecommendations \/>/u
  )
  assert.doesNotMatch(cartBody, /EmptyCartIdentityChoices/u)
  assert.match(
    recommendations,
    /import \{ EmptyCartIdentityChoices \}/u
  )
})

test('places identity choices after the offer and all other recommendations', () => {
  const comfyrobeIndex = recommendations.indexOf(
    '<EmptyCartComfyrobeKlarnaDeal />'
  )
  const productIndex = recommendations.indexOf(
    'otherProducts.map'
  )
  const identityIndex = recommendations.indexOf(
    '<EmptyCartIdentityChoices />'
  )

  assert.ok(comfyrobeIndex >= 0)
  assert.ok(productIndex > comfyrobeIndex)
  assert.ok(identityIndex > productIndex)
})
