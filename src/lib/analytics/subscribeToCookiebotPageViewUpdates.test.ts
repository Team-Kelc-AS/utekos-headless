import assert from 'node:assert/strict'
import test from 'node:test'
import { subscribeToCookiebotPageViewUpdates } from './subscribeToCookiebotPageViewUpdates'

test('Cookiebot accept observes consent and flushes the page_view queue', async () => {
  const eventTarget = new EventTarget()
  const calls: string[] = []
  const unsubscribe = subscribeToCookiebotPageViewUpdates({
    eventTarget,
    flush: async () => {
      calls.push('flush')
    },
    observeConsent: () => {
      calls.push('observe')
    }
  })

  eventTarget.dispatchEvent(new Event('CookiebotOnAccept'))
  await Promise.resolve()

  assert.deepEqual(calls, ['observe', 'flush'])

  unsubscribe()
  eventTarget.dispatchEvent(new Event('CookiebotOnAccept'))
  await Promise.resolve()

  assert.deepEqual(calls, ['observe', 'flush'])
})

test('Cookiebot page_view flush rejection is handled locally', async () => {
  const eventTarget = new EventTarget()
  let observed = false

  const unsubscribe = subscribeToCookiebotPageViewUpdates({
    eventTarget,
    flush: async () => {
      throw new Error('collector unavailable')
    },
    observeConsent: () => {
      observed = true
    }
  })

  eventTarget.dispatchEvent(new Event('CookiebotOnAccept'))
  await Promise.resolve()
  await Promise.resolve()

  assert.equal(observed, true)
  unsubscribe()
})
