import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const readSource = (path: string) =>
  readFile(new URL(path, import.meta.url), 'utf8')

test('keeps consent default before hydration and defers external GTM', async () => {
  const source = await readSource(
    '../../../components/analytics/GoogleTagManagerLoader.tsx'
  )

  assert.match(
    source,
    /id='_next-gtm-init'[\s\S]*?strategy='beforeInteractive'/
  )
  assert.match(
    source,
    /id='_next-gtm'[\s\S]*?strategy='afterInteractive'/
  )
})

test('does not prefetch unrelated routes from end-of-page navigation', async () => {
  const source = await readSource('./PreFooterNavigation.tsx')

  assert.match(
    source,
    /href=\{link\.href\}[\s\S]*?prefetch=\{false\}/
  )
})

test('fetches featured handles through one exact aliased operation', async () => {
  const [querySource, loaderSource] = await Promise.all([
    readSource('../../../api/graphql/queries/products/index.ts'),
    readSource('../../../api/lib/products/getFeaturedProducts.ts')
  ])

  assert.match(
    querySource,
    /product0: product\(handle: \$handle0\)[\s\S]*product1: product\(handle: \$handle1\)[\s\S]*product2: product\(handle: \$handle2\)/
  )
  assert.doesNotMatch(loaderSource, /handle:\$\{handle\}/)
})
