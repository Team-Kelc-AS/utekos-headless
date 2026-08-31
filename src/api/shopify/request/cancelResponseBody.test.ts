import assert from 'node:assert/strict'
import test from 'node:test'
import { cancelResponseBody } from './cancelResponseBody'

test('schedules body cancellation after the request failure settles', async () => {
  const blockingCancellationMs = 150
  let cancellationStarted = false
  const response = {
    body: {
      locked: false,
      cancel: () => {
        cancellationStarted = true
        const startedAt = performance.now()
        while (performance.now() - startedAt < blockingCancellationMs) {
          // Simulate synchronous transport cleanup.
        }
        return Promise.resolve()
      }
    }
  } as unknown as Response
  const startedAt = performance.now()

  cancelResponseBody(response)

  assert.equal(cancellationStarted, false)
  assert.ok(performance.now() - startedAt < blockingCancellationMs)
  await new Promise(resolve => setTimeout(resolve, 0))
  assert.equal(cancellationStarted, true)
})
