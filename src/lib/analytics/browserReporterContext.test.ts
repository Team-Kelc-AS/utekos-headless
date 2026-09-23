import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

const source = readFileSync(
  new URL('./browserReporterContext.ts', import.meta.url),
  'utf8'
)

test('can omit viewport geometry without changing the default context contract', () => {
  assert.match(
    source,
    /\{ includeViewport = true \}: BrowserReporterContextOptions = \{\}/
  )
  assert.match(
    source,
    /\.\.\.\(includeViewport \?\s*\{\s*viewportHeight: window\.innerHeight,\s*viewportWidth: window\.innerWidth\s*\}\s*: \{\}\)/
  )
})
