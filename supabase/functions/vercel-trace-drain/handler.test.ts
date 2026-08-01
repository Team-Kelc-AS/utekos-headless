import assert from 'node:assert/strict'
import { createHmac } from 'node:crypto'
import test from 'node:test'

import type {
  TraceDrainRuntimeConfig,
  VercelTraceObservation
} from './contracts.ts'
import { createVercelTraceDrainHandler } from './handler.ts'

const config: TraceDrainRuntimeConfig = {
  databaseUrl:
    'postgresql://postgres:postgres@127.0.0.1:5432/postgres',
  environment: 'production',
  projectId: 'prj_MpZN3Z0PDp8rfwpdzAeplGe4Di0s',
  signatureSecret: 'trace-secret-that-is-at-least-32-characters'
}

function envelope(projectId = config.projectId) {
  return {
    resourceSpans: [
      {
        resource: {
          attributes: [
            {
              key: 'vercel.projectId',
              value: { stringValue: projectId }
            },
            {
              key: 'vercel.deploymentId',
              value: { stringValue: 'dpl_current' }
            }
          ]
        },
        scopeSpans: [
          {
            spans: [
              {
                endTimeUnixNano: '1754029200123000000',
                kind: 2,
                name: 'GET /',
                spanId: '0011223344556677',
                startTimeUnixNano: '1754029200000000000',
                traceId: '00112233445566778899aabbccddeeff'
              }
            ]
          }
        ]
      }
    ]
  }
}

function signedRequest(
  body: string,
  signature?: string
): Request {
  return new Request(
    'https://example.supabase.co/functions/v1/vercel-trace-drain',
    {
      body,
      headers: {
        'content-type': 'application/json',
        'x-vercel-signature':
          signature ??
          createHmac('sha1', config.signatureSecret)
            .update(body)
            .digest('hex')
      },
      method: 'POST'
    }
  )
}

test('accepts a signed, exact-project OTLP JSON trace envelope', async () => {
  const writes: VercelTraceObservation[][] = []
  const handler = createVercelTraceDrainHandler({
    config,
    upsertObservations: observations => {
      writes.push(observations)
      return Promise.resolve(observations.length)
    }
  })
  const body = JSON.stringify(envelope())
  const response = await handler(signedRequest(body))

  assert.equal(response.status, 200)
  assert.deepEqual(await response.json(), {})
  assert.equal(writes.length, 1)
  assert.equal(
    writes[0]?.[0]?.trace_id,
    '00112233445566778899aabbccddeeff'
  )
})

test('rejects an invalid signature before any database write', async () => {
  let writeCount = 0
  const handler = createVercelTraceDrainHandler({
    config,
    upsertObservations: () => {
      writeCount += 1
      return Promise.resolve(0)
    }
  })
  const response = await handler(
    signedRequest(JSON.stringify(envelope()), '0'.repeat(40))
  )

  assert.equal(response.status, 403)
  assert.equal(writeCount, 0)
})

test('rejects a signed envelope outside the configured project scope', async () => {
  let writeCount = 0
  const handler = createVercelTraceDrainHandler({
    config,
    upsertObservations: () => {
      writeCount += 1
      return Promise.resolve(0)
    }
  })
  const body = JSON.stringify(envelope('prj_wrong'))
  const response = await handler(signedRequest(body))

  assert.equal(response.status, 400)
  assert.deepEqual(await response.json(), {
    code: 'invalid_trace_scope'
  })
  assert.equal(writeCount, 0)
})
