import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import test from 'node:test'

const repoRoot = process.cwd()

async function readSource(relativePath: string) {
  return readFile(join(repoRoot, relativePath), 'utf8')
}

test('overlapped manifesto copy stays out of first-viewport LCP', async () => {
  const theatreCss = await readSource(
    'src/app/skreddersy-varmen/components/SkreddersyVarmenTheatre.module.css'
  )

  assert.match(
    theatreCss,
    /\.empathyPromotion\s*\{\s*margin-top:\s*-200svh;/,
    'Theatre overlap under the sticky hero must remain'
  )

  assert.match(
    theatreCss,
    /\.empathyMomentScene \.empathyManifestoText\s*\{[\s\S]*?opacity:\s*0;[\s\S]*?animation-timeline:\s*--hero-reveal-track;/,
    'Mobile manifesto must stay opacity 0 until the hero lift reveals it'
  )

  assert.match(
    theatreCss,
    /\.empathyLargeMomentScene \.empathyLargeManifestoText\s*\{[\s\S]*?opacity:\s*0;[\s\S]*?animation-timeline:\s*--hero-reveal-track;/,
    'Large manifesto must stay opacity 0 until the hero lift reveals it'
  )

  assert.match(
    theatreCss,
    /@keyframes skreddersy-empathy-overlapped-copy-arm\s*\{[\s\S]*?from\s*\{[\s\S]*?opacity:\s*0;[\s\S]*?to\s*\{[\s\S]*?opacity:\s*1;/,
    'Overlapped copy must arm to full opacity as the hero lifts'
  )
})

test('hero headline is the intentional first-screen text LCP', async () => {
  const hero = await readSource(
    'src/app/skreddersy-varmen/components/Hero.tsx'
  )
  const layout = await readSource('src/app/layout.tsx')
  const fonts = await readSource('src/app/fonts/font.config.ts')

  assert.match(
    hero,
    /id=['"]hero-headline['"]/,
    'Hero must keep a stable headline id for LCP'
  )
  assert.match(
    hero,
    /id=['"]hero-headline['"][\s\S]*?font-sans/,
    'Hero headline must use the preloaded UI sans'
  )
  assert.doesNotMatch(
    hero,
    /id=['"]hero-headline['"][\s\S]*?(will-animate-|opacity-0|invisible)/,
    'Hero headline must paint immediately'
  )

  assert.match(
    layout,
    /Google_Sans_Flex\(\{[\s\S]*?preload:\s*true/,
    'Google Sans Flex must preload so the hero headline can win text LCP'
  )
  assert.match(
    fonts,
    /export const utekosTextMedium = localFont\(\{[\s\S]*?preload:\s*false/,
    'Later-scene Utekos Text Medium must stay off the critical path'
  )
})
