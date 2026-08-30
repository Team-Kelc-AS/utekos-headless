import assert from 'node:assert/strict'
import test from 'node:test'
import { handleLaunchGuardContractProbe } from './route'

function request(
  contract: string,
  options: { automationHeader?: string; secret?: string } = {}
) {
  const {
    automationHeader = 'synthetic',
    secret = 'correct-secret'
  } = options

  return new Request(
    'https://utekos.no/api/ops/launch-guard/contracts',
    {
      body: JSON.stringify({ contract }),
      headers: {
        'Authorization': `Bearer ${secret}`,
        'Content-Type': 'application/json',
        'X-Utekos-Automation': automationHeader
      },
      method: 'POST'
    }
  )
}

const dependencies = { getCronSecret: () => 'correct-secret' }

test('checks every collector contract without calling a collector or store', async () => {
  for (const contract of [
    'page_view',
    'add_to_cart',
    'begin_checkout'
  ]) {
    const response = await handleLaunchGuardContractProbe(
      request(contract),
      dependencies
    )

    assert.equal(response.status, 200)
    assert.deepEqual(await response.json(), {
      ok: true,
      result: 'invalid_contract_rejected'
    })
    assert.equal(
      response.headers.get('cache-control'),
      'no-store'
    )
  }
})

test('requires both cron authorization and the synthetic marker', async () => {
  const unauthorized = await handleLaunchGuardContractProbe(
    request('page_view', { secret: 'wrong-secret' }),
    dependencies
  )
  const unmarked = await handleLaunchGuardContractProbe(
    request('page_view', { automationHeader: 'browser' }),
    dependencies
  )

  assert.equal(unauthorized.status, 401)
  assert.equal(unmarked.status, 403)
})

test('rejects unknown probe contracts without exposing schema details', async () => {
  const response = await handleLaunchGuardContractProbe(
    request('unknown'),
    dependencies
  )

  assert.equal(response.status, 400)
  assert.deepEqual(await response.json(), {
    ok: false,
    error: 'invalid_probe_contract'
  })
})
