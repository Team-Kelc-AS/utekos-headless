import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

const source = (path: string) =>
  readFileSync(new URL(path, import.meta.url), 'utf8')

test('app-level 404 page explains the error with help links and noindex', () => {
  const page = source('./not-found.tsx')
  assert.match(page, /<h1[^>]*>/)
  assert.match(page, /Siden ble ikke funnet/)
  assert.ok(page.length > 500)
  for (const href of [
    '/',
    '/produkter',
    '/sitemap.xml',
    '/llms.txt',
    '/kontaktskjema'
  ]) {
    assert.ok(page.includes(`href: '${href}'`), href)
  }
  assert.match(page, /index: false/)
  assert.doesNotMatch(page, /'use client'/)
})
