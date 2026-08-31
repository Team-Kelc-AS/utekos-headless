import assert from 'node:assert/strict'
import test from 'node:test'
import { createShopifyRequestDeadline } from './createShopifyRequestDeadline'
import { readJsonWithDeadline } from './readJsonWithDeadline'

test('cancels a hanging response body when the deadline fires', async () => {
  let cancelled = false
  let releaseCancellation: (() => void) | undefined
  const cancellation = new Promise<void>(resolve => {
    releaseCancellation = resolve
  })
  const reader = {
    read: () =>
      new Promise<ReadableStreamReadResult<Uint8Array>>(
        () => undefined
      ),
    cancel: () => {
      cancelled = true
      return cancellation
    }
  }
  const response = {
    body: { getReader: () => reader }
  } as unknown as Response
  const deadline = createShopifyRequestDeadline({
    timeoutMs: 40
  })
  const startedAt = performance.now()
  const releaseTimer = setTimeout(
    () => releaseCancellation?.(),
    500
  )

  try {
    await assert.rejects(
      readJsonWithDeadline(response, deadline),
      (error: unknown) =>
        error instanceof DOMException &&
        error.name === 'TimeoutError'
    )
    await new Promise(resolve => setTimeout(resolve, 0))
    assert.equal(cancelled, true)
    assert.ok(performance.now() - startedAt < 250)
  } finally {
    clearTimeout(releaseTimer)
    releaseCancellation?.()
    deadline.dispose()
  }
})

test('rejects before a synchronously blocking reader cancellation', async () => {
  const blockingCancellationMs = 150
  let cancellationStarted = false
  const reader = {
    read: () =>
      new Promise<ReadableStreamReadResult<Uint8Array>>(
        () => undefined
      ),
    cancel: () => {
      cancellationStarted = true
      const startedAt = performance.now()
      while (performance.now() - startedAt < blockingCancellationMs) {
        // Simulate a nonstandard stream implementation.
      }
      return Promise.resolve()
    }
  }
  const response = {
    body: { getReader: () => reader }
  } as unknown as Response
  const deadline = createShopifyRequestDeadline({ timeoutMs: 20 })
  const startedAt = performance.now()

  try {
    await assert.rejects(
      readJsonWithDeadline(response, deadline),
      (error: unknown) =>
        error instanceof DOMException &&
        error.name === 'TimeoutError'
    )
    assert.equal(cancellationStarted, false)
    assert.ok(
      performance.now() - startedAt < blockingCancellationMs,
      'reader cleanup must not extend the wall-clock deadline'
    )
    await new Promise(resolve => setTimeout(resolve, 0))
    assert.equal(cancellationStarted, true)
  } finally {
    deadline.dispose()
  }
})

test('parses JSON before the deadline', async () => {
  const deadline = createShopifyRequestDeadline({
    timeoutMs: 1_000
  })

  try {
    const body = await readJsonWithDeadline(
      Response.json({ ok: true }),
      deadline
    )
    assert.deepEqual(body, { ok: true })
  } finally {
    deadline.dispose()
  }
})
