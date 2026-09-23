import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

function source(path: string) {
  return readFileSync(new URL(path, import.meta.url), 'utf8')
}

const galleryImages = source(
  '../../src/app/(techdown)/produkter/techdown/techdownImages.ts'
)
const gallery = source(
  '../../src/app/(techdown)/produkter/techdown/TechdownGallery.tsx'
)
const content = source(
  '../../src/app/(techdown)/produkter/techdown/TechdownContent.tsx'
)
const layout = source('../../src/app/(techdown)/layout.mdx')
const sizeSelector = source(
  '../../src/app/(techdown)/produkter/techdown/TechdownSizeSelectorClient.tsx'
)
const stickyStyles = source(
  '../../src/components/commerce/StickyCTA/StickyCTA.module.css'
)

test('uses explicit public gallery URLs and intrinsic dimensions without static imports', () => {
  assert.doesNotMatch(
    galleryImages,
    /^import .* from ['"].*images/m
  )
  assert.match(
    galleryImages,
    /const galleryPath = '\/images\/techdown\/gallery'/
  )
  assert.match(
    galleryImages,
    /main: `\$\{galleryPath\}\/main\/\$\{id\}\.webp`/
  )
  assert.match(
    galleryImages,
    /thumbnail: `\$\{galleryPath\}\/thumbnails\/\$\{thumbnail\}\.jpg`/
  )
  assert.match(gallery, /width=\{image\.width\}/)
  assert.match(gallery, /height=\{image\.height\}/)
  assert.match(gallery, /placeholder='empty'/)
})

test('keeps the visible review and size labels in their accessible names', () => {
  assert.match(
    content,
    /aria-label=\{`\$\{ratingValue\.toFixed\(1\)\}\/5 · \$\{reviewCount\} anmeldelser\. Gå til anmeldelser\.`\}/
  )
  assert.match(
    sizeSelector,
    /aria-label=\{`\$\{choice\.label\}\$\{choice\.available \? '' : ', utsolgt'\}`\}/
  )
})

test('ships a TechDown description and high-contrast Sticky CTA detail text', () => {
  assert.match(layout, /description:/)
  assert.match(layout, /Utekos TechDown™/)
  for (const selector of [
    'sizeLabel',
    'priceSeparator',
    'price strong'
  ]) {
    const rule = stickyStyles.match(
      new RegExp(
        `\\.${selector.replace(' ', '\\ ')} \\{[^}]*\\}`,
        's'
      )
    )?.[0]
    assert.match(
      rule ?? '',
      /color: var\(--primary-foreground, #fff\)/
    )
  }
})
