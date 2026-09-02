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

test('loads Signals Gateway through next/script only after consent', () => {
  assert.match(source, /^'use client'/)
  assert.match(source, /from 'next\/script'/)
  assert.match(source, /hasCookiebotMarketingConsent/)
  assert.match(source, /consentState !== 'granted'/)
  assert.match(source, /id='signals-gateway-pixel-sdk'/)
  assert.match(source, /strategy='afterInteractive'/)
  assert.match(source, /onLoad=/)
  assert.match(source, /onError=/)
})

test('preserves canonical Meta and Signals Gateway ownership', () => {
  assert.match(source, /prepareSignalsGatewayPixelQueue/)
  assert.match(source, /initializeSignalsGatewayPixel/)
  assert.match(source, /id='meta-pixel-canonical-browser'/)
  assert.doesNotMatch(source, /cbq\s*\(\s*['"]track/)
  assert.doesNotMatch(source, /cbq\s*\(\s*['"]trackCustom/)
})

test('keeps Meta Pixel available when Gateway startup fails', () => {
  assert.match(
    source,
    /gatewayLoadState === 'failed'[\s\S]*gatewayLoadState === 'ready'/
  )
  assert.match(source, /startup timed out/)
  assert.match(source, /setGatewayLoadState\('failed'\)/)
})
