import assert from 'node:assert/strict'
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
  'PDP carousel is server prerendered instead of being client-only',
  async () => {
    const source = await readSource(
      'src/app/produkter/[handle]/components/ProductGalleryClient.tsx'
    )

    assert.doesNotMatch(
      source,
      /from\s+['"]next\/dynamic['"]/,
      'PDP gallery must not use next/dynamic'
    )

    assert.doesNotMatch(
      source,
      /ssr\s*:\s*false/,
      'PDP gallery must not disable server prerendering'
    )

    assert.match(
      source,
      /import\s+\{\s*ProductGallery\s*\}\s+from\s+['"]@\/components\/jsx\/ProductGallery['"]/,
      'ProductGallery must be imported statically'
    )

    assert.match(
      source,
      /<ProductGallery\s+\{\.\.\.props\}\s*\/>/,
      'ProductGalleryClient must render ProductGallery directly'
    )
  }
)

test(
  'carousel LCP image is discoverable without forcing responsive duplicates eager',
  async () => {
    const source = await readSource(
      'src/components/jsx/ProductGallery.tsx'
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
      'Responsive carousel images must use native default lazy loading'
    )

    assert.doesNotMatch(
      source,
      /quality=\{\s*100\s*\}/,
      'ProductGallery must not request quality 100'
    )
  }
)

test(
  'desktop grid avoids eager-loading the hidden responsive variant',
  async () => {
    const source = await readSource(
      'src/app/produkter/[handle]/components/ProductGalleryGrid.tsx'
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
      'Desktop grid must not eagerly load while hidden on mobile'
    )

    assert.doesNotMatch(
      source,
      /quality=\{\s*95\s*\}/,
      'Desktop grid must not retain quality 95'
    )
  }
)