import assert from 'node:assert/strict'
import test from 'node:test'
import { canonicalEventEnvelopeSchema } from './canonicalEventEnvelope'

const envelope = {
  schema_version: 1 as const,
  event_name: 'page_view',
  event_id: 'd8b18b30-9ce4-4a55-b40f-ffbc3bda9aa7',
  event_time: '2026-07-15T12:34:56.789Z',
  source: 'web' as const,
  environment: 'test' as const,
  consent: {
    analytics: 'denied' as const,
    marketing: 'denied' as const,
    preferences: 'denied' as const,
    source: 'cookiebot' as const,
    version: '1'
  }
}

test('parses the shared canonical event envelope', () => {
  assert.deepEqual(
    canonicalEventEnvelopeSchema.parse(envelope),
    envelope
  )
})

test('supports browser, server, and webhook ownership without requiring a page URL', () => {
  for (const source of ['web', 'server', 'webhook'] as const) {
    const parsed = canonicalEventEnvelopeSchema.parse({
      ...envelope,
      source
    })

    assert.equal(parsed.source, source)
    assert.equal(parsed.page_url, undefined)
  }
})

test('rejects unknown canonical event envelope fields', () => {
  assert.throws(
    () =>
      canonicalEventEnvelopeSchema.parse({
        ...envelope,
        provider_payload: {}
      }),
    /Unrecognized key/
  )
})

test('accepts internal journey UUIDs in the canonical envelope', () => {
  const parsed = canonicalEventEnvelopeSchema.parse({
    ...envelope,
    journey_id: '11111111-1111-4111-8111-111111111111',
    previous_page_view_id: '22222222-2222-4222-8222-222222222222'
  })

  assert.equal(
    parsed.journey_id,
    '11111111-1111-4111-8111-111111111111'
  )
  assert.equal(
    parsed.previous_page_view_id,
    '22222222-2222-4222-8222-222222222222'
  )
})

test('accepts a bounded PII-free experiment assignment', () => {
  const parsed = canonicalEventEnvelopeSchema.parse({
    ...envelope,
    experiment: {
      key: 'skreddersy-varmen-layout-v1',
      variant: 'legacy'
    }
  })

  assert.deepEqual(parsed.experiment, {
    key: 'skreddersy-varmen-layout-v1',
    variant: 'legacy'
  })
})
