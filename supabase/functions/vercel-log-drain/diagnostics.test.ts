import assert from 'node:assert/strict'
import test from 'node:test'
import { sanitizeDiagnosticBatch } from './diagnostics.ts'
import type { DrainRuntimeConfig } from './contracts.ts'

const config: DrainRuntimeConfig = {
  projectId: 'prj_test',
  environment: 'production',
  allowedHosts: ['utekos.no'],
  databaseUrl: 'postgres://localhost:6543/test',
  signatureSecret: 'x'.repeat(32)
}
const entry = {
  id: 'log-1',
  deploymentId: 'dpl_test',
  projectId: 'prj_test',
  environment: 'production',
  source: 'lambda',
  host: 'deployment.vercel.app',
  timestamp: 1789296239000,
  level: 'error',
  requestId: 'req_123',
  traceId: 'a'.repeat(32)
}

test('retains a client warning/error independently of HTTP 200 and document filtering', () => {
  const result = sanitizeDiagnosticBatch(
    [
      {
        ...entry,
        proxy: {
          path: '/api/log?email=private@example.com',
          method: 'POST',
          statusCode: 200
        },
        message: JSON.stringify({
          event: 'client.unhandled_rejection',
          context: {
            route: '/skreddersy-varmen?fbclid=secret',
            customer: 'private@example.com'
          },
          data: { message: 'ClientError', token: 'secret' }
        })
      }
    ],
    config
  )
  assert.equal(result.observations.length, 1)
  const row = result.observations[0]!
  assert.equal(row.request_route, '/api/log')
  assert.equal(row.context_route, '/skreddersy-varmen')
  assert.equal(row.category, 'ClientError')
  assert.equal(row.event_name, 'client.unhandled_rejection')
  assert.equal(row.status_code, 200)
  assert.equal(row.trace_id, 'a'.repeat(32))
  assert.equal(JSON.stringify(row).includes('secret'), false)
  assert.equal(JSON.stringify(row).includes('private'), false)
})

test('accepts errors without proxy and records missing HTTP facts as null', () => {
  const [row] = sanitizeDiagnosticBatch(
    [
      {
        ...entry,
        message:
          'TimeoutError: customer secret at https://x/?token=secret'
      }
    ],
    config
  ).observations
  assert.equal(row?.category, 'timeout')
  assert.equal(row?.request_route, null)
  assert.equal(row?.status_code, null)
  assert.equal(row?.message_policy, 'classified_raw_omitted')
  assert.equal(JSON.stringify(row).includes('secret'), false)
})

test('captures HTTP failures with info level, API paths and missing user agent', () => {
  const [row] = sanitizeDiagnosticBatch(
    [
      {
        ...entry,
        level: 'info',
        path: '/api/cart/customer-secret',
        statusCode: 503
      }
    ],
    config
  ).observations
  assert.equal(row?.category, 'http_error')
  assert.equal(row?.level, 'info')
  assert.equal(row?.request_route, '/api/:endpoint')
})

test('separates schema rejection, scope, build, normal traffic and duplicates', () => {
  const result = sanitizeDiagnosticBatch(
    [
      entry,
      entry,
      { ...entry, source: 'build' },
      { ...entry, environment: 'preview' },
      { ...entry, projectId: 'other' },
      { ...entry, level: 'info' },
      { ...entry, level: 'new-provider-value' },
      { broken: true }
    ],
    config
  )
  assert.equal(result.observations.length, 1)
  assert.equal(result.duplicates, 1)
  assert.deepEqual(result.reasons, {
    invalid_schema: 2,
    outside_scope: 2,
    build_excluded: 1,
    not_diagnostic: 1
  })
})

test('does not persist arbitrary text, event names, malformed IDs or nested payload', () => {
  const [row] = sanitizeDiagnosticBatch(
    [
      {
        ...entry,
        requestId: 'private@example.com',
        traceId: 'secret',
        message: JSON.stringify({
          event: 'customer.private',
          data: {
            message: 'Some secret text',
            errorName: 'PrivatePerson'
          },
          context: { route: '//evil/private' }
        })
      }
    ],
    config
  ).observations
  assert.equal(row?.category, 'unclassified')
  assert.equal(row?.event_name, null)
  assert.equal(row?.error_name, null)
  assert.equal(row?.request_id, null)
  assert.equal(row?.trace_id, null)
  assert.equal(row?.context_route, null)
  assert.equal(JSON.stringify(row).includes('secret'), false)
})
