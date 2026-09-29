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
const siteChrome = readFileSync(
  new URL(
    '../../../../src/components/layout/SiteChrome.tsx',
    import.meta.url
  ),
  'utf8'
)

test('keeps provider choices in the cart and never mounts them globally', () => {
  assert.match(
    cartBody,
    /if \(isEmpty && !isPending\)[\s\S]*?<EmptyCartRecommendations \/>/u
  )
  assert.doesNotMatch(cartBody, /EmptyCartIdentityChoices/u)
  assert.match(
    recommendations,
    /import \{ EmptyCartIdentityChoices \}/u
  )
  assert.match(recommendations, /<EmptyCartIdentityChoices \/>/u)
  assert.doesNotMatch(siteChrome, /FacebookLoginPrompt/u)
  assert.doesNotMatch(siteChrome, /EmptyCartIdentityChoices/u)
})

test('keeps the existing offer and product recommendations in place', () => {
  const comfyrobeIndex = recommendations.indexOf(
    '<EmptyCartComfyrobeKlarnaDeal />'
  )
  const productIndex = recommendations.indexOf(
    'otherProducts.map'
  )

  assert.ok(comfyrobeIndex >= 0)
  assert.ok(productIndex > comfyrobeIndex)
})
