import assert from 'node:assert/strict'
import test from 'node:test'
import {
  runSyntheticProductionProbes,
  SYNTHETIC_PRODUCTION_PROBE_SURFACES
} from './syntheticProductionProbes'

const runId = '11111111-1111-4111-8111-111111111111'

function responseFor(url: URL, init: RequestInit) {
  assert.equal(
    new Headers(init.headers).get('origin'),
    'https://utekos.no'
  )

  if (url.pathname === '/skreddersy-varmen') {
    return new Response('<main data-skreddersy-route></main>', {
      status: 200
    })
  }

  if (url.pathname === '/api/log') {
    assert.equal(init.method, 'POST')
    assert.equal(
      new Headers(init.headers).get('authorization'),
      'Bearer cron-secret'
    )
    return Response.json({ ok: true })
  }

  if (url.pathname === '/api/ops/launch-guard/contracts') {
    assert.equal(init.method, 'POST')
    assert.equal(
      new Headers(init.headers).get('authorization'),
      'Bearer cron-secret'
    )
    assert.equal(
      new Headers(init.headers).get('x-utekos-automation'),
      'synthetic'
    )
    const payload = JSON.parse(String(init.body)) as {
      contract: string
    }
    assert.match(
      payload.contract,
      /^(page_view|add_to_cart|begin_checkout|cart_lines)$/
    )
    return Response.json({
      ok: true,
      result: 'invalid_contract_rejected'
    })
  }

  if (url.pathname === '/api/cart/checkout') {
    return new Response(null, { status: 303 })
  }

  if (url.pathname === '/__gtg/gtm.js') {
    return new Response('/* Google Tag Manager */', {
      status: 200
    })
  }

  if (url.pathname === '/__sgtm/healthy') {
    assert.equal(
      new Headers(init.headers).has('authorization'),
      false
    )
    return new Response('ok', {
      headers: { 'Cache-Control': 'no-store' },
      status: 200
    })
  }

  throw new Error(`Unexpected probe path ${url.pathname}`)
}

test('runs every privacy-free production probe without commerce side effects', async () => {
  const snapshots = await runSyntheticProductionProbes({
    cronSecret: 'cron-secret',
    fetch: async (input, init = {}) =>
      responseFor(new URL(String(input)), init),
    now: () => new Date('2026-08-29T12:00:00.000Z'),
    origin: 'https://utekos.no',
    runId
  })

  assert.equal(
    snapshots.length,
    SYNTHETIC_PRODUCTION_PROBE_SURFACES.length
  )
  assert.ok(
    snapshots.every(snapshot => snapshot.status === 'healthy')
  )
  assert.ok(
    snapshots.every(snapshot => snapshot.errorCount === 0)
  )
  assert.ok(
    snapshots.every(
      snapshot =>
        snapshot.providerReceiptStatus === 'not_applicable'
    )
  )
})

test('returns a stable privacy-free fingerprint and one safe retry for failures', async () => {
  const snapshots = await runSyntheticProductionProbes(
    {
      cronSecret: 'cron-secret',
      fetch: async () => new Response('failed', { status: 500 }),
      now: () => new Date('2026-08-29T12:00:00.000Z'),
      origin: 'https://utekos.no',
      runId
    },
    new Set(['api_log_contract'])
  )

  assert.deepEqual(
    snapshots.map(snapshot => ({
      errorCount: snapshot.errorCount,
      fingerprint: snapshot.errorFingerprint,
      resultCode: snapshot.resultCode,
      safeAction: snapshot.safeAction,
      status: snapshot.status
    })),
    [
      {
        errorCount: 1,
        fingerprint:
          'probe:api_log_contract:e44ca3196a6847b56ee4d741',
        resultCode: 'valid_probe_rejected',
        safeAction: 'retry_probe_once',
        status: 'unhealthy'
      }
    ]
  )
})
