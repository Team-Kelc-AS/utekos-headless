import assert from 'node:assert/strict'
import test from 'node:test'
import { fetchMetaAdAccountTimezone } from './fetchMetaAdAccountTimezone'
import { fetchMetaAdDeliveryInsights } from './fetchMetaAdDeliveryInsights'
import type { MetaGraphFetch } from './fetchMetaGraphJson'
import { getMetaAdDeliveryDateWindow } from './getMetaAdDeliveryDateWindow'
import { readMetaAdDeliveryInsightsConfig } from './metaAdDeliveryInsightsConfig'

const config = {
  accessToken: 'secret-system-user-token',
  accountId: '772268237116474'
}

const baseRow = {
  account_id: '772268237116474',
  actions: [
    { action_type: 'link_click', value: '12' },
    { action_type: 'landing_page_view', value: '7' }
  ],
  ad_id: '120246491016410788',
  ad_name: 'New Sales Ad',
  adset_id: '120246491016400788',
  adset_name: 'Ad set',
  campaign_id: '120246491016390788',
  campaign_name: 'Sales Campaign',
  clicks: '15',
  date_start: '2026-07-31',
  date_stop: '2026-07-31',
  impressions: '1200',
  outbound_clicks: [{ action_type: 'outbound_click', value: '12' }]
}

test('requires the read-only system user token and normalizes the account id', () => {
  assert.deepEqual(
    readMetaAdDeliveryInsightsConfig({
      META_AD_ACCOUNT_ID: ' act_772268237116474 ',
      META_APP_USER_TOKEN: 'interactive-user-token',
      META_SYSTEM_USER_TOKEN: ' system-user-token '
    }),
    {
      accessToken: 'system-user-token',
      accountId: '772268237116474'
    }
  )
})

test('uses the seven most recent completed account-timezone dates', () => {
  assert.deepEqual(
    getMetaAdDeliveryDateWindow(
      new Date('2026-08-01T06:30:00.000Z'),
      'America/Los_Angeles'
    ),
    { since: '2026-07-24', until: '2026-07-30' }
  )
})

test('reads account timezone with bearer auth and no token in the URL', async () => {
  const calls: Array<{ init: RequestInit; url: URL }> = []
  const fetchImplementation: MetaGraphFetch = async (input, init) => {
    calls.push({ init, url: new URL(input) })
    return {
      json: async () => ({
        id: 'act_772268237116474',
        timezone_name: 'America/Los_Angeles'
      }),
      ok: true,
      status: 200
    }
  }

  assert.equal(
    await fetchMetaAdAccountTimezone(config, fetchImplementation),
    'America/Los_Angeles'
  )
  assert.equal(calls[0]?.url.searchParams.has('access_token'), false)
  assert.deepEqual(calls[0]?.init.headers, {
    accept: 'application/json',
    authorization: 'Bearer secret-system-user-token'
  })
  assert.equal(calls[0]?.init.cache, 'no-store')
})

test('normalizes explicit zeroes separately from unavailable action fields', async () => {
  const responses = [
    {
      data: [
        {
          ...baseRow,
          actions: [],
          device_platform: 'mobile_app',
          outbound_clicks: []
        },
        {
          ...baseRow,
          actions: undefined,
          ad_id: '120246491016410789',
          device_platform: 'mobile_web',
          outbound_clicks: undefined
        }
      ]
    }
  ]
  const fetchImplementation: MetaGraphFetch = async () => ({
    json: async () => responses.shift(),
    ok: true,
    status: 200
  })

  const result = await fetchMetaAdDeliveryInsights(
    config,
    {
      accountTimezone: 'America/Los_Angeles',
      breakdownKind: 'device_platform',
      dateWindow: { since: '2026-07-25', until: '2026-07-31' }
    },
    fetchImplementation
  )

  assert.equal(result[0]?.linkClicks, 0)
  assert.equal(result[0]?.landingPageViews, 0)
  assert.equal(result[0]?.outboundClicks, 0)
  assert.equal(result[0]?.metricAvailability.link_clicks, 'available')
  assert.equal(result[1]?.linkClicks, null)
  assert.equal(result[1]?.landingPageViews, null)
  assert.equal(result[1]?.outboundClicks, null)
  assert.equal(result[1]?.metricAvailability.link_clicks, 'unavailable')
})

