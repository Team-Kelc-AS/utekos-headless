import assert from 'node:assert/strict'
import test from 'node:test'
import { buildMicrosoftUetCapiUserData } from './microsoftUetCapiUserData'

test('uses the ID Sync VID instead of UET and Google cookies', () => {
  const userData = buildMicrosoftUetCapiUserData({
    browser_id: {
      ga_client_id: '1234567890.987654321',
      uet_visitor: 'uet-visitor-1'
    },
    external_id:
      'anon_550e8400-e29b-41d4-a716-446655440000'
  })

  assert.deepEqual(userData, {
    anonymousId: '550e8400-e29b-41d4-a716-446655440000'
  })
})

test('qualifies with supported identifiers when msclkid is absent', () => {
  const userData = buildMicrosoftUetCapiUserData({
    external_id: 'customer-123',
    user_data: {
      email_sha256: ['a'.repeat(64)],
      phone_sha256: ['b'.repeat(64)]
    }
  })

  assert.deepEqual(userData, {
    em: 'a'.repeat(64),
    externalId: 'customer-123',
    ph: 'b'.repeat(64)
  })
})

test('drops an invalid msclkid when another identifier is valid', () => {
  const userData = buildMicrosoftUetCapiUserData({
    click_id: { msclkid: 'not-a-uuid' },
    external_id: 'customer-123'
  })

  assert.deepEqual(userData, {
    externalId: 'customer-123'
  })
})

test('rejects events without a supported Microsoft identifier', () => {
  assert.throws(
    () =>
      buildMicrosoftUetCapiUserData({
        browser_id: { ga_client_id: '1234567890.987654321' },
        click_id: { msclkid: 'not-a-uuid' }
      }),
    /requires at least one supported identifier/
  )
})
