import assert from 'node:assert/strict'
import test from 'node:test'
import { GET, resolveAgentMarkdown } from './route'

const markdownRequest = (path: string) =>
  new Request(`https://utekos.no/api/agent-md?path=${encodeURIComponent(path)}`, {
    headers: { Accept: 'text/markdown' }
  })

test('unknown path returns 404 with a helpful Markdown body', async () => {
  const response = await GET(markdownRequest('/__ora-404-probe-7071hjsx'))
  assert.equal(response.status, 404)
  assert.equal(response.headers.get('Content-Type'), 'text/markdown; charset=utf-8')
  const vary =
    response.headers.get('Vary')?.split(',').map(v => v.trim()) ?? []
  assert.ok(vary.includes('Accept'))
  const body = await response.text()
  assert.ok(body.length >= 20)
  assert.match(body, /404/)
  assert.match(body, /https:\/\/utekos\.no\//)
  assert.match(body, /https:\/\/utekos\.no\/sitemap\.xml/)
  assert.match(body, /https:\/\/utekos\.no\/llms\.txt/)
})

test('homepage path resolves to the homepage Markdown with 200', () => {
  const { body, status } = resolveAgentMarkdown('/')
  assert.equal(status, 200)
  assert.match(body, /^# Utekos/m)
})

test('known sections return a 200 pointer, never a false 404', () => {
  for (const path of [
    '/produkter/utekos-techdown',
    '/magasinet',
    '/om-oss',
    '/skreddersy-varmen',
    '/handlehjelp/storrelsesguide'
  ]) {
    const { body, status } = resolveAgentMarkdown(path)
    assert.equal(status, 200, path)
    assert.match(body, new RegExp(`https://utekos\\.no${path.replaceAll('/', '\\/')}`))
  }
})

test('paths without a leading slash are normalized', () => {
  const { status } = resolveAgentMarkdown('finnes-ikke-her')
  assert.equal(status, 404)
})
