import assert from 'node:assert/strict'
import test from 'node:test'
import { runConsentStep } from './runConsentStep'
import { createFirstPartyExternalIdStore } from './firstPartyExternalId'

test('blocked storage does not escape the optional consent step or manufacture an identifier', () => {
  let idCreations = 0
  const store = createFirstPartyExternalIdStore({
    getCookieHeader: () => {
      throw new DOMException('blocked', 'SecurityError')
    },
    createId: () => {
      idCreations += 1
      return '11111111-1111-4111-8111-111111111111'
    },
    isSecureContext: () => true,
    setCookie: () => {
      throw new Error('must not write')
    }
  })
  assert.equal(
    runConsentStep(() =>
      store.getOrCreate({
        analytics: 'granted',
        marketing: 'granted',
        preferences: 'denied',
        source: 'cookiebot',
        version: '1'
      })
    ),
    undefined
  )
  assert.equal(idCreations, 0)
  assert.equal(
    runConsentStep(() => 'independent step'),
    'independent step'
  )
})
