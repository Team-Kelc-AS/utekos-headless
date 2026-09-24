import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import test from 'node:test'

const repoRoot = process.cwd()

async function readSource(relativePath: string): Promise<string> {
  return readFile(join(repoRoot, relativePath), 'utf8')
}

test('TechDown intro keeps commerce interactive and does not load media', async () => {
  const [introSource, headerSource, stylesheet] = await Promise.all([
    readSource('src/app/(techdown)/produkter/techdown/TechdownIntro.tsx'),
    readSource('src/app/(techdown)/produkter/techdown/TechdownHeader.tsx'),
    readSource('src/app/(techdown)/produkter/techdown/techdown.module.css')
  ])

  assert.match(
    introSource,
    /<StickyCTAEntranceContext value=\{true\}>/,
    'The purchase surface must be ready without waiting for an intro phase'
  )
  assert.doesNotMatch(
    introSource,
    /\binert\s*=/,
    'The server-rendered TechDown stage must never start inert'
  )
  assert.doesNotMatch(
    headerSource,
    /\binert\s*=/,
    'The TechDown header must be interactive immediately'
  )
  assert.doesNotMatch(
    introSource,
    /<video|\bposter=|intro_dark\.(?:webm|mp4|gif)/,
    'The introductory layer must not contend with the gallery for LCP'
  )
  assert.match(
    stylesheet,
    /\.intro\s*\{[\s\S]*?pointer-events:\s*none;/,
    'The visual transition must not intercept input'
  )
  assert.match(
    stylesheet,
    /\.header\s*\{[\s\S]*?position:\s*relative;/,
    'The header must scroll with the page like the rest of the canvas'
  )
  assert.doesNotMatch(
    stylesheet,
    /\.header\s*\{[\s\S]*?position:\s*(fixed|sticky);/,
    'The header must not remain pinned while the page scrolls'
  )
})