test('requests one breakdown and reconstructs pagination from the cursor only', async () => {
  const calls: Array<{ init: RequestInit; url: URL }> = []
  const responses = [
    {
      data: [{ ...baseRow, publisher_platform: 'facebook' }],
      paging: {
        cursors: { after: 'safe-cursor' },
        next: 'https://graph.facebook.com/unsafe?access_token=leaked'
      }
    },
    {
      data: [
        {
          ...baseRow,
          ad_id: '120246491016410789',
          publisher_platform: 'instagram'
        }
      ]
    }
  ]
  const fetchImplementation: MetaGraphFetch = async (input, init) => {
    calls.push({ init, url: new URL(input) })
    return {
      json: async () => responses.shift(),
      ok: true,
      status: 200
    }
  }

  const result = await fetchMetaAdDeliveryInsights(
    config,
    {
      accountTimezone: 'America/Los_Angeles',
      breakdownKind: 'publisher_platform',
      dateWindow: { since: '2026-07-25', until: '2026-07-31' }
    },
    fetchImplementation
  )

  assert.equal(result.length, 2)
  assert.equal(calls.length, 2)
  assert.equal(
    calls[0]?.url.searchParams.get('breakdowns'),
    'publisher_platform'
  )
  assert.equal(calls[0]?.url.searchParams.get('time_increment'), '1')
  assert.equal(
    calls[0]?.url.searchParams.get('action_report_time'),
    'impression'
  )
  assert.equal(
    calls[0]?.url.searchParams.get('use_account_attribution_setting'),
    'true'
  )
  assert.equal(calls[1]?.url.searchParams.get('after'), 'safe-cursor')
  assert.equal(calls[1]?.url.searchParams.has('access_token'), false)
  assert.doesNotMatch(calls[1]?.url.toString() ?? '', /unsafe|leaked/)
})

test('preserves provider impression-device values without inferring OS', async () => {
  const fetchImplementation: MetaGraphFetch = async () => ({
    json: async () => ({
      data: [
        { ...baseRow, impression_device: 'iphone' },
        {
          ...baseRow,
          ad_id: '120246491016410789',
          impression_device: 'android_smartphone'
        },
        {
          ...baseRow,
          ad_id: '120246491016410790',
          impression_device: 'desktop'
        }
      ]
    }),
    ok: true,
    status: 200
  })

  const result = await fetchMetaAdDeliveryInsights(
    config,
    {
      accountTimezone: 'America/Los_Angeles',
      breakdownKind: 'impression_device',
      dateWindow: { since: '2026-07-25', until: '2026-07-31' }
    },
    fetchImplementation
  )

  assert.deepEqual(
    result.map(row => row.impressionDevice),
    ['iphone', 'android_smartphone', 'desktop']
  )
  assert.equal('operatingSystem' in (result[0] ?? {}), false)
})

test('pairs platform position with publisher platform in one dimension', async () => {
  const calls: URL[] = []
  const fetchImplementation: MetaGraphFetch = async input => {
    calls.push(new URL(input))
    return {
      json: async () => ({
        data: [
          {
            ...baseRow,
            platform_position: 'feed',
            publisher_platform: 'facebook'
          }
        ]
      }),
      ok: true,
      status: 200
    }
  }

  const result = await fetchMetaAdDeliveryInsights(
    config,
    {
      accountTimezone: 'America/Los_Angeles',
      breakdownKind: 'platform_position',
      dateWindow: { since: '2026-07-25', until: '2026-07-31' }
    },
    fetchImplementation
  )

  assert.equal(
    calls[0]?.searchParams.get('breakdowns'),
    'publisher_platform,platform_position'
  )
  assert.equal(
    result[0]?.dimensionKey,
    'platform_position:facebook:feed'
  )
  assert.equal(result[0]?.publisherPlatform, 'facebook')
  assert.equal(result[0]?.platformPosition, 'feed')
})

test('rejects an ambiguous platform position without its publisher', async () => {
  const fetchImplementation: MetaGraphFetch = async () => ({
    json: async () => ({
      data: [{ ...baseRow, platform_position: 'feed' }]
    }),
    ok: true,
    status: 200
  })

  await assert.rejects(
    fetchMetaAdDeliveryInsights(
      config,
      {
        accountTimezone: 'America/Los_Angeles',
        breakdownKind: 'platform_position',
        dateWindow: { since: '2026-07-25', until: '2026-07-31' }
      },
      fetchImplementation
    ),
    /omitted publisher_platform/
  )
})
