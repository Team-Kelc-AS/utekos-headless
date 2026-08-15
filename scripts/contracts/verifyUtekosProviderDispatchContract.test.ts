import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import test from 'node:test'
import { fileURLToPath } from 'node:url'
import {
  CANONICAL_PROVIDER_DISPATCH_RETENTION_SECONDS,
  CANONICAL_PROVIDER_DISPATCH_TOPIC,
  canonicalProviderDispatchMessageSchema
} from '../../src/lib/analytics/server/canonicalProviderDispatchQueue'
import { providerAdapterRegistry } from '../../src/lib/analytics/server/providerAdapterRegistry'
import { providerOutboxWorkerRegistry } from '../../src/lib/analytics/server/providerOutboxWorkerRegistry'
import { generateUtekosProviderDispatchContract } from './generateUtekosProviderDispatchContract'

const repositoryRoot = resolve(
  dirname(fileURLToPath(import.meta.url)),
  '../..'
)

function contract() {
  return JSON.parse(
    readFileSync(
      resolve(
        repositoryRoot,
        'contracts/asyncapi/utekos-provider-dispatch/0.1.0/asyncapi.json'
      ),
      'utf8'
    )
  )
}

function vercelConfig() {
  return JSON.parse(
    readFileSync(resolve(repositoryRoot, 'vercel.json'), 'utf8')
  )
}

test('generated Provider Dispatch artifacts have no drift', () => {
  assert.doesNotThrow(() =>
    generateUtekosProviderDispatchContract(true)
  )
})

test('AsyncAPI channel and queue options match runtime constants', () => {
  const definition = contract()
  assert.equal(definition.asyncapi, '3.1.0')
  assert.equal(
    definition.channels.canonicalProviderDispatch.address,
    CANONICAL_PROVIDER_DISPATCH_TOPIC
  )
  assert.equal(
    definition.channels.canonicalProviderDispatch[
      'x-utekos-queue-options'
    ].retentionSeconds,
    CANONICAL_PROVIDER_DISPATCH_RETENTION_SECONDS
  )
  assert.equal(
    definition.channels.canonicalProviderDispatch[
      'x-utekos-queue-options'
    ].visibilityTimeoutSeconds,
    60
  )
  assert.equal(
    definition.channels.canonicalProviderDispatch[
      'x-utekos-queue-options'
    ].deliveryGuarantee,
    'at-least-once'
  )
  assert.equal(
    definition.channels.canonicalProviderDispatch[
      'x-utekos-queue-options'
    ].deduplicationWindowSeconds,
    86400
  )
})

test('AsyncAPI queue trigger parameters match vercel.json', () => {
  const definition = contract()
  const trigger =
    vercelConfig().functions[
      'src/app/api/queues/canonical-provider-dispatch/route.ts'
    ].experimentalTriggers[0]
  const options =
    definition.channels.canonicalProviderDispatch[
      'x-utekos-queue-options'
    ]

  assert.equal(trigger.type, 'queue/v2beta')
  assert.equal(trigger.topic, CANONICAL_PROVIDER_DISPATCH_TOPIC)
  assert.equal(
    trigger.initialDelaySeconds,
    options.initialDelaySeconds
  )
  assert.equal(
    trigger.retryAfterSeconds,
    options.retryAfterSeconds
  )
})

test('AsyncAPI adapter enum equals both registered adapters and workers', () => {
  const definition = contract()
  const enumValues =
    definition.components.schemas
      .CanonicalProviderDispatchMessage.properties.adapter_key
      .enum

  assert.deepEqual(
    enumValues,
    Object.keys(providerAdapterRegistry).sort()
  )
  assert.deepEqual(
    enumValues,
    Object.keys(providerOutboxWorkerRegistry).sort()
  )
})

test('documented message example is accepted and remains PII-free', () => {
  const definition = contract()
  const example =
    definition.components.messages.CanonicalProviderDispatchV1
      .examples[0].payload

  assert.deepEqual(
    canonicalProviderDispatchMessageSchema.parse(example),
    example
  )
  assert.deepEqual(Object.keys(example).sort(), [
    'adapter_key',
    'attempt_id',
    'schema_version'
  ])
})
