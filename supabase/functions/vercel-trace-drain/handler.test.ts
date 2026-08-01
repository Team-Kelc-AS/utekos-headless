import assert from 'node:assert/strict'
import { createHmac } from 'node:crypto'
import test from 'node:test'

import type {
  TraceDrainRuntimeConfig,
  VercelTraceEnvelope,
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

function envelope(projectId = config.projectId): VercelTraceEnvelope {
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

test('logs only a bounded code for request-envelope rejection', async () => {
  const warnings: string[] = []
  const originalWarn = console.warn
  console.warn = value => warnings.push(String(value))

  try {
    const handler = createVercelTraceDrainHandler({
      config,
      upsertObservations: () => Promise.resolve(0)
    })
    const response = await handler(
      signedRequest(JSON.stringify({ resourceSpans: [] }))
    )

    assert.equal(response.status, 400)
    assert.equal(warnings.length, 1)
    assert.deepEqual(JSON.parse(warnings[0]!), {
      code: 'invalid_trace_envelope',
      component: 'vercel-trace-drain',
      event: 'request_rejected',
      schema_issue_count: 2
    })
  } finally {
    console.warn = originalWarn
  }
})

test('logs aggregate scope counters without payload identifiers', async () => {
  const warnings: string[] = []
  const originalWarn = console.warn
  console.warn = value => warnings.push(String(value))

  try {
    const scopedEnvelope = envelope()
    scopedEnvelope.resourceSpans[0]!.resource.attributes = [
      {
        key: 'service.name',
        value: { stringValue: 'must-not-be-logged' }
      }
    ]
    scopedEnvelope.resourceSpans[0]!.scopeSpans[0]!.scope = {
      name: 'vercel'
    }
    const handler = createVercelTraceDrainHandler({
      config,
      upsertObservations: () => Promise.resolve(0)
    })
    const response = await handler(
      signedRequest(JSON.stringify(scopedEnvelope))
    )

    assert.equal(response.status, 400)
    assert.equal(warnings.length, 1)
    const warning = JSON.parse(warnings[0]!)
    assert.deepEqual(warning, {
      attributes_empty_resource_count: 0,
      code: 'invalid_trace_scope',
      component: 'vercel-trace-drain',
      conflicting_trace_id_count: 0,
      deployment_scope_key_only_resource_count: 0,
      event: 'request_rejected',
      invalid_resource_count: 1,
      invalid_span_count: 0,
      invalid_timestamp_span_count: 0,
      mismatched_project_id_resource_count: 0,
      missing_deployment_id_resource_count: 1,
      missing_project_id_resource_count: 1,
      observation_count: 0,
      project_scope_key_only_resource_count: 0,
      received_span_count: 1,
      rejected_span_count: 1,
      scope_keys_absent_resource_count: 1,
      scope_keys_present_but_invalid_resource_count: 0,
      service_name_attribute_present_resource_count: 1,
      vercel_scope_name_present_resource_count: 1
    })
    assert.equal(warnings[0]!.includes(config.projectId), false)
    assert.equal(warnings[0]!.includes('dpl_current'), false)
    assert.equal(
      warnings[0]!.includes('00112233445566778899aabbccddeeff'),
      false
    )
    assert.equal(warnings[0]!.includes('must-not-be-logged'), false)
  } finally {
    console.warn = originalWarn
  }
})

test('accepts the scoped portion of a mixed batch with OTLP partial success', async () => {
  const warnings: string[] = []
  const writes: VercelTraceObservation[][] = []
  const originalWarn = console.warn
  console.warn = value => warnings.push(String(value))

  try {
    const valid = envelope()
    const unscoped = envelope()
    unscoped.resourceSpans[0]!.resource.attributes = []
    unscoped.resourceSpans[0]!.scopeSpans[0]!.spans[0]!.traceId =
      'ffeeddccbbaa99887766554433221100'
    const body = JSON.stringify({
      resourceSpans: [
        valid.resourceSpans[0],
        unscoped.resourceSpans[0]
      ]
    })
    const handler = createVercelTraceDrainHandler({
      config,
      upsertObservations: observations => {
        writes.push(observations)
        return Promise.resolve(observations.length)
      }
    })

    const response = await handler(signedRequest(body))

    assert.equal(response.status, 200)
    assert.deepEqual(await response.json(), {
      partialSuccess: {
        errorMessage: 'Unscoped or invalid spans were rejected',
        rejectedSpans: '1'
      }
    })
    assert.equal(writes.length, 1)
    assert.equal(writes[0]?.length, 1)
    assert.equal(warnings.length, 1)
    assert.deepEqual(JSON.parse(warnings[0]!), {
      attributes_empty_resource_count: 1,
      code: 'partial_trace_scope',
      component: 'vercel-trace-drain',
      conflicting_trace_id_count: 0,
      deployment_scope_key_only_resource_count: 0,
      event: 'request_rejected',
      invalid_resource_count: 1,
      invalid_span_count: 0,
      invalid_timestamp_span_count: 0,
      mismatched_project_id_resource_count: 0,
      missing_deployment_id_resource_count: 1,
      missing_project_id_resource_count: 1,
      observation_count: 1,
      project_scope_key_only_resource_count: 0,
      received_span_count: 2,
      rejected_span_count: 1,
      scope_keys_absent_resource_count: 1,
      scope_keys_present_but_invalid_resource_count: 0,
      service_name_attribute_present_resource_count: 0,
      vercel_scope_name_present_resource_count: 0
    })
  } finally {
    console.warn = originalWarn
  }
})

test('classifies connection exhaustion without logging database details', async () => {
  const errors: string[] = []
  const originalError = console.error
  console.error = value => errors.push(String(value))

  try {
    const databaseError = Object.assign(
      new Error('secret database message'),
      {
        code: '53300',
        detail: 'secret database detail',
        query: 'select secret_value'
      }
    )
    const handler = createVercelTraceDrainHandler({
      config,
      upsertObservations: () => Promise.reject(databaseError)
    })

    const response = await handler(
      signedRequest(JSON.stringify(envelope()))
    )

    assert.equal(response.status, 503)
    assert.deepEqual(await response.json(), {
      code: 'database_unavailable'
    })
    assert.deepEqual(JSON.parse(errors[0]!), {
      component: 'vercel-trace-drain',
      error_category: 'too_many_connections',
      event: 'database_write_failed'
    })
    assert.equal(errors[0]!.includes('secret'), false)
    assert.equal(errors[0]!.includes('53300'), false)
  } finally {
    console.error = originalError
  }
})

test('uses a bounded fallback for unknown database failures', async () => {
  const errors: string[] = []
  const originalError = console.error
  console.error = value => errors.push(String(value))

  try {
    const handler = createVercelTraceDrainHandler({
      config,
      upsertObservations: () =>
        Promise.reject(new Error('must-not-be-logged'))
    })

    const response = await handler(
      signedRequest(JSON.stringify(envelope()))
    )

    assert.equal(response.status, 503)
    assert.deepEqual(JSON.parse(errors[0]!), {
      component: 'vercel-trace-drain',
      error_category: 'database_error',
      event: 'database_write_failed'
    })
    assert.equal(errors[0]!.includes('must-not-be-logged'), false)
  } finally {
    console.error = originalError
  }
})
