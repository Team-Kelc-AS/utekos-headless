import assert from 'node:assert/strict'
import test from 'node:test'
import type { ServerEvent } from 'facebook-nodejs-business-sdk'
import {
  createMetaHttpService,
  readMetaConversionsApiConfig,
  sendMetaServerEvent,
  type MetaEventRequest
} from './sendMetaServerEvent'

test('reads required and optional Meta configuration without leaking values', () => {
  assert.deepEqual(
    readMetaConversionsApiConfig({
      META_ACCESS_TOKEN: ' token ',
      META_APP_SECRET: ' secret ',
      META_PIXEL_ID: ' pixel ',
      META_TEST_EVENT_CODE: ' test '
    }),
    {
      accessToken: 'token',
      appSecret: 'secret',
      pixelId: 'pixel',
      testEventCode: 'test'
    }
  )
  assert.throws(
    () => readMetaConversionsApiConfig({ META_PIXEL_ID: 'pixel' }),
    /META_ACCESS_TOKEN/
  )
})

test('configures one Meta request and projects its receipt', async () => {
  const calls: string[] = []
  const request: MetaEventRequest = {
    execute: async () => ({
      events_received: 1,
      fbtrace_id: 'trace-1',
      http_status: 200,
      id: 'dataset-1',
      messages: ['accepted'],
      num_processed_entries: 1
    }),
    setAppSecret: value => {
      calls.push(`secret:${value}`)
      return request
    },
    setEvents: events => {
      calls.push(`events:${events.length}`)
      return request
    },
    setHttpService: () => request,
    setPartnerAgent: value => {
      calls.push(`partner:${value}`)
      return request
    },
    setTestEventCode: value => {
      calls.push(`test:${value}`)
      return request
    }
  }
  const result = await sendMetaServerEvent(
    {} as ServerEvent,
    {
      accessToken: 'token',
      appSecret: 'secret',
      pixelId: 'pixel',
      testEventCode: 'test-code'
    },
    {
      createRequest: (accessToken, pixelId) => {
        calls.push(`create:${accessToken}:${pixelId}`)
        return request
      }
    }
  )

  assert.deepEqual(calls, [
    'create:token:pixel',
    'events:1',
    'partner:utekos-headless',
    'secret:secret',
    'test:test-code'
  ])
  assert.deepEqual(result, {
    datasetId: 'dataset-1',
    eventsReceived: 1,
    fbTraceId: 'trace-1',
    httpStatus: 200,
    messages: ['accepted'],
    processedEntries: 1
  })
})

test('rejects a provider response that did not accept exactly one event', async () => {
  const request = {
    execute: async () => ({ events_received: 0 }),
    setAppSecret() { return this },
    setEvents() { return this },
    setHttpService() { return this },
    setPartnerAgent() { return this },
    setTestEventCode() { return this }
  } satisfies MetaEventRequest

  await assert.rejects(
    sendMetaServerEvent(
      {} as ServerEvent,
      { accessToken: 'token', pixelId: 'pixel' },
      { createRequest: () => request }
    ),
    /received 0 events; expected 1/
  )
})

test('uses the SDK HTTP override to send one validated request', async () => {
  let captured:
    | { body: string; method: string; url: string }
    | undefined
  const service = createMetaHttpService(
    async (url, init) => {
      captured = {
        body: String(init.body),
        method: String(init.method),
        url
      }

      return {
        json: async () => ({
          events_received: 1,
          fbtrace_id: 'trace-1'
        }),
        ok: true,
        status: 200
      }
    }
  )

  const response = await service.executeRequest(
    'https://graph.facebook.com/v25.0/pixel/events',
    'POST',
    { 'Content-Type': 'application/json' },
    { access_token: 'token', data: [{ event_id: 'event-1' }] }
  )

  assert.deepEqual(captured, {
    body: JSON.stringify({
      access_token: 'token',
      data: [{ event_id: 'event-1' }]
    }),
    method: 'POST',
    url: 'https://graph.facebook.com/v25.0/pixel/events'
  })
  assert.deepEqual(response, {
    events_received: 1,
    fbtrace_id: 'trace-1',
    http_status: 200
  })
})

test('aborts a Meta transport that exceeds its deadline', async () => {
  const service = createMetaHttpService(
    (_url, init) =>
      new Promise((_resolve, reject) => {
        init.signal?.addEventListener(
          'abort',
          () => reject(new DOMException('Aborted', 'AbortError')),
          { once: true }
        )
      }),
    5
  )

  await assert.rejects(
    service.executeRequest(
      'https://graph.facebook.com/v25.0/pixel/events',
      'POST',
      { 'Content-Type': 'application/json' },
      { data: [] }
    ),
    {
      code: 'ETIMEDOUT',
      name: 'MetaConversionsApiTimeoutError'
    }
  )
})

test('preserves retryable HTTP status and Meta error fields', async () => {
  const service = createMetaHttpService(async () => ({
    json: async () => ({
      error: {
        code: 2,
        is_transient: true
      }
    }),
    ok: false,
    status: 503
  }))

  await assert.rejects(
    service.executeRequest(
      'https://graph.facebook.com/v25.0/pixel/events',
      'POST',
      {},
      { data: [] }
    ),
    error => {
      assert.equal(
        (error as { status?: number }).status,
        503
      )
      assert.deepEqual(
        (error as { response?: unknown }).response,
        { code: 2, is_transient: true }
      )
      return true
    }
  )
})
