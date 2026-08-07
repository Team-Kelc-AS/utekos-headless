import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import test from 'node:test'

const repoRoot = process.cwd()

async function readHeaderSource(): Promise<string> {
  return readFile(
    join(
      repoRoot,
      'src/components/header/Header.tsx'
    ),
    'utf8'
  )
}

function extractWordmarkImage(
  source: string
): string {
  const match = source.match(
    /<Image\s+[\s\S]*?src=\{wordmarkwhite\}[\s\S]*?\/>/
  )

  assert.ok(
    match,
    'Header must render the wordmarkwhite Image'
  )

  return match[0]
}

test(
  'header wordmark loads eagerly with high fetch priority',
  async () => {
    const source = await readHeaderSource()
    const wordmarkImage =
      extractWordmarkImage(source)

    assert.match(
      wordmarkImage,
      /loading=['"]eager['"]/,
      'Header wordmark must disable lazy loading'
    )

    assert.match(
      wordmarkImage,
      /fetchPriority=['"]high['"]/,
      'Header wordmark must receive high browser fetch priority'
    )

    assert.doesNotMatch(
      wordmarkImage,
      /\bpreload\b/,
      'Header wordmark must not combine preload with loading/fetchPriority'
    )

    assert.doesNotMatch(
      wordmarkImage,
      /loading=['"]lazy['"]/,
      'Header wordmark must never be lazy loaded'
    )
  }
)