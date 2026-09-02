import assert from 'node:assert/strict'
import test from 'node:test'
import {
  waitForCookiebotConsentReady,
  type CookiebotConsentReadyTarget
} from './waitForCookiebotConsentReady'

test('returns immediately after Cookiebot has resolved', async () => {
  const eventTarget = new EventTarget()
  const target = Object.assign(eventTarget, {
    Cookiebot: { hasResponse: true }
  }) as CookiebotConsentReadyTarget

  await waitForCookiebotConsentReady(target, 100)
})

test('waits for Cookiebot consent readiness before continuing', async () => {
  const eventTarget = new EventTarget()
  const target = eventTarget as CookiebotConsentReadyTarget
  let completed = false

  const waiting = waitForCookiebotConsentReady(target, 100).then(
    () => {
      completed = true
    }
  )

  await Promise.resolve()
  assert.equal(completed, false)

  eventTarget.dispatchEvent(new Event('CookiebotOnConsentReady'))
  await waiting

  assert.equal(completed, true)
})

test('times out fail closed when Cookiebot never resolves', async () => {
  const eventTarget = new EventTarget()
  const target = eventTarget as CookiebotConsentReadyTarget

  await waitForCookiebotConsentReady(target, 1)
})
