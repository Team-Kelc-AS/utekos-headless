import assert from 'node:assert/strict'
import test from 'node:test'
import { metaViewItemProviderAdapter } from './metaViewItemProviderAdapter'

test('classifies an abortable Meta transport timeout as retryable', () => {
  assert.equal(
    metaViewItemProviderAdapter.isRetryable({
      code: 'ETIMEDOUT',
      name: 'MetaConversionsApiTimeoutError'
    }),
    true
  )
})

test('projects the Meta transport status without overstating provider processing', () => {
  const projection = metaViewItemProviderAdapter.projectReceipt({
    eventId: 'event-1',
    eventName: 'view_item',
    provider: 'meta',
    result: {
      eventsReceived: 1,
      httpStatus: 200,
      messages: []
    }
  })

  assert.equal(projection.httpStatus, 200)
  assert.deepEqual(projection.validationResult, {
    events_received: 1
  })
})

test('classifies transient Meta and server responses as retryable', () => {
  assert.equal(
    metaViewItemProviderAdapter.isRetryable({
      response: { code: 2, is_transient: true },
      status: 503
    }),
    true
  )
})
