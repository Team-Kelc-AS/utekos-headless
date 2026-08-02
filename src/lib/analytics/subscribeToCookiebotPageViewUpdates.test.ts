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
