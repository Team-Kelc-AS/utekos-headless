import assert from 'node:assert/strict'
import test from 'node:test'
import { createShopifyRequestDeadline } from './createShopifyRequestDeadline'

test('races a hanging promise against the wall-clock deadline', async () => {
  const deadline = createShopifyRequestDeadline({ timeoutMs: 40 })
  const startedAt = performance.now()

  try {
    await assert.rejects(
      deadline.race(new Promise(() => {})),
      (error: unknown) =>
        error instanceof DOMException &&
        error.name === 'TimeoutError' &&
        error.message === 'The operation was aborted due to timeout'
    )
    assert.equal(deadline.didTimeout, true)
    assert.ok(performance.now() - startedAt < 250)
  } finally {
    deadline.dispose()
  }
})

test('aborts the controller when the deadline fires', async () => {
  const deadline = createShopifyRequestDeadline({ timeoutMs: 20 })

  try {
    await assert.rejects(deadline.race(new Promise(() => {})))
    assert.equal(deadline.signal.aborted, true)
  } finally {
    deadline.dispose()
  }
})

test('propagates a caller abort without marking the deadline as a timeout', async () => {
  const caller = new AbortController()
  const deadline = createShopifyRequestDeadline({
    timeoutMs: 1_000,
    callerSignal: caller.signal
  })

  try {
    const pending = deadline.race(new Promise(() => {}))
    caller.abort(new Error('caller-cancelled'))
    await assert.rejects(pending, /caller-cancelled/)
    assert.equal(deadline.didTimeout, false)
  } finally {
    deadline.dispose()
  }
})
