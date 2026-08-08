import assert from 'node:assert/strict'
import test from 'node:test'
import {
  canonicalClickIdsSchema,
  canonicalSignalAuditSchema,
  presentCanonicalSignal,
  unavailableCanonicalSignal
} from './canonicalSignalContract'

const timestamp = '2026-07-21T12:00:00.000Z'

function existingSignalAuditFixture() {
  return {
    event_source_url: presentCanonicalSignal(
      'browser_request_url',
      timestamp
    ),
    client_ip_address: presentCanonicalSignal(
      'vercel_request_context',
      timestamp
    ),
    client_user_agent: presentCanonicalSignal(
      'vercel_request_context',
      timestamp
    ),
    external_id: presentCanonicalSignal(
      'first_party_external_id_cookie',
      timestamp
    ),
    click_ids: presentCanonicalSignal(
      'browser_request_url',
      timestamp
    ),
    meta_fbclid: presentCanonicalSignal(
      'browser_request_url',
      timestamp
    ),
    meta_fbc: presentCanonicalSignal(
      'meta_parameter_builder',
      timestamp
    ),
    meta_fbp: unavailableCanonicalSignal(
      'not_observed',
      timestamp
    )
  }
}

test('preserves case-sensitive click identifiers unchanged', () => {
  const parsed = canonicalClickIdsSchema.parse({
    fbclid: 'AbCdEf-123_XyZ',
    gclid: 'GoogleCaseSensitiveValue',
    msclkid: 'MicrosoftCaseSensitiveValue',
    snap_click_id: 'SnapCaseSensitiveValue'
  })

  assert.equal(parsed.fbclid, 'AbCdEf-123_XyZ')
  assert.equal(parsed.gclid, 'GoogleCaseSensitiveValue')
  assert.equal(parsed.msclkid, 'MicrosoftCaseSensitiveValue')
  assert.equal(parsed.snap_click_id, 'SnapCaseSensitiveValue')
})

test('rejects unknown click-id keys', () => {
  assert.throws(() =>
    canonicalClickIdsSchema.parse({ unknown_click_id: 'value' })
  )
})

test('accepts historical signal audits without Snap-specific members', () => {
  const parsed = canonicalSignalAuditSchema.parse(
    existingSignalAuditFixture()
  )

  assert.equal(parsed.meta_fbc.state, 'present')
  assert.equal(parsed.meta_fbp.state, 'unavailable')
  assert.equal(parsed.snap_click_id, undefined)
  assert.equal(parsed.snap_cookie1, undefined)
})

test('accepts explicit Snap signal provenance', () => {
  const parsed = canonicalSignalAuditSchema.parse({
    ...existingSignalAuditFixture(),
    snap_click_id: presentCanonicalSignal(
      'browser_request_url',
      timestamp
    ),
    snap_cookie1: presentCanonicalSignal(
      'first_party_cookie',
      timestamp
    )
  })

  assert.equal(parsed.snap_click_id?.state, 'present')
  assert.equal(parsed.snap_cookie1?.state, 'present')
})

test('does not normalize Meta parameter-builder values', () => {
  const fbc = 'fb.1.1753099200000.AbCdEf-123.appendix-value'

  assert.equal(
    fbc,
    'fb.1.1753099200000.AbCdEf-123.appendix-value'
  )
})
