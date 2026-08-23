import assert from 'node:assert/strict'
import test from 'node:test'
import type { SnapchatConversionEvent } from './mapCanonicalEventToSnapchat'
import {
  sendSnapchatServerEvent,
  SnapchatConversionsApiHttpError
} from './sendSnapchatServerEvent'

const event: SnapchatConversionEvent = {
  action_source: 'WEB',
  event_id: 'event-1',
  event_name: 'PAGE_VIEW',
  event_source_url: 'https://utekos.no/',
  event_time: Date.parse('2026-08-23T10:00:00.000Z'),
  user_data: {
    client_ip_address: '192.0.2.1',
    client_user_agent: 'test-agent'
  }
}

const env = {
  SNAPCHAT_CONVERSIONS_API_ENABLED: 'true',
  SNAPCHAT_CONVERSIONS_API_ACCESS_TOKEN: 'super-secret-token',
  SNAPCHAT_CONVERSIONS_API_CUTOVER_AT:
    '2026-08-23T09:00:00.000Z',
  SNAPCHAT_PIXEL_ID: 'pixel-id',
  NEXT_PUBLIC_SNAPCHAT_PIXEL_ID: 'pixel-id'
}

async function withHarness(
  response: Response,
  run: (
    requests: Array<{ input: string; init?: RequestInit }>
  ) => Promise<void>
) {
  const previousEnv = Object.fromEntries(
    Object.keys(env).map(key => [key, process.env[key]])
  )
  const previousFetch = globalThis.fetch
  const requests: Array<{ input: string; init?: RequestInit }> =
    []

  try {
    Object.assign(process.env, env)
    globalThis.fetch = (async (input, init) => {
      requests.push({
        input: String(input),
        ...(init ? { init } : {})
      })
      return response
    }) as typeof fetch
    await run(requests)
  } finally {
    globalThis.fetch = previousFetch
    for (const key of Object.keys(env)) {
      const value = previousEnv[key]
      if (value === undefined) delete process.env[key]
      else process.env[key] = value
    }
  }
}

test('sends exactly one event and stores only a sanitized receipt', async () => {
  await withHarness(
    new Response(
      JSON.stringify({
        request_status: 'SUCCESS',
        request_id: 'snap-request-1',
        raw_user_data: 'must-not-survive'
      }),
      { status: 200 }
    ),
    async requests => {
      const result = await sendSnapchatServerEvent(event)
      assert.equal(requests.length, 1)
      assert.match(
        requests[0]!.input,
        /^https:\/\/tr\.snapchat\.com\/v3\/pixel-id\/events\?/
      )
      assert.equal(
        new URL(requests[0]!.input).searchParams.get(
          'access_token'
        ),
        'super-secret-token'
      )
      assert.deepEqual(
        JSON.parse(String(requests[0]!.init?.body)),
        { data: [event] }
      )
      assert.deepEqual(result, {
        status: 'sent',
        acceptance: 'accepted_unverified',
        response: {
          requestId: 'snap-request-1',
          requestStatus: 'SUCCESS'
        }
      })
      assert.equal(
        JSON.stringify(result).includes('raw_user_data'),
        false
      )
      assert.equal(
        JSON.stringify(result).includes('super-secret-token'),
        false
      )
    }
  )
})

test('accepts the documented HTTP 200 VALID response', async () => {
  await withHarness(
    new Response(
      JSON.stringify({
        status: 'VALID',
        reason: 'Events have been processed successfully.'
      }),
      { status: 200 }
    ),
    async () => {
      const result = await sendSnapchatServerEvent(event)

      assert.deepEqual(result, {
        status: 'sent',
        acceptance: 'accepted_unverified',
        response: { status: 'VALID' }
      })
    }
  )
})

test('never includes the token or raw response in provider errors', async () => {
  await withHarness(
    new Response(
      JSON.stringify({
        request_status: 'ERROR',
        request_id: 'customer@example.no',
        reason: 'customer@example.no',
        raw_user_data: 'customer@example.no',
        token: 'super-secret-token'
      }),
      { status: 400 }
    ),
    async () => {
      await assert.rejects(
        () => sendSnapchatServerEvent(event),
        (error: unknown) => {
          assert.ok(
            error instanceof SnapchatConversionsApiHttpError
          )
          assert.equal(error.status, 400)
          assert.equal(
            error.message.includes('super-secret-token'),
            false
          )
          assert.equal(
            error.message.includes('customer@example.no'),
            false
          )
          return true
        }
      )
    }
  )
})

test('treats a 2xx provider rejection as a permanent failure', async () => {
  await withHarness(
    new Response(JSON.stringify({ request_status: 'ERROR' }), {
      status: 200
    }),
    async () => {
      await assert.rejects(
        () => sendSnapchatServerEvent(event),
        (error: unknown) => {
          assert.ok(
            error instanceof SnapchatConversionsApiHttpError
          )
          assert.equal(error.status, 200)
          return true
        }
      )
    }
  )
})
