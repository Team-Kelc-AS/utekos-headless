import assert from 'node:assert/strict'
import test from 'node:test'
import {
  metaAdDeliveryBreakdownKinds,
  type MetaAdDeliveryInsight
} from './metaAdDeliveryInsight'
import {
  syncMetaAdDeliveryInsights,
  type MetaAdDeliveryInsightsSyncDependencies
} from './syncMetaAdDeliveryInsights'

function insight(
  breakdownKind: MetaAdDeliveryInsight['breakdownKind']
): MetaAdDeliveryInsight {
  return {
    accountId: '772268237116474',
    accountTimezone: 'America/Los_Angeles',
    actionReportTime: 'impression',
    adId: '120246491016410788',
    adsetId: '120246491016400788',
    apiVersion: 'v25.0',
    attributionSetting: 'account',
    breakdownKind,
    campaignId: '120246491016390788',
    clicks: 15,
    dimensionKey:
      breakdownKind === 'overall' ? 'all' : `${breakdownKind}:test`,
    impressions: 1200,
    insightDate: '2026-07-31',
    landingPageViews: breakdownKind === 'impression_device' ? null : 7,
    linkClicks: 12,
    metricAvailability: {
      clicks: 'available',
      impressions: 'available',
      landing_page_views:
        breakdownKind === 'impression_device'
          ? 'unavailable'
          : 'available',
      link_clicks: 'available',
      outbound_clicks: 'available'
    },
    outboundClicks: 12
  }
}

test('fetches all five daily grains before one idempotent upsert', async () => {
  const fetches: unknown[] = []
  const upserts: unknown[] = []
  const dependencies: MetaAdDeliveryInsightsSyncDependencies = {
    fetchAccountTimezone: async () => 'America/Los_Angeles',
    fetchInsights: async (_config, input) => {
      fetches.push(input)
      return [insight(input.breakdownKind)]
    },
    getConfig: () => ({
      accessToken: 'secret-token',
      accountId: '772268237116474'
    }),
    getNow: () => new Date('2026-08-01T06:30:00.000Z'),
    upsertInsights: async input => {
      upserts.push(input)
      return input.insights.length
    }
  }

  const result = await syncMetaAdDeliveryInsights(dependencies)

  assert.deepEqual(
    fetches.map(fetch =>
      (fetch as { breakdownKind: string }).breakdownKind
    ),
    metaAdDeliveryBreakdownKinds
  )
  assert.equal(upserts.length, 1)
  assert.equal(
    (upserts[0] as { insights: unknown[] }).insights.length,
    5
  )
  assert.deepEqual(result.rowsByBreakdown, {
    device_platform: 1,
    impression_device: 1,
    overall: 1,
    platform_position: 1,
    publisher_platform: 1
  })
  assert.equal(result.unavailableMetrics.landing_page_views, 1)
  assert.equal(result.since, '2026-07-24')
  assert.equal(result.until, '2026-07-30')
})

test('does not persist a partial set when one breakdown fails', async () => {
  let upsertCount = 0

  await assert.rejects(
    syncMetaAdDeliveryInsights({
      fetchAccountTimezone: async () => 'America/Los_Angeles',
      fetchInsights: async (_config, input) => {
        if (input.breakdownKind === 'platform_position') {
          throw new Error('Meta breakdown unavailable')
        }
        return [insight(input.breakdownKind)]
      },
      getConfig: () => ({
        accessToken: 'secret-token',
        accountId: '772268237116474'
      }),
      getNow: () => new Date('2026-08-01T06:30:00.000Z'),
      upsertInsights: async () => {
        upsertCount += 1
        return 0
      }
    }),
    /Meta breakdown unavailable/
  )

  assert.equal(upsertCount, 0)
})
