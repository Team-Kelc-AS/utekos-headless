import assert from 'node:assert/strict'
import test from 'node:test'

import {
  MAX_DRAIN_BATCH_SIZE,
  type DrainRuntimeConfig,
  type VercelEdgeRequestObservation
} from './contracts.ts'
import { computeHmacHex } from './crypto.ts'
import { createVercelLogDrainHandler } from './handler.ts'

const config: DrainRuntimeConfig = {
  allowedHosts: ['utekos.no'],
  databaseUrl:
    'postgresql://postgres:postgres@127.0.0.1:5432/postgres',
  fbclidHmacSecret:
    'fbclid-hmac-secret-that-is-at-least-32-characters',
  environment: 'production',
  projectId: 'prj_MpZN3Z0PDp8rfwpdzAeplGe4Di0s',
  signatureSecret: 'drain-secret-that-is-at-least-32-characters'
}

function validEntry(id = 'log-1'): Record<string, unknown> {
  return {
    deploymentId: 'dpl_current',
    environment: 'production',
    host: 'utekos-headless.vercel.app',
    id,
    level: 'info',
    projectId: config.projectId,
    proxy: {
      host: 'utekos.no',
      method: 'GET',
      path: '/skreddersy-varmen?fbclid=not-persisted',
      pathType: 'prerender',
      region: 'arn1',
      statusCode: 200,
      timestamp: 1_754_029_200_123,
      userAgent: ['Mozilla/5.0 (iPhone)']
    },
    source: 'static',
    timestamp: 1_754_029_200_150
  }
}

async function signedRequest(body: unknown): Promise<Request> {
  const rawBody = new TextEncoder().encode(JSON.stringify(body))
  const signature = await computeHmacHex(
    rawBody,
    config.signatureSecret,
    'SHA-1'
  )

  return new Request(
    'https://example.supabase.co/functions/v1/vercel-log-drain',
    {
      body: rawBody,
      headers: {
        'content-type': 'application/json',
        'x-vercel-signature': signature
      },
      method: 'POST'
    }
  )
}

test('authenticates, sanitizes and writes an accepted Vercel JSON batch', async () => {
  let written: VercelEdgeRequestObservation[] = []
  const handler = createVercelLogDrainHandler({
    config,
    insertObservations: async observations => {
      written = observations
      return observations.length
    }
  })

  const response = await handler(
    await signedRequest([validEntry()])
  )
  const body = await response.json()

  assert.equal(response.status, 200)
  assert.equal(body.inserted_count, 1)
  assert.equal(written.length, 1)
  assert.equal(written[0]?.route_pathname, '/skreddersy-varmen')
  assert.equal(
    JSON.stringify(written).includes('not-persisted'),
    false
  )
})

test('rejects an invalid signature before parsing or writing', async () => {
  let writes = 0
  const handler = createVercelLogDrainHandler({
    config,
    insertObservations: async () => {
      writes += 1
      return 0
    }
  })
  const response = await handler(
    new Request(
      'https://example.supabase.co/functions/v1/vercel-log-drain',
      {
        body: '[not-json',
        headers: {
          'content-type': 'application/json',
          'x-vercel-signature': '0'.repeat(40)
        },
        method: 'POST'
      }
    )
  )

  assert.equal(response.status, 403)
  assert.equal(writes, 0)
})

test('enforces method, encoding, body and array bounds', async () => {
  const handler = createVercelLogDrainHandler({
    config,
    insertObservations: async () => 0
  })

  const getResponse = await handler(
    new Request(
      'https://example.supabase.co/functions/v1/vercel-log-drain'
    )
  )
  assert.equal(getResponse.status, 405)

  const compressedResponse = await handler(
    new Request(
      'https://example.supabase.co/functions/v1/vercel-log-drain',
      {
        body: '[]',
        headers: {
          'content-encoding': 'gzip',
          'content-type': 'application/json'
        },
        method: 'POST'
      }
    )
  )
  assert.equal(compressedResponse.status, 415)

  const oversizedResponse = await handler(
    new Request(
      'https://example.supabase.co/functions/v1/vercel-log-drain',
      {
        body: '[]',
        headers: {
          'content-length': String(4 * 1024 * 1024 + 1),
          'content-type': 'application/json'
        },
        method: 'POST'
      }
    )
  )
  assert.equal(oversizedResponse.status, 413)

  const oversizedBatch = Array.from(
    { length: MAX_DRAIN_BATCH_SIZE + 1 },
    (_, index) => validEntry(`log-${index}`)
  )
  const oversizedBatchResponse = await handler(
    await signedRequest(oversizedBatch)
  )
  assert.equal(oversizedBatchResponse.status, 400)
})

test('returns retryable failure when the database write fails', async () => {
  const handler = createVercelLogDrainHandler({
    config,
    insertObservations: async () => {
      throw new Error('database unavailable')
    }
  })
  const response = await handler(
    await signedRequest([validEntry()])
  )

  assert.equal(response.status, 503)
  assert.deepEqual(await response.json(), {
    code: 'database_unavailable'
  })
})
