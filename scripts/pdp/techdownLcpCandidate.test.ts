import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

function source(path: string) {
  return readFileSync(new URL(path, import.meta.url), 'utf8')
}

const gallery = source(
  '../../src/app/(techdown)/produkter/techdown/TechdownGallery.tsx'
)
const intro = source(
  '../../src/app/(techdown)/produkter/techdown/TechdownIntro.tsx'
)
const nextConfig = source('../../next.config.mts')

test('reserves high fetch priority for the first TechDown gallery image', () => {
  assert.match(gallery, /loading='eager'/)
  assert.match(
    gallery,
    /fetchPriority=\{\s*index === 0 \? 'high'/
  )
  assert.doesNotMatch(gallery, /preload(?:=|\s)/)
})

test('keeps the intro free of LCP-competing media and poster resources', () => {
  assert.doesNotMatch(
    intro,
    /<video|poster=|preload|\.mp4|\.webm|\.gif/i
  )
})

test('negotiates AVIF before WebP through the Next image optimizer', () => {
  assert.match(
    nextConfig,
    /formats: \['image\/avif', 'image\/webp'\]/
  )
})
