import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import { fileURLToPath } from 'node:url'

const documentSource = readFileSync(
  fileURLToPath(new URL('./havdypMaritimeBlue.mdx', import.meta.url)),
  'utf8'
)
const documentWrapperSource = readFileSync(
  fileURLToPath(
    new URL('./HavdypColorGuideDocument.tsx', import.meta.url)
  ),
  'utf8'
)
const dialogSource = readFileSync(
  fileURLToPath(
    new URL('./HavdypColorGuideDialog.tsx', import.meta.url)
  ),
  'utf8'
)
const colorSelectorSource = readFileSync(
  fileURLToPath(
    new URL('../jsx/ColorSelector.tsx', import.meta.url)
  ),
  'utf8'
)
const purchaseIslandSource = readFileSync(
  fileURLToPath(
    new URL(
      '../../app/produkter/[handle]/components/ProductPurchaseIsland.tsx',
      import.meta.url
    )
  ),
  'utf8'
)

test('Havdyp color guide lives in MDX only', () => {
  assert.match(documentSource, /# Om Havdyp - Maritime Blue/)
  assert.match(documentSource, /\*\*Fargenummer:\*\* 19-3831 TCX/)
  assert.match(documentSource, /\*\*Fargenavn:\*\* Maritime Blue/)
  assert.match(documentSource, /\*\*Fargesystem:\*\* Fashion, Home \+ Interiors/)
  assert.match(documentSource, /\*\*Fargebibliotek:\*\* Cotton TCX/)
  assert.match(documentSource, /\*\*Fargefamilie:\*\* Lilla/)
  assert.match(
    documentSource,
    /\*\*Stemning:\*\* Klar, rolig, selvsikker og moderne\./
  )
  assert.match(documentSource, /https:\/\/www\.pantone\.com\//)
  assert.match(documentSource, /https:\/\/modeinfo\.com\//)
  assert.match(documentSource, /<HavdypColorGuideSwatch \/>/)
  assert.doesNotMatch(documentSource, /[—–]/)
})

test('color guide swatch uses the Maritime Blue Pantone still', () => {
  const swatchSource = readFileSync(
    fileURLToPath(
      new URL('./HavdypColorGuideSwatch.tsx', import.meta.url)
    ),
    'utf8'
  )

  assert.match(
    swatchSource,
    /MARITIME_BLUE_PANTONE-19-3831_TCX\.png/
  )
  assert.match(swatchSource, /from 'next\/image'/)
})

test('color guide dialog renders the MDX document', () => {
  assert.match(
    documentWrapperSource,
    /from '\.\/havdypMaritimeBlue\.mdx'/
  )
  assert.match(dialogSource, /HavdypColorGuideDocument/)
  assert.match(dialogSource, /Les om fargen/)
  assert.match(dialogSource, /from '@\/components\/ui\/dialog'/)
})

test('Les om fargen sits next to the Havdyp color card', () => {
  assert.match(colorSelectorSource, /HavdypColorGuideDialog/)
  assert.match(colorSelectorSource, /isHavdypColor/)
})

test('Farge and Størrelse labels use larger primary type', () => {
  assert.match(
    purchaseIslandSource,
    /font-utekos-text-medium text-lg text-primary md:sr-only/
  )
  assert.doesNotMatch(
    purchaseIslandSource,
    /text-sm text-foreground\/72 md:sr-only/
  )
})
