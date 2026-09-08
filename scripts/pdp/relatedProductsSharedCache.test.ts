import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import test from 'node:test'

const repoRoot = process.cwd()

async function readSource(relativePath: string): Promise<string> {
  return readFile(join(repoRoot, relativePath), 'utf8')
}

test(
  'related products cache handle-specific recommendations with webhook invalidation',
  async () => {
    const [loaderSource, cachedCardsSource] = await Promise.all([
      readSource('src/api/lib/products/loadRelatedProducts.ts'),
      readSource('src/api/lib/products/getCachedProductCards.ts')
    ])

    assert.match(loaderSource, /getCachedProductCards/)
    assert.match(
      loaderSource,
      /dependencies\.fetchProductCardsWithRetry\s*\?\?\s*getCachedProductCards/
    )
    assert.match(
      loaderSource,
      /productHandle: currentHandle/
    )
    assert.match(cachedCardsSource, /'use cache: remote'/)
    assert.match(cachedCardsSource, /productHandle: string/)
    assert.match(cachedCardsSource, /cacheTag\(TAGS\.products\)/)
    assert.match(cachedCardsSource, /cacheLife\('collections'\)/)
    assert.match(cachedCardsSource, /fetchProductCardsWithRetry/)
  }
)
