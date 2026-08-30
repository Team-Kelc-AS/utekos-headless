import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import { fileURLToPath } from 'node:url'

const pageSource = readFileSync(
  fileURLToPath(new URL('./page.mdx', import.meta.url)),
  'utf8'
)

test('teknologi-materialer page is thin MDX composition around the document', () => {
  assert.match(pageSource, /export const metadata/u)
  assert.match(pageSource, /<TechHero \/>/u)
  assert.match(pageSource, /<TechMaterialsModeCards \/>/u)
  assert.match(pageSource, /<TechMaterialsDocument \/>/u)
  assert.match(pageSource, /<TechMaterialsProductCarousel \/>/u)
  assert.match(pageSource, /<NavigationCTA \/>/u)
  assert.doesNotMatch(pageSource, /import type/u)
  assert.doesNotMatch(pageSource, /^## /mu)
  assert.doesNotMatch(pageSource, /TechMaterialsArticle/u)
  assert.doesNotMatch(pageSource, /ProductSpecsView/u)
  assert.doesNotMatch(pageSource, /technologyGroups/u)
})
