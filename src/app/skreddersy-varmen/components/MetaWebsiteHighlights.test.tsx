import assert from 'node:assert/strict'
import test from 'node:test'
import { renderToStaticMarkup } from 'react-dom/server'
import { MetaWebsiteHighlights } from './MetaWebsiteHighlights'

const EXPECTED_IMAGE_PATHS = [
  '/Utekos-Partner-2160x2160.jpg',
  '/Utekos-TechDown-Terrasse-Master.jpg',
  '/Utekos-TechDown-Partner-1080x1350.jpg',
  '/Utekos-Partner-1080x1920.jpg',
  '/Utekos-TechDown-Partner-2-1080x1920.jpg',
  '/Utekos-TechDown-Partner-1080x1920.jpg'
] as const

test('emits direct, hidden website-highlight image URLs in the server HTML', () => {
  const markup = renderToStaticMarkup(<MetaWebsiteHighlights />)

  assert.match(markup, /^<div class="hidden" aria-hidden="true">/)
  assert.equal((markup.match(/<img /g) ?? []).length, 6)
  assert.equal((markup.match(/loading="lazy"/g) ?? []).length, 6)
  assert.equal((markup.match(/alt=""/g) ?? []).length, 6)
  assert.doesNotMatch(markup, /\/_next\/image/)
  assert.doesNotMatch(markup, /srcSet|srcset/)

  for (const imagePath of EXPECTED_IMAGE_PATHS) {
    assert.match(markup, new RegExp(`src="${imagePath}"`))
  }
})
