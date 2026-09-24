import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

// NOTE: source-based on purpose – importing the route pulls
// `@/assets/images/about/erling-messe.webp` through magazineArticles,
// which tsx cannot load. Same pattern as page.mdx.test.ts.
const source = (path: string) =>
  readFileSync(new URL(path, import.meta.url), 'utf8')

test('llms.txt names best-fit jobs and how an agent should call', () => {
  const route = source('./route.ts')
  assert.match(route, /## Når du bør bruke Utekos/)
  assert.match(route, /Sammenligne Utekos-modeller/)
  assert.match(route, /Velge størrelse/)
  assert.match(route, /frakt, retur, refusjon/)
  assert.match(route, /Slik kaller du oss/)
  assert.match(route, /https:\/\/utekos\.no\/llms-full\.txt/)
  assert.match(route, /aldri pris eller lager fra denne filen/)
})

test('llms.txt GET serves the built body as plain text', () => {
  const route = source('./route.ts')
  assert.match(route, /export function buildLlmsTxt\(\): string/)
  assert.match(route, /new Response\(buildLlmsTxt\(\),/)
  assert.match(route, /'Content-Type': 'text\/plain; charset=utf-8'/)
})
