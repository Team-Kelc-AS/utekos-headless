import { TECH_DOWN_MEASUREMENT_ROWS } from '@/lib/products/techDownSizes'
import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import test from 'node:test'
import { comfyrobeData, utekosData } from './utils/data'
import { techDownFaq } from './utils/techDownFaq'
import { sizeExchangeCopy } from '@/lib/policies/returnPolicy'
import { getProductSizeGuideContent } from '@/lib/products/presentation/getProductSizeGuideContent'

const source = (path: string) =>
  readFileSync(new URL(path, import.meta.url), 'utf8')

test('published size guide has a working policy link, no editorial notes and matching Comfyrobe labels', () => {
  const page = source('./page.mdx')
  assert.match(
    page,
    /\[Les hele returpolicyen her\]\(\/frakt-og-retur\)/
  )
  assert.doesNotMatch(
    page,
    /Hvorfor denne strukturen fungerer|Mindre kognitiv belastning|Størrelsestabel<|godbevegelsesfrihet/
  )
  const comfyrobe =
    page
      .split('<section id="comfyrobe"')[1]
      ?.split('</section>')[0] ?? ''
  for (const size of getProductSizeGuideContent('comfyrobe')
    .columns)
    assert.ok(comfyrobe.includes(`### Velg ${size} hvis...`))
  assert.doesNotMatch(comfyrobe, /### Velg M hvis|XS\/S|L\/XL/)
})

test('size guide is a single content-first MDX article with eight imported FAQs', () => {
  assert.equal(
    existsSync(new URL('./page.mdx', import.meta.url)),
    true
  )
  assert.equal(
    existsSync(new URL('./page.tsx', import.meta.url)),
    false
  )
  const page = source('./page.mdx')
  assert.equal(page.match(/<article\b/g)?.length, 1)
  assert.doesNotMatch(source('./layout.tsx'), /<article\b/)
  assert.match(
    page,
    /import \{ SizeGuideFaq \} from '\.\/components\/SizeGuideFaq'/
  )
  assert.match(page, /<SizeGuideFaq\s*\/>/)
  assert.doesNotMatch(page, /<details\b|<summary\b/)
  assert.doesNotMatch(
    page,
    /use client|Accordion|EU M<|Middels · EU/
  )
  const faq = source('./components/SizeGuideFaq.tsx')
  assert.match(faq, /from '@\/components\/ui\/accordion'/)
  assert.match(faq, /techDownFaq\.map/)
})

test('visible FAQ is word-for-word identical to the eight JSON-LD answers', () => {
  const faq = source('./components/SizeGuideFaq.tsx')
  assert.match(
    faq,
    /<SizeGuideFaqAnswer answer=\{item\.answer\}/
  )
  assert.match(faq, /\{item\.question\}/)
  assert.equal(techDownFaq.length, 8)
  assert.match(
    source('./components/SizeGuideJsonLd.tsx'),
    /mainEntity': techDownFaq\.map/
  )
  assert.doesNotMatch(
    source('./components/SizeGuideJsonLd.tsx'),
    /Hvilken størrelse Utekos-plagg skal jeg velge/
  )
})

test('Dun, Mikrofiber and Comfyrobe keep every existing measurement', () => {
  const tables = source('./page.mdx')
    .split('<MeasurementTable')
    .slice(1)
  for (const [index, data, keys] of [
    [1, utekosData, ['m', 'l']],
    [2, comfyrobeData, ['xs', 'ml', 'lxl']]
  ] as const) {
    const table =
      tables[index]?.split('</MeasurementTable>')[0] ?? ''
    const rows = table
      .split('\n')
      .filter(line => /^\|/.test(line))
      .slice(2)
      .map(line =>
        line
          .split('|')
          .slice(1, -1)
          .map(cell => cell.trim())
      )
    assert.deepEqual(
      rows,
      data.map(row => [
        row.measurement,
        ...keys.map(key => (row as Record<string, string>)[key])
      ])
    )
  }
})

test('all exchange conditions on the MDX page match the canonical policy', () => {
  const text = source('./page.mdx')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/\s+/g, ' ')
  for (const copy of Object.values(sizeExchangeCopy))
    assert.ok(text.includes(copy), copy)
})

test('product dialog reads both size guidance and measurements from shared TypeScript', () => {
  const dialog = source(
    '../../../components/size-guide/techDownSizeGuideDocument.mdx'
  )
  assert.match(dialog, /TECH_DOWN_MEASUREMENT_ROWS\.map/)
  assert.match(dialog, /TECH_DOWN_PUBLIC_SIZE_DEFINITIONS\.map/)
  assert.doesNotMatch(dialog, /Liten|\| 162 cm/)
})

test('all 27 published TechDown values match the agreed contract and product dialog', () => {
  const expected = [
    ['162 cm', '166 cm', '170 cm'],
    ['56 cm', '58 cm', '61 cm'],
    ['82 cm', '87 cm', '92 cm'],
    ['54 cm', '60 cm', '64 cm'],
    ['73 cm', '74 cm', '75 cm'],
    ['13,5 cm', '13,5 cm', '14 cm'],
    ['35 cm', '35 cm', '35 cm'],
    ['29 cm', '29 cm', '29 cm'],
    ['8 cm', '8,5 cm', '9 cm']
  ]
  const actual = TECH_DOWN_MEASUREMENT_ROWS.map(
    row => row.values
  )
  assert.deepEqual(actual, expected)
  const dialog = getProductSizeGuideContent('techdown')
  assert.deepEqual(dialog.columns, ['Middels', 'Stor', 'Større'])
  assert.deepEqual(
    dialog.rows.map(row => row.values),
    expected
  )
  const table =
    source('./page.mdx')
      .split('<MeasurementTable')[1]
      ?.split('</MeasurementTable>')[0] ?? ''
  assert.match(table, /TECH_DOWN_MEASUREMENT_ROWS.map/)
  assert.match(table, /TECH_DOWN_PUBLIC_SIZE_DEFINITIONS.map/)
})
