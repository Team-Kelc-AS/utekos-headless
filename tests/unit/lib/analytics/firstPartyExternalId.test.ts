import assert from 'node:assert/strict'
import test from 'node:test'
import {
  createFirstPartyExternalIdStore,
  FIRST_PARTY_EXTERNAL_ID_COOKIE
} from '@/lib/analytics/firstPartyExternalId'
import type { ConsentSnapshot } from '@/lib/analytics/pageViewEvent'

const grantedConsent: ConsentSnapshot = {
  analytics: 'granted',
  marketing: 'granted',
  preferences: 'granted',
  source: 'cookiebot',
  version: '1'
}

const deniedConsent: ConsentSnapshot = {
  ...grantedConsent,
  marketing: 'denied'
}

const generatedUuid = '11111111-1111-4111-8111-111111111111'
const generatedExternalId = `anon_${generatedUuid}`

function harness(initialCookieHeader = '', secure = true) {
  let cookieHeader = initialCookieHeader
  const writes: string[] = []
  let createCount = 0

  const store = createFirstPartyExternalIdStore({
    createId: () => {
      createCount += 1
      return generatedUuid
    },
    getCookieHeader: () => cookieHeader,
    isSecureContext: () => secure,
    setCookie: cookie => {
      writes.push(cookie)

      const value = cookie.split(';', 1)[0]?.split('=', 2)[1]

      cookieHeader =
        value ? `${FIRST_PARTY_EXTERNAL_ID_COOKIE}=${value}` : ''
    }
  })

  return { createCount: () => createCount, store, writes }
}

test('does not expose or create an ID without marketing consent', () => {
  const context = harness()

  assert.equal(
    context.store.getOrCreate(deniedConsent),
    undefined
  )
  assert.equal(context.createCount(), 0)
  assert.deepEqual(context.writes, [])
})

test('reuses an existing valid first-party external ID', () => {
  const context = harness(
    `${FIRST_PARTY_EXTERNAL_ID_COOKIE}=${generatedExternalId}`
  )

  assert.equal(
    context.store.getOrCreate(grantedConsent),
    generatedExternalId
  )
  assert.equal(context.createCount(), 0)
  assert.deepEqual(context.writes, [])
})

test('creates a secure one-year cookie after marketing consent', () => {
  const context = harness()

  assert.equal(
    context.store.getOrCreate(grantedConsent),
    generatedExternalId
  )
  assert.equal(context.createCount(), 1)
  assert.equal(context.writes.length, 1)
  assert.match(
    context.writes[0] ?? '',
    new RegExp(`^${FIRST_PARTY_EXTERNAL_ID_COOKIE}=`)
  )
  assert.match(context.writes[0] ?? '', /Max-Age=31536000/)
  assert.match(context.writes[0] ?? '', /SameSite=Lax/)
  assert.match(context.writes[0] ?? '', /; Secure$/)
})

test('replaces an invalid cookie value after consent', () => {
  const context = harness(
    `${FIRST_PARTY_EXTERNAL_ID_COOKIE}=invalid`
  )

  assert.equal(
    context.store.getOrCreate(grantedConsent),
    generatedExternalId
  )
  assert.equal(context.createCount(), 1)
  assert.equal(context.writes.length, 1)
})

test('clears the identifier with the same cookie scope', () => {
  const context = harness(
    `${FIRST_PARTY_EXTERNAL_ID_COOKIE}=${generatedExternalId}`
  )

  context.store.clear()

  assert.equal(context.writes.length, 1)
  assert.match(context.writes[0] ?? '', /Max-Age=0/)
  assert.match(context.writes[0] ?? '', /Path=\//)
  assert.match(context.writes[0] ?? '', /SameSite=Lax/)
})
