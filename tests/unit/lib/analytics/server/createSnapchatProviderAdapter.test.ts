import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'
import { canonicalPageViewSchema } from '@/lib/analytics/pageViewEvent'
import { createSnapchatProviderAdapter } from '@/lib/analytics/server/createSnapchatProviderAdapter'
import { SnapchatConversionsApiHttpError } from '@/lib/analytics/server/sendSnapchatServerEvent'

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
      response: { requestId: 'request-1', status: 'VALID' },
      status: 'sent'
    }
  })

  assert.equal(projection.httpStatus, 200)
  assert.equal(projection.requestId, 'request-1')
  assert.deepEqual(projection.validationResult, {
    acceptance: 'accepted_unverified'
  })
})

test('retains server adapter without mounting the Snapchat browser pixel', async () => {
  assert.equal(adapter.provider, 'snapchat')
  assert.equal(adapter.key, 'snapchat:page_view')

  const layout = await readFile(
    'src/app/(store)/layout.tsx',
    'utf8'
  )
  const bridge = await readFile(
    'public/analytics/snapchat-pixel-canonical-v1.js',
    'utf8'
  )

  assert.doesNotMatch(layout, /SNAPCHAT_PIXEL_ENABLED/)
  assert.doesNotMatch(layout, /NEXT_PUBLIC_SNAPCHAT_PIXEL_ID/)
  assert.doesNotMatch(layout, /snapchat-pixel-canonical-v1\.js/)
  assert.doesNotMatch(
    layout,
    /SNAPCHAT_CONVERSIONS_API_ACCESS_TOKEN/
  )
  assert.doesNotMatch(
    bridge,
    /SNAPCHAT_CONVERSIONS_API_ACCESS_TOKEN/
  )
})
