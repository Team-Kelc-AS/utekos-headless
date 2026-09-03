import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

const source = readFileSync(
  new URL(
    '../../src/components/analytics/MetaBrowserTransportLoader.tsx',
    import.meta.url
  ),
  'utf8'
)
const publicPixelSource = readFileSync(
  new URL(
    '../../public/analytics/meta-pixel-canonical-v1.js',
    import.meta.url
  ),
  'utf8'
)

test('loads Meta Pixel through next/script only after consent', () => {
  assert.match(source, /^'use client'/)
  assert.match(source, /from 'next\/script'/)
  assert.match(source, /hasCookiebotMarketingConsent/)
  assert.match(source, /consentState !== 'granted'/)
  assert.match(source, /id='meta-pixel-canonical-browser'/)
  assert.match(source, /strategy='afterInteractive'/)
  assert.doesNotMatch(source, /signals-gateway-pixel-sdk/)
  assert.doesNotMatch(source, /signals\.utekos\.no/)
})

test('preserves rejected-consent event isolation', () => {
  assert.match(source, /discardRejectedMetaBrowserEvents/)
})

test('keeps direct CAPI as the only Meta server transport', () => {
  assert.doesNotMatch(publicPixelSource, /\bw\.cbq\s*\(/)
})
