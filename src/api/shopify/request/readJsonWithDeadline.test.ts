import assert from 'node:assert/strict'
import test from 'node:test'
import { createShopifyRequestDeadline } from './createShopifyRequestDeadline'
import { readJsonWithDeadline } from './readJsonWithDeadline'

test('cancels a hanging response body when the deadline fires', async () => {
  let cancelled = false
  const hangingBody = new ReadableStream<Uint8Array>({
    start() {},
    cancel() {
      cancelled = true
    }
  })
  const response = new Response(hangingBody, {
    headers: { 'content-type': 'application/json' }
  })
  const deadline = createShopifyRequestDeadline({ timeoutMs: 40 })
  const startedAt = performance.now()

  try {
    await assert.rejects(
      readJsonWithDeadline(response, deadline),
      (error: unknown) =>
        error instanceof DOMException && error.name === 'TimeoutError'
    )
    assert.equal(cancelled, true)
    assert.ok(performance.now() - startedAt < 250)
  } finally {
    deadline.dispose()
  }
})

test('parses JSON before the deadline', async () => {
  const deadline = createShopifyRequestDeadline({ timeoutMs: 1_000 })

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
