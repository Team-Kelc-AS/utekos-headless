import assert from 'node:assert/strict'
import test from 'node:test'
import { scheduleAssistantRuntimePrefetch } from './scheduleAssistantRuntimePrefetch'

test('waits for LCP before scheduling an idle runtime prefetch', () => {
  let prefetchCalls = 0
  const idleCallbacks: Array<() => void> = []
  const timeouts = new Map<number, () => void>()
  let nextHandle = 1
  let lcp: (() => void) | undefined

  const cancel = scheduleAssistantRuntimePrefetch(
    () => {
      prefetchCalls += 1
    },
    {
      cancelIdleCallback() {},
      clearTimeout(handle) {
        timeouts.delete(handle)
      },
      observeLargestContentfulPaint(onLcp) {
        lcp = onLcp
        return () => {}
      },
      requestIdleCallback(callback) {
        idleCallbacks.push(callback)
        const handle = nextHandle
        nextHandle += 1
        return handle
      },
      setTimeout(callback) {
        const handle = nextHandle
        nextHandle += 1
        timeouts.set(handle, callback)
        return handle
      }
    }
  )

  assert.equal(prefetchCalls, 0)
  assert.equal(idleCallbacks.length, 0)
  assert.equal(typeof lcp, 'function')

  lcp?.()
  assert.equal(prefetchCalls, 0)
  assert.equal(idleCallbacks.length, 1)

  idleCallbacks[0]?.()
  assert.equal(prefetchCalls, 1)

  idleCallbacks[0]?.()
  assert.equal(prefetchCalls, 1)
  cancel()
})

test('falls back to idle prefetch when LCP never arrives', () => {
  let prefetchCalls = 0
  let fallback: (() => void) | undefined
  const idleCallbacks: Array<() => void> = []
  let nextHandle = 1

  scheduleAssistantRuntimePrefetch(
    () => {
      prefetchCalls += 1
    },
    {
      cancelIdleCallback() {},
      clearTimeout() {},
      observeLargestContentfulPaint() {
        return () => {}
      },
      requestIdleCallback(callback) {
        idleCallbacks.push(callback)
        const handle = nextHandle
        nextHandle += 1
        return handle
      },
      setTimeout(callback) {
        fallback = callback
        return 99
      }
    }
  )

  assert.equal(prefetchCalls, 0)
  fallback?.()
  assert.equal(idleCallbacks.length, 1)
  idleCallbacks[0]?.()
  assert.equal(prefetchCalls, 1)
})

test('uses a timeout when requestIdleCallback is unavailable', () => {
  let prefetchCalls = 0
  let idleFallback: (() => void) | undefined

  scheduleAssistantRuntimePrefetch(
    () => {
      prefetchCalls += 1
    },
    {
      clearTimeout() {},
      setTimeout(callback) {
        idleFallback = callback
        return 1
      }
    }
  )

  assert.equal(prefetchCalls, 0)
  idleFallback?.()
  assert.equal(prefetchCalls, 1)
})

test('cancel prevents a later LCP idle prefetch', () => {
  let prefetchCalls = 0
  let lcp: (() => void) | undefined
  const idleCallbacks: Array<() => void> = []

  const cancel = scheduleAssistantRuntimePrefetch(
    () => {
      prefetchCalls += 1
    },
    {
      cancelIdleCallback() {},
      clearTimeout() {},
      observeLargestContentfulPaint(onLcp) {
        lcp = onLcp
        return () => {}
      },
      requestIdleCallback(callback) {
        idleCallbacks.push(callback)
        return 1
      },
      setTimeout() {
        return 2
      }
    }
  )

  cancel()
  lcp?.()
  idleCallbacks[0]?.()
  assert.equal(prefetchCalls, 0)
})
