import assert from 'node:assert/strict'
import test from 'node:test'

import { buildMetaUserData } from './buildMetaUserData'

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

test('synthesizes fbc from click_id fbclid when the cookie never formed', () => {
  const normalized = buildMetaUserData({
    browser_id: { fbp: 'fb.1.1789797150590.123456789' },
    click_id: { fbclid: 'IwY2xjawExample' }
  }).normalize() as Record<string, unknown>

  assert.match(
    String(normalized.fbc ?? ''),
    /^fb\.1\.\d+\.IwY2xjawExample$/u
  )
})

test('keeps an existing fbc cookie value untouched', () => {
  const normalized = buildMetaUserData({
    browser_id: { fbc: 'fb.1.1784477611824.existing-click' },
    click_id: { fbclid: 'other-click' }
  }).normalize() as Record<string, unknown>

  assert.equal(
    normalized.fbc,
    'fb.1.1784477611824.existing-click'
  )
})
