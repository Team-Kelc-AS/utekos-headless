import assert from 'node:assert/strict'
import test from 'node:test'
import { cancelResponseBody } from './cancelResponseBody'

test('starts body cancellation before returning without awaiting cleanup', () => {
  let cancellationStarted = false
  const cancellation = new Promise<void>(() => undefined)
  const response = {
    body: {
      locked: false,
      cancel: () => {
        cancellationStarted = true
        return cancellation
      }
    }
  } as unknown as Response

  cancelResponseBody(response)

  assert.equal(cancellationStarted, true)
})

test('ignores a synchronous cancellation failure', () => {
  const response = {
    body: {
      locked: false,
      cancel: () => {
        throw new Error('cleanup failed')
      }
    }
  } as unknown as Response

  assert.doesNotThrow(() => cancelResponseBody(response))
})
