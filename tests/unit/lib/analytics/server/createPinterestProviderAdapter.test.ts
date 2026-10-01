import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import test from 'node:test'
import { canonicalViewItemSchema } from '@/lib/analytics/viewItemEvent'
import { createPinterestProviderAdapter } from '@/lib/analytics/server/createPinterestProviderAdapter'
import {
  PinterestConversionsApiConfigError,
  PinterestConversionsApiHttpError,
  PinterestConversionsApiSkipError
} from '@/lib/analytics/server/sendPinterestServerEvent'

test('projects Pinterest CAPI counts into the provider receipt', () => {
  const receipt = {
    eventId: '61c2ef59-6e6f-4f56-a63a-567ca398f9de',
    eventName: 'view_item',
    provider: 'pinterest' as const,
    result: {
      httpStatus: 200,
      status: 'sent' as const,
      response: {
        num_events_processed: 1,
        num_events_received: 1
      }
    }
  }
  const adapter = createPinterestProviderAdapter({
    eventName: 'view_item',
    key: 'pinterest:view_item',
    schema: canonicalViewItemSchema
  })

  const projection = adapter.projectReceipt(receipt)

  assert.equal(projection.httpStatus, 200)
  assert.equal(projection.requestId, null)
  assert.deepEqual(projection.validationResult, {
    events_processed: 1,
    events_received: 1
  })
  assert.deepEqual(projection.response, receipt.result)
  assert.equal(adapter.provider, 'pinterest')
  assert.equal(adapter.key, 'pinterest:view_item')
  assert.equal(
    adapter.isRetryable(
      new PinterestConversionsApiConfigError('disabled')
    ),
    false
  )
  assert.equal(
    adapter.isRetryable(
      new PinterestConversionsApiSkipError(
        'insufficient_user_identity'
      )
    ),
    false
  )
  assert.equal(
    adapter.isRetryable(
      new PinterestConversionsApiHttpError(429, 'rate limited')
    ),
    true
  )
  assert.equal(
    adapter.isRetryable(
      new PinterestConversionsApiHttpError(400, 'bad request')
    ),
    false
  )
})

test('storefront layouts do not mount the unused browser pixels', () => {
  const paths = [
    'src/app/(store)/layout.tsx',
    'src/app/skreddersy-varmen/components/LandingTelemetry.tsx',
    'src/components/analytics/CanonicalBrowserProviderBridges.tsx'
  ]

  for (const file of paths) {
    const source = readFileSync(
      path.join(process.cwd(), file),
      'utf8'
    )
    assert.doesNotMatch(source, /pinterest|snapchat/i, file)
  }
})
