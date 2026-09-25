import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import test from 'node:test'

const repoRoot = process.cwd()

test('TechDown product options use the webhook-invalidated remote cache', async () => {
  const source = await readFile(
    join(
      repoRoot,
      'src/api/lib/products/fetchProductOptions.ts'
    ),
    'utf8'
  )

  assert.match(source, /'use cache: remote'/)
  assert.match(
    source,
    /cacheTag\(`product-\$\{parsedVariables\.handle\}`, TAGS\.products\)/
  )
  assert.match(source, /cacheLife\('max'\)/)
  assert.match(source, /cache:\s*'no-store'/)
})
