import assert from 'node:assert/strict'
import test from 'node:test'

import { buildMetaUserData } from '@/lib/analytics/server/buildMetaUserData'
import {
  canonicalSignalAuditSchema,
  canonicalSignalNames
} from '@/lib/analytics/canonicalSignalContract'

function clickAudit(
  capturedAt: string,
  source = 'browser_request_url'
) {
  return canonicalSignalAuditSchema.parse(
    Object.fromEntries(
      canonicalSignalNames.map(name => [
        name,
        name === 'meta_fbclid' ?
          { state: 'present', source, captured_at: capturedAt }
        : {
            state: 'unavailable',
            reason: 'not_observed',
            assessed_at: capturedAt
          }
      ])
    )
  )
}

test('maps all protected Shopify checkout match fields to Meta user_data', () => {
  const hash = 'a'.repeat(64)
  const normalized = buildMetaUserData({
    user_data: {
      city_sha256: [hash],
      country_sha256: [hash],
      email_sha256: [hash],
      first_name_sha256: [hash],
      last_name_sha256: [hash],
      phone_sha256: [hash],
      postal_code_sha256: [hash],
      state_sha256: [hash]
    }
  }).normalize() as Record<string, string[]>

  for (const key of [
    'ct',
    'country',
    'em',
    'fn',
    'ln',
    'ph',
    'st',
    'zp'
  ]) {
    assert.match(normalized[key]?.[0] ?? '', /^[a-f0-9]{64}/u)
  }
})

test('preserves Meta Parameter Builder values byte-for-byte', () => {
  const digest = 'b'.repeat(64)
  const parameterBuilderValue = `${digest}.AQQCAQMB`
  const normalized = buildMetaUserData({
    meta_parameter_builder: {
      user_data: {
        city: [parameterBuilderValue],
        country: [parameterBuilderValue],
        email: [parameterBuilderValue],
        first_name: [parameterBuilderValue],
        last_name: [parameterBuilderValue],
        phone: [parameterBuilderValue],
        postal_code: [parameterBuilderValue],
        state: [parameterBuilderValue]
      }
    },
    user_data: {
      city_sha256: ['a'.repeat(64)],
      country_sha256: ['a'.repeat(64)],
      email_sha256: ['a'.repeat(64)],
      first_name_sha256: ['a'.repeat(64)],
      last_name_sha256: ['a'.repeat(64)],
      phone_sha256: ['a'.repeat(64)],
      postal_code_sha256: ['a'.repeat(64)],
      state_sha256: ['a'.repeat(64)]
    }
  }).normalize() as Record<string, string[]>

  for (const key of [
    'ct',
    'country',
    'em',
    'fn',
    'ln',
    'ph',
    'st',
    'zp'
  ]) {
    assert.deepEqual(normalized[key], [parameterBuilderValue])
  }
})

test('uses the recorded click observation on delayed dispatch and retry', () => {
  const event = {
    browser_id: { fbp: 'fb.1.1789797150590.123456789' },
    click_id: { fbclid: 'IwY2xjawExample' },
    signal_audit: clickAudit(
      new Date(1789797150590).toISOString()
    )
  }
  const first = buildMetaUserData(event).normalize() as Record<
    string,
    unknown
  >
  const retry = buildMetaUserData(
    structuredClone(event)
  ).normalize() as Record<string, unknown>

  assert.equal(first.fbc, 'fb.1.1789797150590.IwY2xjawExample')
  assert.equal(retry.fbc, first.fbc)
})

test('does not date a persisted click at dispatch when its observation is unknown', () => {
  for (const signal_audit of [
    undefined,
    clickAudit(
      '2026-09-19T07:12:30.590Z',
      'durable_click_id_store'
    )
  ]) {
    const normalized = buildMetaUserData({
      click_id: { fbclid: 'IwY2xjawExample' },
      signal_audit
    }).normalize() as Record<string, unknown>
    assert.equal(normalized.fbc, undefined)
  }
})

test('keeps an existing fbc cookie value untouched', () => {
  const normalized = buildMetaUserData({
    browser_id: {
      fbc: 'fb.1.1784477611824.ExistingClick.AQQCAQMB'
    },
    click_id: { fbclid: 'other-click' }
  }).normalize() as Record<string, unknown>

  assert.equal(
    normalized.fbc,
    'fb.1.1784477611824.ExistingClick.AQQCAQMB'
  )
})
