import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import test from 'node:test'
import { canonicalViewItemSchema } from '../viewItemEvent'
import { createPinterestProviderAdapter } from './createPinterestProviderAdapter'
import {
  PinterestConversionsApiConfigError,
  PinterestConversionsApiHttpError,
  PinterestConversionsApiSkipError
} from './sendPinterestServerEvent'

test('projects Pinterest CAPI counts into the provider receipt', () => {
  const receipt = {
    eventId: '61c2ef59-6e6f-4f56-a63a-567ca398f9de',
    eventName: 'view_item',
    provider: 'pinterest' as const,
    result: {
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

test('layout loads the first-party Pinterest Tag behind the marketing script gate', () => {
  const source = readFileSync(
    path.join(process.cwd(), 'src/app/layout.tsx'),
    'utf8'
  )

  assert.match(
    source,
    /id=['"]pinterest-tag-canonical-browser['"]/
  )
  assert.match(
    source,
    /src=['"]\/analytics\/pinterest-tag-canonical-v1\.js['"]/
  )
  assert.match(source, /data-tag-id=\{pinterestTagId\}/)
  assert.match(
    source,
    /NEXT_PUBLIC_PINTEREST_TAG_ID/
  )
  assert.match(source, /shouldLoadMarketingScripts/)
})
