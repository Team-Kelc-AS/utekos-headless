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
  'ProductHeader renders the product H1 without an animation dependency',
  async () => {
    const source = await readSource(
      'src/app/produkter/[handle]/components/ProductHeader.tsx'
    )

    assert.doesNotMatch(
      source,
      /AnimatedBlock/,
      'ProductHeader must not depend on AnimatedBlock'
    )

    assert.doesNotMatch(
      source,
      /will-animate-/,
      'ProductHeader must not use hidden pre-animation classes'
    )

    assert.doesNotMatch(
      source,
      /^\s*['"]use client['"]/m,
      'ProductHeader must remain a Server Component'
    )

    assert.match(
      source,
      /<h1[\s\S]*?\{productTitle\}[\s\S]*?<\/h1>/,
      'ProductHeader must render productTitle directly in an H1'
    )

    assert.match(
      source,
      /className=['"]min-w-0 flex-1['"]/,
      'ProductHeader must retain the previous layout wrapper without animation'
    )
  }
)

test(
  'mobile ProductHeader renders without an AnimatedBlock wrapper',
  async () => {
    const source = await readSource(
      'src/app/produkter/[handle]/components/ProductPageView.tsx'
    )

    assert.doesNotMatch(
      source,
      /will-animate-fade-in-up mt-6 md:hidden/,
      'Mobile ProductHeader must not retain its scroll-animation wrapper'
    )

    assert.match(
      source,
      /<div\s+className=['"]mt-6 md:hidden['"]>\s*<ProductHeader/,
      'Mobile ProductHeader must render inside a static responsive wrapper'
    )

    const productHeaderInstances =
      source.match(/<ProductHeader\b/g) ?? []

    assert.equal(
      productHeaderInstances.length,
      2,
      'PDP must retain exactly its mobile and desktop ProductHeader renders'
    )
  }
)

test(
  'non-LCP PDP content may retain its existing animations',
  async () => {
    const source = await readSource(
      'src/app/produkter/[handle]/components/ProductPageView.tsx'
    )

    assert.match(
      source,
      /will-animate-fade-in-right/,
      'STEP 6 must not remove unrelated PDP animations'
    )

    assert.match(
      source,
      /import\s+\{\s*AnimatedBlock\s*\}\s+from\s+['"]@\/components\/AnimatedBlock['"]/,
      'AnimatedBlock remains available for non-LCP content'
    )
  }
)