import assert from 'node:assert/strict'
import test from 'node:test'
import { readVercelPlatformHealth } from './vercelPlatformHealth'

const runId = '11111111-1111-4111-8111-111111111111'
const now = () => new Date('2026-08-29T12:00:00.000Z')

test('marks Vercel REST readback as not configured without exposing partial config', async () => {
  const snapshots = await readVercelPlatformHealth({
    environment: { VERCEL_PROJECT_ID: 'prj_test' },
    fetch: async () => {
      throw new Error('must not call Vercel without complete config')
    },
    now,
    runId
  })

  assert.deepEqual(
    snapshots.map(snapshot => ({
      status: snapshot.status,
      surface: snapshot.surface
    })),
    [
      {
        status: 'not_configured',
        surface: 'web_analytics_route_traffic'
      },
      { status: 'not_configured', surface: 'drain_readback' }
    ]
  )
})

test('verifies route traffic and flags an account-wide fully sampled trace drain', async () => {
  const snapshots = await readVercelPlatformHealth({
    environment: {
      VERCEL_API_TOKEN: 'secret-token',
      VERCEL_PROJECT_ID: 'prj_utekos',
      VERCEL_TEAM_ID: 'team_utekos'
    },
    fetch: async input => {
      const url = new URL(String(input))

      if (url.pathname.includes('/web-analytics/')) {
        return Response.json({
          version: 1,
          query: {},
          data: { pageviews: 12, visitors: 10 }
        })
      }

      return Response.json({
        drains: [
          {
            status: 'enabled',
            schemas: { log: {} },
            projectIds: ['prj_utekos']
          },
          {
            status: 'enabled',
            schemas: { trace: {} },
            projectIds: [],
            sampling: [
              { type: 'head_sampling', rate: 1, env: 'production' }
            ]
          }
        ]
      })
    },
    now,
    runId
  })

  assert.equal(snapshots[0]?.status, 'healthy')
  assert.equal(snapshots[0]?.sampleCount, 12)
  assert.equal(
    snapshots[0]?.providerReceiptStatus,
    'verified'
  )
  assert.equal(snapshots[1]?.status, 'degraded')
  assert.equal(
    snapshots[1]?.resultCode,
    'vercel_trace_drain_scope_or_sampling_unsafe'
  )
})
