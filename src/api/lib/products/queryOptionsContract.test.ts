import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

function readSource(relativePath: string) {
  return readFileSync(
    new URL(relativePath, import.meta.url),
    'utf8'
  )
}

test('cart suggestion prefetch and consumers share queryOptions', () => {
  const options = readSource('./cartSuggestionOptions.ts')
  const trigger = readSource(
    '../../../components/cart/CartTrigger.tsx'
  )
  const suggestions = readSource(
    '../../../components/cart/SmartCartSuggestions.tsx'
  )

  assert.match(options, /queryOptions/)
  assert.match(options, /\['products', 'recommended'\]/)
  assert.match(options, /\['products', 'accessory'\]/)
  assert.match(
    trigger,
    /prefetchQuery\(recommendedProductsOptions\)/
  )
  assert.match(
    trigger,
    /prefetchQuery\(accessoryProductsOptions\)/
  )
  assert.match(
    suggestions,
    /useQuery\(\s*recommendedProductsOptions\s*\)/
  )
  assert.match(
    suggestions,
    /useQuery\(\s*accessoryProductsOptions\s*\)/
  )
})
