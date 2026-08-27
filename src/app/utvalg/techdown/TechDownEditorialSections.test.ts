import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

const routeDirectory = new URL('./', import.meta.url)

function readRouteFile(fileName: string) {
  return readFileSync(new URL(fileName, routeDirectory), 'utf8')
}

test('keeps editorial copy in MDX and layout in server components', () => {
  const page = readRouteFile('page.mdx')
  const modes = readRouteFile('ModesSection.mdx')
  const material = readRouteFile('MaterialSection.mdx')

  assert.match(page, /<ModesSection \/>/)
  assert.match(page, /<MaterialSection \/>/)
  assert.match(modes, /<TechDownModesSection>/)
  assert.match(material, /<TechDownMaterialSection>/)
  assert.match(material, /<MdxCallout/)
  assert.match(modes, /<MdxAction/)
})

test('uses only authentic local TechDown assets in the two sections', () => {
  const modes = readRouteFile('TechDownModesSection.tsx')
  const material = readRouteFile('TechDownMaterialSection.tsx')
  const implementation = `${modes}\n${material}`

  assert.doesNotMatch(implementation, /cdn\.shopify\.com/)
  assert.doesNotMatch(implementation, /https?:\/\//)
  assert.equal(
    (
      implementation.match(/@\/assets\/images\/techdown\//g) ??
      []
    ).length,
    5
  )
  assert.match(implementation, /aria-labelledby=/)
  assert.match(implementation, /<figcaption/)
})
