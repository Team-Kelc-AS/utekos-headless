import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'
import { canonicalPageViewSchema } from '../pageViewEvent'
import { createSnapchatProviderAdapter } from './createSnapchatProviderAdapter'
import { SnapchatConversionsApiHttpError } from './sendSnapchatServerEvent'

const adapter = createSnapchatProviderAdapter({
  eventName: 'page_view',
  key: 'snapchat:page_view',
  schema: canonicalPageViewSchema
})

test('retries only network errors, 408, 429, and 5xx responses', () => {
  assert.equal(
    adapter.isRetryable(
      new SnapchatConversionsApiHttpError(408, 'timeout')
    ),
    true
  )
  assert.equal(
    adapter.isRetryable(
      new SnapchatConversionsApiHttpError(429, 'rate')
    ),
    true
  )
  assert.equal(
    adapter.isRetryable(
      new SnapchatConversionsApiHttpError(503, 'down')
    ),
    true
  )
  assert.equal(
    adapter.isRetryable(
      new SnapchatConversionsApiHttpError(400, 'bad')
    ),
    false
  )
  assert.equal(
    adapter.isRetryable(
      new SnapchatConversionsApiHttpError(409, 'conflict')
    ),
    false
  )
  assert.equal(adapter.isRetryable({ code: 'ETIMEDOUT' }), true)
  assert.equal(
    adapter.isRetryable({
      name: 'TypeError',
      message: 'fetch failed',
      cause: { code: 'UND_ERR_CONNECT_TIMEOUT' }
    }),
    true
  )
  assert.equal(
    adapter.isRetryable(new TypeError('mapping failed')),
    false
  )

  const previous =
    process.env.SNAPCHAT_CONVERSIONS_API_ACCESS_TOKEN
  process.env.SNAPCHAT_CONVERSIONS_API_ACCESS_TOKEN =
    'secret-token'
  try {
    const summary = adapter.summarizeError(
      new Error(
        'fetch https://tr.snapchat.com/v3/pixel/events?access_token=secret-token failed'
      )
    )
    assert.equal(summary.includes('secret-token'), false)
    assert.match(summary, /\[REDACTED_SECRET\]/)
  } finally {
    if (previous === undefined) {
      delete process.env.SNAPCHAT_CONVERSIONS_API_ACCESS_TOKEN
    } else {
      process.env.SNAPCHAT_CONVERSIONS_API_ACCESS_TOKEN =
        previous
    }
  }
})

test('projects Snap transport and VALID response evidence separately', () => {
  const projection = adapter.projectReceipt({
    eventId: 'event-1',
    eventName: 'page_view',
    provider: 'snapchat',
    result: {
      acceptance: 'accepted_unverified',
      httpStatus: 200,
      response: {
        requestId: 'request-1',
        status: 'VALID'
      },
      status: 'sent'
    }
  })

  assert.equal(projection.httpStatus, 200)
  assert.equal(projection.requestId, 'request-1')
  assert.deepEqual(projection.validationResult, {
    acceptance: 'accepted_unverified'
  })
})

test('registers Snapchat without exposing its token to browser code', async () => {
  assert.equal(adapter.provider, 'snapchat')
  assert.equal(adapter.key, 'snapchat:page_view')

  const layout = await readFile(
    new URL('../../../app/layout.tsx', import.meta.url),
    'utf8'
  )
  const bridge = await readFile(
    new URL(
      '../../../../public/analytics/snapchat-pixel-canonical-v1.js',
      import.meta.url
    ),
    'utf8'
  )

  assert.match(layout, /SNAPCHAT_PIXEL_ENABLED/)
  assert.match(layout, /NEXT_PUBLIC_SNAPCHAT_PIXEL_ID/)
  assert.match(layout, /snapchat-pixel-canonical-v1\.js/)
  assert.doesNotMatch(
    layout,
    /SNAPCHAT_CONVERSIONS_API_ACCESS_TOKEN/
  )
  assert.doesNotMatch(
    bridge,
    /SNAPCHAT_CONVERSIONS_API_ACCESS_TOKEN/
  )
})
