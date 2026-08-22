import assert from 'node:assert/strict'
import test from 'node:test'

import {
  handleAbandonedCheckoutRecoveryCron
} from './route'

type Dependencies = NonNullable<Parameters<
  typeof handleAbandonedCheckoutRecoveryCron
>[1]>

function request(secret = 'correct-secret') {
  return new Request(
    'https://utekos.no/api/cron/abandoned-checkout-recovery',
    { headers: { authorization: `Bearer ${secret}` } }
  )
}

function dependencies(
  overrides: Partial<Dependencies> = {}
): Dependencies {
  return {
    getCronSecret: () => 'correct-secret',
    getEnabled: () => undefined,
    getActivationAt: () => undefined,
    createWorkerId: () => 'acr:test-worker',
    startWorkflow: async () => {
      throw new Error('must not start')
    },
    ...overrides
  }
}

test('rejects an invalid cron secret', async () => {
  const response = await handleAbandonedCheckoutRecoveryCron(
    request('wrong-secret'),
    dependencies()
  )

  assert.equal(response.status, 401)
  assert.equal(response.headers.get('cache-control'), 'no-store')
})

test('is inert when the activation gate is absent', async () => {
  const response = await handleAbandonedCheckoutRecoveryCron(
    request(),
    dependencies()
  )

  assert.equal(response.status, 200)
  assert.deepEqual(await response.json(), {
    ok: true,
    enabled: false
  })
})

test('fails closed when enabled without a valid activation timestamp', async () => {
  const response = await handleAbandonedCheckoutRecoveryCron(
    request(),
    dependencies({
      getEnabled: () => 'true',
      getActivationAt: () => 'not-a-date'
    })
  )

  assert.equal(response.status, 500)
  assert.deepEqual(await response.json(), {
    ok: false,
    error: 'invalid_activation_at'
  })
})

test('starts a PII-free workflow only when explicitly enabled', async () => {
  let receivedInput: Parameters<Dependencies['startWorkflow']>[0] | undefined

  const response = await handleAbandonedCheckoutRecoveryCron(
    request(),
    dependencies({
      getEnabled: () => 'true',
      getActivationAt: () => '2026-08-22T10:00:00+02:00',
      startWorkflow: async input => {
        receivedInput = input
        return { runId: 'wrun_test' }
      }
    })
  )

  assert.equal(response.status, 202)
  assert.deepEqual(receivedInput, {
    activationAt: '2026-08-22T08:00:00.000Z',
    workerId: 'acr:test-worker'
  })
  assert.equal('email' in receivedInput!, false)
  assert.equal('recoveryUrl' in receivedInput!, false)
  assert.deepEqual(await response.json(), {
    ok: true,
    enabled: true,
    runId: 'wrun_test'
  })
})
