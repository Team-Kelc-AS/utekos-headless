import assert from 'node:assert/strict'
import test from 'node:test'
import { subscribeToCookiebotPageViewUpdates } from './subscribeToCookiebotPageViewUpdates'

test('reconciles a missed startup event, return and online with bounded timers and cleanup', async () => {
  const target = new EventTarget()
  const doc = new EventTarget()
  const timers = new Map<number, () => void>()
  let nextTimer = 0
  let visible = true
  let observations = 0
  let flushes = 0
  const unsubscribe = subscribeToCookiebotPageViewUpdates({
    eventTarget: target,
    documentTarget: doc,
    isVisible: () => visible,
    observeConsent: () => {
      observations += 1
    },
    flush: async () => {
      flushes += 1
    },
    schedule: callback => {
      const id = ++nextTimer
      timers.set(id, callback)
      return id
    },
    cancel: timer => {
      timers.delete(timer as unknown as number)
    }
  })
  for (const [id, callback] of [...timers]) {
    timers.delete(id)
    callback()
  }
  assert.equal(observations, 5)
  visible = false
  doc.dispatchEvent(new Event('visibilitychange'))
  assert.equal(observations, 5)
  visible = true
  target.dispatchEvent(new Event('pageshow'))
  target.dispatchEvent(new Event('online'))
  assert.equal(observations, 7)
  for (let cycle = 0; cycle < 10; cycle += 1) {
    target.dispatchEvent(new Event('CookiebotOnAccept'))
    for (const [id, callback] of [...timers]) {
      timers.delete(id)
      callback()
    }
  }
  assert.equal(observations, 32)
  assert.equal(timers.size, 0)
  assert.equal(flushes, observations)
  unsubscribe()
  target.dispatchEvent(new Event('online'))
  doc.dispatchEvent(new Event('visibilitychange'))
  assert.equal(observations, 32)
})

test('a synchronous consent failure cannot prevent an independent collector flush', async () => {
  const listeners = new Map<
    string,
    EventListenerOrEventListenerObject
  >()
  let flushes = 0
  const unsubscribe = subscribeToCookiebotPageViewUpdates({
    eventTarget: {
      addEventListener: (name, listener) => {
        if (listener) listeners.set(name, listener)
      },
      removeEventListener: name => {
        listeners.delete(name)
      }
    },
    observeConsent: () => {
      throw new DOMException('Storage blocked', 'SecurityError')
    },
    flush: async () => {
      flushes += 1
    }
  })
  const listener = listeners.get(
    'CookiebotOnAccept'
  ) as EventListener
  assert.doesNotThrow(() =>
    listener(new Event('CookiebotOnAccept'))
  )
  await Promise.resolve()
  assert.equal(flushes, 1)
  unsubscribe()
})

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
