import assert from 'node:assert/strict'
import test from 'node:test'
import {
  COOKIEBOT_CONSENT_EVENTS,
  hasCookiebotMarketingConsent,
  renewCookiebotConsent,
  subscribeToCookiebotConsent
} from './cookiebotMarketingConsent'

test('fails closed until marketing consent is granted', () => {
  assert.equal(hasCookiebotMarketingConsent(), false)
  assert.equal(
    hasCookiebotMarketingConsent({
      consent: { marketing: false }
    }),
    false
  )
  assert.equal(
    hasCookiebotMarketingConsent({
      consent: { marketing: true }
    }),
    true
  )
})

test('subscribes to consent ready, accept and decline changes', () => {
  const target = new EventTarget()
  let updates = 0
  const unsubscribe = subscribeToCookiebotConsent(target, () => {
    updates += 1
  })

  for (const eventName of COOKIEBOT_CONSENT_EVENTS) {
    target.dispatchEvent(new Event(eventName))
  }

  assert.equal(updates, COOKIEBOT_CONSENT_EVENTS.length)

  unsubscribe()
  target.dispatchEvent(new Event('CookiebotOnDecline'))
  assert.equal(updates, COOKIEBOT_CONSENT_EVENTS.length)
})

test('opens Cookiebot consent settings when the API is available', () => {
  let renewCalls = 0

  renewCookiebotConsent({
    renew: () => {
      renewCalls += 1
    }
  })
  renewCookiebotConsent()

  assert.equal(renewCalls, 1)
})
