import assert from 'node:assert/strict'
import test from 'node:test'
import {
  findMicrosoftUetAnonymousId,
  findMicrosoftUetExternalId
} from './microsoftUetIdentity'

const uuid = '550e8400-e29b-41d4-a716-446655440000'

test('derives the ID Sync VID from the consented anonymous external ID', () => {
  assert.equal(
    findMicrosoftUetAnonymousId({ external_id: `anon_${uuid}` }),
    uuid
  )
})

test('prefers an explicit Microsoft VID', () => {
  assert.equal(
    findMicrosoftUetAnonymousId({
      browser_id: { microsoft_vid: uuid },
      external_id: 'anon_11111111-1111-4111-8111-111111111111'
    }),
    uuid
  )
})

test('does not treat an unsynced UET cookie as a CAPI anonymous ID', () => {
  assert.equal(
    findMicrosoftUetAnonymousId({
      browser_id: { uet_visitor: 'legacy-uet-cookie' }
    }),
    undefined
  )
})

test('uses only non-anonymous external IDs as Microsoft externalId', () => {
  assert.equal(
    findMicrosoftUetExternalId({ external_id: `anon_${uuid}` }),
    undefined
  )
  assert.equal(
    findMicrosoftUetExternalId({
      external_id: 'shopify_customer_123'
    }),
    'shopify_customer_123'
  )
})
