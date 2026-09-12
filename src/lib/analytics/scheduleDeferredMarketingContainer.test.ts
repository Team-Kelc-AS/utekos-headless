import assert from 'node:assert/strict'
import test from 'node:test'
import { scheduleDeferredMarketingContainer } from './scheduleDeferredMarketingContainer'

test('loads immediately when Cookiebot already stored a decision', () => {
  let loads = 0
  const cancel = scheduleDeferredMarketingContainer(() => {
    loads += 1
  }, { hasStoredDecision: true })

  assert.equal(loads, 1)
  cancel()
})

test('waits for LCP and then idle when no decision is stored', () => {
  let loads = 0
  let idleCallback: (() => void) | undefined
  let lcpCallback: (() => void) | undefined
  const timeouts: Array<() => void> = []

  const cancel = scheduleDeferredMarketingContainer(
    () => {
      loads += 1
    },
    {
      scheduler: {
        clearTimeout() {},
        observeLargestContentfulPaint: onLcp => {
          lcpCallback = onLcp
          return () => {
            lcpCallback = undefined
          }
        },
        requestIdleCallback: callback => {
          idleCallback = callback
          return 1
        },
        setTimeout: callback => {
          timeouts.push(callback)
          return timeouts.length
        }
      }
    }
  )

  assert.equal(loads, 0)
  assert.equal(typeof lcpCallback, 'function')
  assert.equal(typeof idleCallback, 'undefined')

  lcpCallback?.()
  assert.equal(loads, 0)
  assert.equal(typeof idleCallback, 'function')

  idleCallback?.()
  assert.equal(loads, 1)
  cancel()
})

test('loads on first interaction or privacy-settings open', () => {
  let loads = 0
  const listeners = new Map<string, () => void>()

  const cancel = scheduleDeferredMarketingContainer(
    () => {
      loads += 1
    },
    {
      eventTarget: {
        addEventListener(type, listener) {
          listeners.set(type, listener as () => void)
        },
        removeEventListener(type) {
          listeners.delete(type)
        }
      },
      scheduler: {
        clearTimeout() {},
        observeLargestContentfulPaint: () => () => {},
        setTimeout: () => 1
      }
    }
  )

  assert.equal(loads, 0)
  listeners.get('utekos:consent:open')?.()
  assert.equal(loads, 1)
  listeners.get('pointerdown')?.()
  assert.equal(loads, 1)
  cancel()
})
