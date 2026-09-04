import assert from 'node:assert/strict'
import test from 'node:test'

import { disconnectLegacyMetaCatalogApp } from './disconnectLegacyMetaCatalogApp'

test('disconnects only the legacy app from the v26 catalog edge', async () => {
  const observed: {
    body?: URLSearchParams
    headers?: Headers
    method: string | undefined
    url?: string
  } = { method: undefined }
  const fetchImpl: typeof fetch = async (input, init) => {
    observed.url = String(input)
    observed.method = init?.method
    observed.headers = new Headers(init?.headers)
    observed.body = init?.body as URLSearchParams

    return Response.json({ success: true })
  }

  const result = await disconnectLegacyMetaCatalogApp({
    accessToken: 'secret-token',
    fetchImpl
  })

  assert.equal(
    observed.url,
    'https://graph.facebook.com/v26.0/690208780604782/external_event_sources'
  )
  assert.equal(observed.method, 'DELETE')
  assert.equal(
    observed.headers?.get('authorization'),
    'Bearer secret-token'
  )
  assert.deepEqual(
    JSON.parse(
      observed.body?.get('external_event_sources') ?? '[]'
    ),
    ['2031748470995074']
  )
  assert.equal(result.appId, '2031748470995074')
})
