import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import { getCanonicalContext } from './getCanonicalContext'
import { controlResultSchema } from './controlResult'
import { createControlContextResponse } from './createControlContextResponse'
import { canonicalEventSchema } from '../analytics/canonicalEvent'

test('every canonical definition passes the same strict result contract', () => {
  for (const member of canonicalEventSchema.options) {
    const name =
      member._zod.def.shape.event_name._zod.def.values[0]
    const result = getCanonicalContext({ name })
    assert.equal(
      result.result_version,
      'canonical-event-context.v2'
    )
    assert.equal(result.contexts[0]?.definition.name, name)
    assert.equal(result.live_evidence, 'not_queried')
  }
})

test('strict output rejects unknown fields and invalid nested values, without stripping them', () => {
  const base = getCanonicalContext({ name: 'purchase' })
  const mutations: Array<(result: typeof base) => void> = [
    result => Object.assign(result, { surprise: true }),
    result =>
      Object.assign(result.tracking_authorization, {
        enabled: true
      }),
    result =>
      Object.assign(result.contexts[0]!.definition, {
        invented: true
      }),
    result =>
      Object.assign(result.contexts[0]!.pipeline, {
        invented: true
      }),
    result =>
      Object.assign(
        result.contexts[0]!.definition.policy.consent,
        { invented: true }
      ),
    result =>
      Object.assign(
        result.contexts[0]!.definition.provider_mappings.meta,
        { invented: true }
      ),
    result =>
      Object.assign(
        result.contexts[0]!.definition.schema.json_schema,
        { unsupportedKeyword: true }
      ),
    result =>
      Object.assign(
        result.contexts[0]!.definition.runtime_contract
          .rules[0]!,
        { item_price_sources: ['gross_price'] }
      ),
    result =>
      Object.assign(result.contexts[0]!.definition.evidence, {
        runtime: 'runtime_observed'
      })
  ]
  for (const mutate of mutations) {
    const result = structuredClone(base)
    mutate(result)
    assert.equal(
      controlResultSchema.safeParse(result).success,
      false
    )
  }
})

test('HTTP response boundary rejects corrupt builder results before emitting JSON', async () => {
  const valid = getCanonicalContext({ name: 'add_to_cart' })
  const headers = { 'Cache-Control': 'private, no-store' }
  const ok = createControlContextResponse(
    { name: 'add_to_cart' },
    headers
  )
  assert.equal(ok.status, 200)
  assert.deepEqual(await ok.json(), valid)
  const corrupt = createControlContextResponse(
    {},
    headers,
    () => ({ ...valid, rogue: 'private value' })
  )
  assert.equal(corrupt.status, 500)
  assert.equal(
    corrupt.headers.get('Cache-Control'),
    'private, no-store'
  )
  assert.deepEqual(await corrupt.json(), {
    error: 'INVALID_CONTROL_OUTPUT'
  })
  const missing = createControlContextResponse(
    { name: 'not_an_event' },
    headers
  )
  assert.equal(missing.status, 404)
  assert.deepEqual(await missing.json(), {
    error: 'EVENT_NOT_FOUND'
  })
  const failed = createControlContextResponse(
    {},
    headers,
    () => {
      throw new Error('private implementation detail')
    }
  )
  assert.equal(failed.status, 500)
  assert.deepEqual(await failed.json(), {
    error: 'INVALID_CONTROL_OUTPUT'
  })
})

test('generated result schema has closed business objects and a bounded JSON Schema vocabulary', () => {
  const schema = JSON.parse(
    readFileSync(
      'contracts/events/canonical-event-manifest/v1/canonical-event-context.v2.schema.json',
      'utf8'
    )
  )
  const visit = (node: Record<string, unknown>) => {
    if (node.type === 'object' && node.properties)
      assert.equal(node.additionalProperties, false)
    assert.notDeepEqual(node, {})
    for (const value of Object.values(node)) {
      if (Array.isArray(value)) {
        for (const entry of value)
          if (entry && typeof entry === 'object') visit(entry)
      } else if (value && typeof value === 'object')
        visit(value as Record<string, unknown>)
    }
  }
  visit(schema)
})
