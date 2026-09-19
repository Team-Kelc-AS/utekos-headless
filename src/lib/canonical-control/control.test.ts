import assert from 'node:assert/strict'
import test from 'node:test'
import { getCanonicalContext } from './getCanonicalContext'
import { controlInputSchema } from './controlInput'
import { controlResultSchema } from './controlResult'
import { isControlOperator } from './isControlOperator'
import { controlAuthConfig } from './controlAuthConfig'
import {
  registerControlTool,
  type ControlModelContext
} from './registerControlTool'

test('context returns complete exact event definition without bootstrap', () => {
  const result = controlResultSchema.parse(
    getCanonicalContext({ name: 'view_item' })
  )
  assert.equal(result.inventory.length, 33)
  assert.equal(result.contexts.length, 1)
  assert.equal(result.contexts[0]?.definition.name, 'view_item')
  assert.equal(result.live_evidence, 'not_queried')
  assert(result.contexts[0]?.definition.schema)
  assert(result.contexts[0]?.pipeline.adapters)
  assert(!JSON.stringify(result).includes('client_secret'))
})

test('inventory and bounded search preserve membership and evidence boundaries', () => {
  assert.equal(getCanonicalContext({}).contexts.length, 0)
  assert.equal(getCanonicalContext({}).catalog_only.length, 2)
  const result = getCanonicalContext({
    query: 'event_id',
    limit: 1
  })
  assert.equal(result.contexts.length, 1)
  assert(result.truncated)
  assert.throws(
    () => getCanonicalContext({ name: 'checkout_error' }),
    /EVENT_NOT_FOUND/
  )
  assert.throws(
    () => getCanonicalContext({ name: 'unknown' }),
    /EVENT_NOT_FOUND/
  )
  for (const input of [
    { name: 'view_item', query: 'item' },
    { limit: 6 },
    { limit: '1' },
    { query: ' ' },
    { path: '/etc/passwd' },
    { name: '../../secret' }
  ])
    assert.equal(
      controlInputSchema.safeParse(input).success,
      false
    )
})

test('operator authorization fails closed for wrong user, org, unverified email and impersonation', () => {
  const expected = {
    userId: 'user_operator',
    organizationId: 'org_utekos'
  }
  const valid = {
    user: { id: expected.userId, emailVerified: true },
    organizationId: expected.organizationId
  }
  assert(isControlOperator(valid, expected))
  for (const input of [
    null,
    {},
    { ...valid, user: null },
    { ...valid, organizationId: 'org_other' },
    {
      ...valid,
      user: { id: 'user_other', emailVerified: true }
    },
    {
      ...valid,
      user: { id: expected.userId, emailVerified: false }
    },
    { ...valid, impersonator: { email: 'someone@example.com' } }
  ])
    assert.equal(isControlOperator(input, expected), false)
  assert.equal(controlAuthConfig({}).success, false)
})

test('WebMCP owns registration signal, validates through domain service and cancels execution', async () => {
  let tool:
    | Parameters<ControlModelContext['registerTool']>[0]
    | undefined
  const controller = new AbortController()
  const context: ControlModelContext = {
    registerTool: (definition, options) => {
      assert.equal(options.signal, controller.signal)
      tool = definition
    }
  }
  await registerControlTool(
    context,
    controller.signal,
    async input => getCanonicalContext(input)
  )
  assert.equal(tool?.name, 'canonical_event_context')
  assert.equal(tool?.annotations.readOnlyHint, true)
  const executeSignal = new AbortController().signal
  const result = await tool!.execute(
    { name: 'purchase' },
    { signal: executeSignal }
  )
  assert.equal(
    controlResultSchema.parse(result).contexts[0]?.definition
      .name,
    'purchase'
  )
  await assert.rejects(
    tool!.execute({ limit: 999 }, { signal: executeSignal })
  )
  for (const options of [undefined, {}]) {
    const inventory = controlResultSchema.parse(
      await tool!.execute({}, options)
    )
    assert.equal(inventory.inventory.length, 33)
  }
  const cancelledInvocation = new AbortController()
  cancelledInvocation.abort()
  await assert.rejects(
    tool!.execute({}, { signal: cancelledInvocation.signal }),
    { name: 'AbortError' }
  )
  controller.abort()
  await assert.rejects(tool!.execute({}), { name: 'AbortError' })
  await assert.rejects(
    tool!.execute({}, { signal: executeSignal }),
    { name: 'AbortError' }
  )
})
