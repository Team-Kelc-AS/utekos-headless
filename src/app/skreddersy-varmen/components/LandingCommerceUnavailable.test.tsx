import assert from 'node:assert/strict'
import test from 'node:test'
import { renderToStaticMarkup } from 'react-dom/server'

async function loadFallback() {
  return import('./LandingCommerceUnavailable').catch(() => null)
}

test('renders an honest commerce fallback without price or purchase action', async () => {
  const fallbackModule = await loadFallback()

  assert.ok(
    fallbackModule,
    'the commerce-unavailable component must be implemented'
  )

  const markup = renderToStaticMarkup(
    <fallbackModule.LandingCommerceUnavailable />
  )

  assert.match(markup, /Kjøpsvalget er midlertidig utilgjengelig/)
  assert.match(markup, /Shopify/)
  assert.doesNotMatch(markup, /\b\d[\d\s.,]*\s?kr\b/i)
  assert.doesNotMatch(markup, /<button\b|Legg i handlekurv|Kjøp nå/i)
})
