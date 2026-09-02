import assert from 'node:assert/strict'
import test from 'node:test'
import { readSignalsGatewayPixelConfig } from './signalsGatewayPixelConfig'

test('keeps Signals Gateway Pixel disabled unless explicitly enabled', () => {
  assert.deepEqual(readSignalsGatewayPixelConfig({}), {
    enabled: false,
    host: 'https://signals.utekos.no/',
    pixelId: '1633085772154426486',
    startupTimeoutMs: 2500
  })
})

test('enables only the verified Utekos Signals Gateway Pixel', () => {
  assert.deepEqual(
    readSignalsGatewayPixelConfig({
      SIGNALS_GATEWAY_PIXEL_ENABLED: 'true'
    }),
    {
      enabled: true,
      host: 'https://signals.utekos.no/',
      pixelId: '1633085772154426486',
      startupTimeoutMs: 2500
    }
  )
})

test('rejects ambiguous feature flag values', () => {
  assert.throws(() =>
    readSignalsGatewayPixelConfig({
      SIGNALS_GATEWAY_PIXEL_ENABLED: 'TRUE'
    })
  )
})
