import assert from 'node:assert/strict'
import test from 'node:test'

import {
  TRENDS_API_URL,
  TrendsMcpError,
  normalizeGrowthSources,
  requestTrendsApi,
  resolveApiKey,
  timeSeriesResponseSchema
} from './trendsmcp.mjs'

test('normalizes API keys without duplicating the Bearer scheme', () => {
  assert.equal(
    resolveApiKey({ TRENDS_MCP_API_KEY: ' tmcp_live_test ' }),
    'tmcp_live_test'
  )
  assert.equal(
    resolveApiKey({
      TRENDS_MCP_API_KEY: 'Bearer tmcp_live_test'
    }),
    'tmcp_live_test'
  )
  assert.equal(resolveApiKey({ TRENDS_MCP_API_KEY: ' ' }), null)
})

test('normalizes documented comma-separated growth sources', () => {
  assert.equal(
    normalizeGrowthSources('amazon, tiktok, youtube'),
    'amazon, tiktok, youtube'
  )
  assert.equal(
    normalizeGrowthSources('amazon,tiktok'),
    'amazon, tiktok'
  )
})

test('sends an authenticated no-store REST request and validates data', async () => {
  let captured
  const fetchImpl = async (url, options) => {
    captured = { url, options }
    return new Response(
      JSON.stringify([
        {
          date: '2026-03-21',
          value: 47,
          volume: 25_853_617,
          keyword: 'bitcoin',
          source: 'google search'
        }
      ]),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    )
  }

  const payload = {
    mode: 'get_time_series',
    source: 'google search',
    keyword: 'bitcoin'
  }
  const data = await requestTrendsApi(
    payload,
    timeSeriesResponseSchema,
    { apiKey: 'tmcp_live_test', fetchImpl, signal: undefined }
  )

  assert.equal(captured.url, TRENDS_API_URL)
  assert.equal(captured.options.method, 'POST')
  assert.equal(
    captured.options.headers.Authorization,
    'Bearer tmcp_live_test'
  )
  assert.equal(captured.options.redirect, 'error')
  assert.equal(captured.options.cache, 'no-store')
  assert.deepEqual(JSON.parse(captured.options.body), payload)
  assert.equal(data[0].value, 47)
})

test('unwraps the provider Lambda envelope observed on the live API', async () => {
  const fetchImpl = async () =>
    new Response(
      JSON.stringify({
        statusCode: 200,
        body: JSON.stringify([
          {
            date: '2026-03-21',
            value: 47,
            volume: null,
            keyword: 'bitcoin',
            source: 'google search'
          }
        ])
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    )

  const data = await requestTrendsApi(
    {
      mode: 'get_time_series',
      source: 'google search',
      keyword: 'bitcoin'
    },
    timeSeriesResponseSchema,
    { apiKey: 'tmcp_live_test', fetchImpl }
  )

  assert.equal(data[0].keyword, 'bitcoin')
  assert.equal(data[0].volume, null)
})

test('fails closed before fetch when the API key is missing', async () => {
  let called = false

  await assert.rejects(
    requestTrendsApi(
      {
        mode: 'get_time_series',
        source: 'google search',
        keyword: 'bitcoin'
      },
      timeSeriesResponseSchema,
      {
        apiKey: null,
        fetchImpl: async () => {
          called = true
          throw new Error('must not run')
        }
      }
    ),
    error =>
      error instanceof TrendsMcpError &&
      error.code === 'missing_credentials'
  )

  assert.equal(called, false)
})

test('preserves safe provider error classification without leaking auth', async () => {
  const fetchImpl = async () =>
    new Response(
      JSON.stringify({
        error: 'rate_limited',
        message: 'Monthly request limit reached.'
      }),
      {
        status: 429,
        headers: { 'Content-Type': 'application/json' }
      }
    )

  await assert.rejects(
    requestTrendsApi(
      {
        mode: 'get_time_series',
        source: 'google search',
        keyword: 'bitcoin'
      },
      timeSeriesResponseSchema,
      { apiKey: 'tmcp_secret_value', fetchImpl }
    ),
    error => {
      assert.equal(error.code, 'rate_limited')
      assert.equal(error.httpStatus, 429)
      assert.equal(error.retryable, false)
      assert.doesNotMatch(error.message, /tmcp_secret_value/)
      return true
    }
  )
})

test('rejects successful responses that violate the documented schema', async () => {
  const fetchImpl = async () =>
    new Response(JSON.stringify([{ date: 'not-a-date' }]), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    })

  await assert.rejects(
    requestTrendsApi(
      {
        mode: 'get_time_series',
        source: 'google search',
        keyword: 'bitcoin'
      },
      timeSeriesResponseSchema,
      { apiKey: 'tmcp_live_test', fetchImpl }
    ),
    error =>
      error instanceof TrendsMcpError &&
      error.code === 'invalid_upstream_response'
  )
})
