import assert from 'node:assert/strict'
import test from 'node:test'
import { GET } from './route'

test('homepage Markdown returns 200 with Markdown content type and Vary: Accept', async () => {
  const response = await GET()
  assert.equal(response.status, 200)
  assert.equal(response.headers.get('Content-Type'), 'text/markdown; charset=utf-8')
  const vary =
    response.headers.get('Vary')?.split(',').map(v => v.trim()) ?? []
  assert.ok(vary.includes('Accept'))
  const body = await response.text()
  assert.ok(body.length > 500)
  assert.match(body, /^# Utekos/m)
  assert.match(body, /https:\/\/utekos\.no\/llms\.txt/)
  assert.match(body, /https:\/\/utekos\.no\/sitemap\.xml/)
})

test('homepage Markdown has a canonical link header', async () => {
  const response = await GET()
  assert.match(response.headers.get('Link') ?? '', /<https:\/\/utekos\.no\/>; rel="canonical"/)
})
