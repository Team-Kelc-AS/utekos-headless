import assert from 'node:assert/strict'
import test from 'node:test'
import {
  getSnapchatConversionsApiConfig,
  isSnapchatConversionsApiConfigured
} from './snapchatConversionsApiConfig'

const ENV_KEYS = [
  'SNAPCHAT_CONVERSIONS_API_ENABLED',
  'SNAPCHAT_CONVERSIONS_API_ACCESS_TOKEN',
  'SNAPCHAT_CONVERSIONS_API_CUTOVER_AT',
  'SNAPCHAT_PIXEL_ID',
  'NEXT_PUBLIC_SNAPCHAT_PIXEL_ID'
] as const

function withEnv(
  values: Partial<Record<(typeof ENV_KEYS)[number], string>>,
  run: () => void
) {
  const previous = Object.fromEntries(
    ENV_KEYS.map(key => [key, process.env[key]])
  )
  try {
    for (const key of ENV_KEYS) delete process.env[key]
    Object.assign(process.env, values)
    run()
  } finally {
    for (const key of ENV_KEYS) {
      const value = previous[key]
      if (value === undefined) delete process.env[key]
      else process.env[key] = value
    }
  }
}

test('is disabled and secret-free by default', () => {
  withEnv({}, () => {
    assert.equal(isSnapchatConversionsApiConfigured(), false)
    assert.deepEqual(getSnapchatConversionsApiConfig(), {
      accessToken: '',
      cutoverAtMs: 0,
      enabled: false,
      pixelId: ''
    })
  })
})

test('requires matching browser/server Pixel IDs and a valid cutover', () => {
  withEnv(
    {
      SNAPCHAT_CONVERSIONS_API_ENABLED: 'true',
      SNAPCHAT_CONVERSIONS_API_ACCESS_TOKEN: 'secret-token',
      SNAPCHAT_CONVERSIONS_API_CUTOVER_AT:
        '2026-08-23T10:00:00.000Z',
      SNAPCHAT_PIXEL_ID: 'pixel-a',
      NEXT_PUBLIC_SNAPCHAT_PIXEL_ID: 'pixel-b'
    },
    () => {
      assert.equal(isSnapchatConversionsApiConfigured(), false)
      assert.throws(
        () => getSnapchatConversionsApiConfig(),
        /Pixel IDs differ/
      )
    }
  )
})

test('returns a complete fail-closed server config', () => {
  withEnv(
    {
      SNAPCHAT_CONVERSIONS_API_ENABLED: 'true',
      SNAPCHAT_CONVERSIONS_API_ACCESS_TOKEN: 'secret-token',
      SNAPCHAT_CONVERSIONS_API_CUTOVER_AT:
        '2026-08-23T10:00:00.000Z',
      SNAPCHAT_PIXEL_ID: 'pixel-a',
      NEXT_PUBLIC_SNAPCHAT_PIXEL_ID: 'pixel-a'
    },
    () => {
      assert.equal(isSnapchatConversionsApiConfigured(), true)
      assert.deepEqual(getSnapchatConversionsApiConfig(), {
        accessToken: 'secret-token',
        cutoverAtMs: Date.parse('2026-08-23T10:00:00.000Z'),
        enabled: true,
        pixelId: 'pixel-a'
      })
    }
  )
})
