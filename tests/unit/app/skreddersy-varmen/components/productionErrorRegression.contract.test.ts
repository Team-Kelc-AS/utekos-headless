import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const readSource = (path: string) =>
  readFile(new URL(path, import.meta.url), 'utf8')

test('runs consent defaults before the exact Stape Custom Loader', async () => {
  const source = await readSource(
    '../../../components/analytics/GoogleTagManagerLoader.tsx'
  )

  assert.match(
    source,
    /id='_next-gtm-consent-defaults'[\s\S]*?strategy='beforeInteractive'/
  )
  assert.match(
    source,
    /id='_next-gtm-consent-defaults'[\s\S]*?GOOGLE_TAG_MANAGER_BOOTSTRAP[\s\S]*?id='_next-stape-custom-loader'[\s\S]*?STAPE_CUSTOM_LOADER/
  )
  assert.doesNotMatch(source, /GoogleTagManagerContainerScript/)
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

test('keeps healthy Shopify product reads webhook-driven', async () => {
  const [featuredSource, productSource, invalidationSource] =
    await Promise.all([
      readSource('../../../api/lib/products/getFeaturedProducts.ts'),
      readSource('../../../api/lib/products/getProduct.ts'),
      readSource('../../../lib/cache/revalidateProductCatalog.ts')
    ])

  for (const source of [featuredSource, productSource]) {
    assert.doesNotMatch(source, /cacheLife\('products'\)/)
    assert.match(source, /if \(result\.isFallback\)/)
    assert.match(source, /cacheLife\(SHOPIFY_PRODUCT_RECOVERY_CACHE_LIFE\)/)
    assert.match(source, /cacheLife\('max'\)/)
  }

  assert.match(featuredSource, /cacheTag\('products'\)/)
  assert.match(
    productSource,
    /cacheTag\(`product-\$\{normalizedHandle\}`, TAGS\.products\)/
  )
  assert.match(
    invalidationSource,
    /revalidateNextTag\(\s*tag,\s*options\.purgeLastGood \? 'seconds' : 'max'\s*\)/
  )
})
