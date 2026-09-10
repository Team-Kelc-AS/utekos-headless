import assert from 'node:assert/strict'
import test from 'node:test'
import { emptyCheckoutConsent } from './emptyCheckoutConsent'

test('unknown or implied choices do not become consented checkout attribution', () => {
  for (const api of [
    undefined,
    {
      hasResponse: true,
      consent: { method: 'implied', marketing: true }
    }
  ]) {
    const snapshot = emptyCheckoutConsent(api)
    assert.notEqual(snapshot.consent.marketing, 'granted')
    assert.notEqual(snapshot.consent.analytics, 'granted')
    assert.deepEqual(Object.keys(snapshot).sort(), [
      'captured_at',
      'consent',
      'schema_version'
    ])
  }
})
test('an explicit refusal or preferences-only choice remains a usable necessary checkout state', () => {
  const snapshot = emptyCheckoutConsent({
    hasResponse: true,
    consent: { method: 'explicit', preferences: true }
  })
  assert.equal(snapshot.consent.marketing, 'denied')
  assert.equal(snapshot.consent.analytics, 'denied')
  assert.equal(snapshot.consent.preferences, 'granted')
})
