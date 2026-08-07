import assert from 'node:assert/strict'
import { existsSync } from 'node:fs'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import test from 'node:test'

const repoRoot = process.cwd()

async function readSource(
  relativePath: string
): Promise<string> {
  return readFile(join(repoRoot, relativePath), 'utf8')
}

test(
  'PDP renders ProductGallery directly from the server component',
  async () => {
    const source = await readSource(
      'src/app/produkter/[handle]/components/ProductPageView.tsx'
    )

    assert.match(
      source,
      /import\s+\{\s*ProductGallery\s*\}\s+from\s+['"]@\/components\/jsx\/ProductGallery['"]/,
      'ProductPageView must import ProductGallery directly'
    )

    assert.doesNotMatch(
      source,
      /ProductGalleryClient/,
      'ProductPageView must not retain the redundant ProductGalleryClient wrapper'
    )

    assert.match(
      source,
      /<ProductGallery[\s\S]*?title=\{title\}[\s\S]*?\/>/,
      'ProductPageView must render ProductGallery directly'
    )
  }
)

test(
  'redundant ProductGalleryClient wrapper no longer exists',
  () => {
    const wrapperPath = join(
      repoRoot,
      'src/app/produkter/[handle]/components/ProductGalleryClient.tsx'
    )

    assert.equal(
      existsSync(wrapperPath),
      false,
      'ProductGalleryClient.tsx must be deleted'
    )
  }
)

test(
  'desktop gallery grid remains a Server Component',
  async () => {
    const source = await readSource(
      'src/app/produkter/[handle]/components/ProductGalleryGrid.tsx'
    )

    assert.doesNotMatch(
      source,
      /^\s*['"]use client['"]/m,
      'ProductGalleryGrid must not introduce a Client Component boundary'
    )

    assert.match(
      source,
      /quality=\{\s*90\s*\}/,
      'Desktop gallery images must use quality 90'
    )

    assert.match(
      source,
      /fetchPriority=\{\s*isAboveFoldGridImage\s*\?\s*['"]high['"]\s*:\s*['"]auto['"]\s*\}/,
      'Above-fold desktop images must retain high fetch priority'
    )

    assert.doesNotMatch(
      source,
      /\bloading\s*=/,
      'Desktop grid must not force responsive duplicates to eager-load'
    )
  }
)

test(
  'interactive carousel owns the Client Component boundary',
  async () => {
    const source = await readSource(
      'src/components/jsx/ProductGallery.tsx'
    )

    assert.match(
      source,
      /^\s*['"]use client['"]/m,
      'Interactive ProductGallery must remain a Client Component'
    )

    assert.doesNotMatch(
      source,
      /from\s+['"]next\/dynamic['"]/,
      'ProductGallery must not use client-only dynamic rendering'
    )

    assert.doesNotMatch(
      source,
      /ssr\s*:\s*false/,
      'ProductGallery must remain server-prerenderable'
    )

    assert.match(
      source,
      /quality=\{\s*90\s*\}/,
      'ProductGallery images must use quality 90'
    )

    assert.match(
      source,
      /fetchPriority=\{\s*index\s*===\s*0\s*\?\s*['"]high['"]\s*:\s*['"]auto['"]\s*\}/,
      'First carousel image must retain high fetch priority'
    )

    assert.doesNotMatch(
      source,
      /\bloading\s*=/,
      'Responsive carousel images must use native default loading behavior'
    )
  }
)