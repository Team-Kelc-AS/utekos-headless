import assert from 'node:assert/strict'
import test from 'node:test'
import { canonicalPurchaseSchema } from '../purchaseEvent'
import { createMicrosoftUetProviderAdapter } from './createMicrosoftUetProviderAdapter'

test('projects Microsoft response evidence into the provider receipt', () => {
  const receipt = {
    eventId: '61c2ef59-6e6f-4f56-a63a-567ca398f9de',
    eventName: 'purchase',
    provider: 'microsoft_uet' as const,
    result: {
      eventId: '61c2ef59-6e6f-4f56-a63a-567ca398f9de',
      eventName: 'PRODUCT_PURCHASE',
      eventsReceived: 1,
      requestId: 'request-123',
      responseCode: 'ValidationError',
      responseMessage: 'Optional fields were removed',
      status: 200,
      tagId: '97279186',
      validationErrors: [],
      validationWarnings: [
        {
          errorCode: 'InvalidUrl',
          propertyName: 'data[0].referrerUrl'
        }
      ]
    }
  }
  const adapter = createMicrosoftUetProviderAdapter({
    dispatch: async () => receipt,
    eventName: 'purchase',
    key: 'microsoft_uet:purchase',
    schema: canonicalPurchaseSchema
  })

  const projection = adapter.projectReceipt(receipt)

  assert.equal(projection.requestId, 'request-123')
  assert.deepEqual(projection.validationResult, {
    events_received: 1,
    http_status: 200,
    tag_id: '97279186',
    validation_error_count: 0,
    validation_warning_count: 1
  })
  assert.deepEqual(projection.response, receipt.result)
})
