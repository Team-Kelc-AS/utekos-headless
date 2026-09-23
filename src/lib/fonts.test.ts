import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import test from 'node:test'

const repoRoot = process.cwd()

async function readSource(relativePath: string) {
  return readFile(join(repoRoot, relativePath), 'utf8')
}

const layoutPaths = [
  'src/app/(store)/layout.tsx',
  'src/app/(techdown)/layout.mdx',
  'src/app/skreddersy-varmen/layout.tsx',
  'src/app/canonical-control/layout.tsx'
]

test('Google Sans Flex is configured once and skips missing capsize metrics', async () => {
  const fonts = await readSource('src/lib/fonts.ts')

  assert.match(
    fonts,
    /from 'next\/font\/google'/,
    'Brand sans must use the Next.js Google font loader'
  )
  assert.match(
    fonts,
    /Google_Sans_Flex\(\{[\s\S]*?adjustFontFallback:\s*false/,
    'Missing capsize metrics must not generate a Next fallback font'
  )
  assert.doesNotMatch(
    fonts,
    /weight:\s*\[/,
    'Variable Google Sans Flex should not download discrete static weights'
  )
})

test('root layouts reuse the shared Google Sans Flex instance', async () => {
  for (const layoutPath of layoutPaths) {
    const layout = await readSource(layoutPath)

    assert.match(
      layout,
      /import \{ googleSansFlex \} from '@\/lib\/fonts'/,
      `${layoutPath} must import the shared font`
    )
    assert.doesNotMatch(
      layout,
      /Google_Sans_Flex\(/,
      `${layoutPath} must not instantiate Google Sans Flex again`
    )
    assert.match(
      layout,
      /googleSansFlex\.variable/,
      `${layoutPath} must apply the shared font CSS variable`
    )
  }
})
