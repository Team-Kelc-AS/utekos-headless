import assert from 'node:assert/strict'
import test from 'node:test'

import {
  vercelTraceEnvelopeSchema,
  type TraceDrainRuntimeConfig,
  type VercelTraceEnvelope
} from './contracts.ts'
import { sanitizeVercelTraceEnvelope } from './sanitize.ts'

const config: TraceDrainRuntimeConfig = {
  databaseUrl:
    'postgresql://postgres:postgres@127.0.0.1:5432/postgres',
  environment: 'production',
  projectId: 'prj_MpZN3Z0PDp8rfwpdzAeplGe4Di0s',
  signatureSecret: 'trace-secret-that-is-at-least-32-characters'
}

const traceId = '00112233445566778899aabbccddeeff'

function traceEnvelope(
  overrides: {
    deploymentId?: string
    projectId?: string
    traceId?: string
  } = {}
): VercelTraceEnvelope {
  return {
    resourceSpans: [
      {
        resource: {
          attributes: [
            {
              key: 'vercel.projectId',
              value: {
                stringValue:
                  overrides.projectId ?? config.projectId
              }
            },
            {
              key: 'vercel.deploymentId',
              value: {
                stringValue:
                  overrides.deploymentId ?? 'dpl_current'
              }
            },
            {
              key: 'http.request.header.user_agent',
              value: { stringValue: 'must-not-be-persisted' }
            }
          ]
        },
        scopeSpans: [
          {
            spans: [
              {
                endTimeUnixNano: '1754029200123000000',
                kind: 'server',
                name: 'GET /skreddersy-varmen',
                spanId: 'deadbeefdeadbeef',
                startTimeUnixNano: '1754029200000000000',
                traceId: overrides.traceId ?? traceId
              },
              {
                endTimeUnixNano: '1754029200100000000',
                kind: 3,
                name: 'render route',
                spanId: 'feedfacefeedface',
                startTimeUnixNano: '1754029200020000000',
                traceId: overrides.traceId ?? traceId
              }
            ]
          }
        ]
      }
    ]
  }
}

test('aggregates the exact OTLP trace envelope without retaining span details', () => {
  const result = sanitizeVercelTraceEnvelope(
    vercelTraceEnvelopeSchema.parse(traceEnvelope()),
    config
  )

  assert.equal(result.invalidResourceCount, 0)
  assert.equal(result.invalidSpanCount, 0)
  assert.equal(result.rejectedSpanCount, 0)
  assert.equal(result.receivedSpanCount, 2)
  assert.ok(result.observations[0])
  assert.deepEqual(result.observations, [
    {
      deployment_id: 'dpl_current',
      duration_ms: '123',
      end_time_unix_nano: '1754029200123000000',
      environment: 'production',
      observed_at: '2025-08-01T06:20:00.000Z',
      project_id: config.projectId,
      span_count: 2,
      start_time_unix_nano: '1754029200000000000',
      trace_id: traceId
    }
  ])

  const serialized = JSON.stringify(result.observations)
  assert.equal(serialized.includes('skreddersy-varmen'), false)
  assert.equal(
    serialized.includes('must-not-be-persisted'),
    false
  )
  assert.equal(serialized.includes('deadbeefdeadbeef'), false)
})

test('fails closed on a wrong project resource scope', () => {
  const result = sanitizeVercelTraceEnvelope(
    vercelTraceEnvelopeSchema.parse(
      traceEnvelope({ projectId: 'prj_wrong' })
    ),
    config
  )

  assert.equal(result.receivedSpanCount, 2)
  assert.equal(result.invalidResourceCount, 1)
  assert.equal(result.rejectedSpanCount, 2)
  assert.deepEqual(result.observations, [])
})

test('classifies unscoped resource shape without returning attribute values', () => {
  const unscoped = traceEnvelope()
  unscoped.resourceSpans[0]!.resource.attributes = [
    {
      key: 'service.name',
      value: { stringValue: 'must-not-be-returned' }
    }
  ]
  unscoped.resourceSpans[0]!.scopeSpans[0]!.scope = {
    name: 'vercel'
  }

  const result = sanitizeVercelTraceEnvelope(
    vercelTraceEnvelopeSchema.parse(unscoped),
    config
  )

  assert.equal(result.attributesEmptyResourceCount, 0)
  assert.equal(result.scopeKeysAbsentResourceCount, 1)
  assert.equal(result.projectScopeKeyOnlyResourceCount, 0)
  assert.equal(result.deploymentScopeKeyOnlyResourceCount, 0)
  assert.equal(result.scopeKeysPresentButInvalidResourceCount, 0)
  assert.equal(result.serviceNameAttributePresentResourceCount, 1)
  assert.equal(result.vercelScopeNamePresentResourceCount, 1)
  assert.equal(JSON.stringify(result).includes('must-not-be-returned'), false)
})

test('distinguishes present but invalid scope keys from absent keys', () => {
  const invalidScope = traceEnvelope()
  invalidScope.resourceSpans[0]!.resource.attributes = [
    {
      key: 'vercel.projectId',
      value: { boolValue: true }
    },
    {
      key: 'vercel.deploymentId',
      value: { stringValue: 'dpl_current' }
    }
  ]

  const result = sanitizeVercelTraceEnvelope(
    vercelTraceEnvelopeSchema.parse(invalidScope),
    config
  )

  assert.equal(result.scopeKeysAbsentResourceCount, 0)
  assert.equal(result.projectScopeKeyOnlyResourceCount, 0)
  assert.equal(result.deploymentScopeKeyOnlyResourceCount, 0)
  assert.equal(result.scopeKeysPresentButInvalidResourceCount, 1)
  assert.equal(result.missingProjectIdResourceCount, 1)
  assert.deepEqual(result.observations, [])
})

test('rejects one trace id reused across deployments', () => {
  const first = traceEnvelope().resourceSpans[0]!
  const second = traceEnvelope({ deploymentId: 'dpl_other' })
    .resourceSpans[0]!
  const result = sanitizeVercelTraceEnvelope(
    vercelTraceEnvelopeSchema.parse({
      resourceSpans: [first, second]
    }),
    config
  )

  assert.equal(result.invalidSpanCount, 1)
  assert.equal(result.rejectedSpanCount, 4)
  assert.deepEqual(result.observations, [])
})
