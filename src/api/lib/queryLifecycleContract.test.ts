import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

function readSource(relativePath: string) {
  return readFileSync(
    new URL(relativePath, import.meta.url),
    'utf8'
  )
}

test('the root provider does not ship an empty hydration payload', () => {
  const source = readSource(
    '../../components/providers/CartProviderLoader.tsx'
  )

  assert.doesNotMatch(
    source,
    /QueryClient|dehydrate|dehydratedState/
  )
})

test('the featured server section does not prefetch an unconsumed query', () => {
  const source = readSource(
    '../../components/frontpage/FeaturedProductSection.tsx'
  )

  assert.doesNotMatch(
    source,
    /HydrationBoundary|prefetchQuery|dehydrate|QueryClient/
  )
})

test('the PDP keeps product data server-side and passes a compact purchase model', () => {
  const source = readSource(
    '../../app/produkter/[handle]/components/AsyncProductContent.tsx'
  )

  assert.doesNotMatch(
    source,
    /HydrationBoundary|dehydrate|getQueryClient|productOptions\(/
  )
  assert.match(source, /buildProductPurchaseModel/)
  assert.match(source, /ProductPageView/)
})
