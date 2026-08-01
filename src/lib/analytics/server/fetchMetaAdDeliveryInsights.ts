import {
  metaAdDeliveryBreakdownKinds,
  type MetaAdDeliveryBreakdownKind,
  type MetaAdDeliveryInsight,
  type MetaAdDeliveryMetricAvailability
} from './metaAdDeliveryInsight'
import type { MetaAdDeliveryInsightsConfig } from './metaAdDeliveryInsightsConfig'
import {
  metaAdDeliveryInsightsResponseSchema,
  type MetaAdDeliveryInsightRow
} from './metaAdDeliveryInsightsSchema'
import { fetchMetaGraphJson, type MetaGraphFetch } from './fetchMetaGraphJson'

const META_ADS_API_VERSION = 'v25.0'
const META_ADS_ACTION_REPORT_TIME = 'impression'
const META_ADS_FIELDS = [
  'account_id',
  'campaign_id',
  'campaign_name',
  'adset_id',
  'adset_name',
  'ad_id',
  'ad_name',
  'date_start',
  'date_stop',
  'impressions',
  'clicks',
  'outbound_clicks',
  'actions'
].join(',')
const META_ADS_MAX_PAGES = 100

type MetaAdDeliveryDateWindow = {
  since: string
  until: string
}

type Metric = {
  availability: 'available' | 'unavailable'
  value: number | null
}

function parseMetricValue(value: string) {
  const parsed = Number(value)
  if (!Number.isFinite(parsed) || parsed < 0) {
    throw new Error('Meta returned an invalid delivery metric')
  }

  return parsed
}

function directMetric(value: string | null | undefined): Metric {
  if (value === undefined || value === null) {
    return { availability: 'unavailable', value: null }
  }

  return { availability: 'available', value: parseMetricValue(value) }
}

function actionMetric(
  actions: MetaAdDeliveryInsightRow['actions'],
  actionType: string
): Metric {
  if (actions === undefined || actions === null) {
    return { availability: 'unavailable', value: null }
  }

  return {
    availability: 'available',
    value: actions
      .filter(action => action.action_type === actionType)
      .reduce((sum, action) => sum + parseMetricValue(action.value), 0)
  }
}

function requireDimension(value: string | undefined, name: string) {
  if (!value) {
    throw new Error(`Meta omitted ${name} for its requested breakdown`)
  }

  return value
}

function dimensionsFor(
  row: MetaAdDeliveryInsightRow,
  breakdownKind: MetaAdDeliveryBreakdownKind
) {
  switch (breakdownKind) {
    case 'overall':
      return { dimensionKey: 'all' }
    case 'publisher_platform': {
      const publisherPlatform = requireDimension(
        row.publisher_platform,
        'publisher_platform'
      )
      return {
        dimensionKey: `publisher_platform:${publisherPlatform}`,
        publisherPlatform
      }
    }
    case 'platform_position': {
      const publisherPlatform = requireDimension(
        row.publisher_platform,
        'publisher_platform'
      )
      const platformPosition = requireDimension(
        row.platform_position,
        'platform_position'
      )
      return {
        dimensionKey:
          `platform_position:${publisherPlatform}:${platformPosition}`,
        platformPosition,
        publisherPlatform
      }
    }
    case 'device_platform': {
      const devicePlatform = requireDimension(
        row.device_platform,
        'device_platform'
      )
      return {
        devicePlatform,
        dimensionKey: `device_platform:${devicePlatform}`
      }
    }
    case 'impression_device': {
      const impressionDevice = requireDimension(
        row.impression_device,
        'impression_device'
      )
      return {
        dimensionKey: `impression_device:${impressionDevice}`,
        impressionDevice
      }
    }
  }
}

function normalizeInsight(
  row: MetaAdDeliveryInsightRow,
  input: {
    accountTimezone: string
    breakdownKind: MetaAdDeliveryBreakdownKind
    expectedAccountId: string
  }
): MetaAdDeliveryInsight {
  if (row.account_id !== input.expectedAccountId) {
    throw new Error('Meta returned delivery data for an unexpected account')
  }

  const impressions = directMetric(row.impressions)
  const clicks = directMetric(row.clicks)
  const linkClicks = actionMetric(row.actions, 'link_click')
  const outboundClicks = actionMetric(
    row.outbound_clicks,
    'outbound_click'
  )
  const landingPageViews = actionMetric(
    row.actions,
    'landing_page_view'
  )
  const metricAvailability: MetaAdDeliveryMetricAvailability = {
    clicks: clicks.availability,
    impressions: impressions.availability,
    landing_page_views: landingPageViews.availability,
    link_clicks: linkClicks.availability,
    outbound_clicks: outboundClicks.availability
  }

  return {
    accountId: row.account_id,
    accountTimezone: input.accountTimezone,
    actionReportTime: META_ADS_ACTION_REPORT_TIME,
    adId: row.ad_id,
    ...(row.ad_name ? { adName: row.ad_name } : {}),
    adsetId: row.adset_id,
    ...(row.adset_name ? { adsetName: row.adset_name } : {}),
    apiVersion: META_ADS_API_VERSION,
    attributionSetting: 'account',
    breakdownKind: input.breakdownKind,
    campaignId: row.campaign_id,
    ...(row.campaign_name ? { campaignName: row.campaign_name } : {}),
    clicks: clicks.value,
    ...dimensionsFor(row, input.breakdownKind),
    impressions: impressions.value,
    insightDate: row.date_start,
    landingPageViews: landingPageViews.value,
    linkClicks: linkClicks.value,
    metricAvailability,
    outboundClicks: outboundClicks.value
  }
}

function buildInsightsUrl(
  config: MetaAdDeliveryInsightsConfig,
  dateWindow: MetaAdDeliveryDateWindow,
  breakdownKind: MetaAdDeliveryBreakdownKind,
  after?: string
) {
  const url = new URL(
    `https://graph.facebook.com/${META_ADS_API_VERSION}/act_${config.accountId}/insights`
  )
  url.searchParams.set('action_report_time', META_ADS_ACTION_REPORT_TIME)
  url.searchParams.set('fields', META_ADS_FIELDS)
  url.searchParams.set('level', 'ad')
  url.searchParams.set('limit', '500')
  url.searchParams.set('time_increment', '1')
  url.searchParams.set('time_range', JSON.stringify(dateWindow))
  url.searchParams.set('use_account_attribution_setting', 'true')
  if (breakdownKind !== 'overall') {
    url.searchParams.set(
      'breakdowns',
      breakdownKind === 'platform_position'
        ? 'publisher_platform,platform_position'
        : breakdownKind
    )
  }
  if (after) url.searchParams.set('after', after)

  return url
}

export async function fetchMetaAdDeliveryInsights(
  config: MetaAdDeliveryInsightsConfig,
  input: {
    accountTimezone: string
    breakdownKind: MetaAdDeliveryBreakdownKind
    dateWindow: MetaAdDeliveryDateWindow
  },
  fetchImplementation?: MetaGraphFetch
) {
  if (!metaAdDeliveryBreakdownKinds.includes(input.breakdownKind)) {
    throw new Error('Unsupported Meta delivery insights breakdown')
  }

  const rows: MetaAdDeliveryInsight[] = []
  const seenCursors = new Set<string>()
  let after: string | undefined

  for (let page = 0; page < META_ADS_MAX_PAGES; page += 1) {
    const response = await fetchMetaGraphJson({
      accessToken: config.accessToken,
      ...(fetchImplementation ? { fetchImplementation } : {}),
      schema: metaAdDeliveryInsightsResponseSchema,
      url: buildInsightsUrl(
        config,
        input.dateWindow,
        input.breakdownKind,
        after
      )
    })

    rows.push(
      ...response.data.map(row =>
        normalizeInsight(row, {
          accountTimezone: input.accountTimezone,
          breakdownKind: input.breakdownKind,
          expectedAccountId: config.accountId
        })
      )
    )

    const nextCursor = response.paging?.cursors?.after
    if (!nextCursor) return rows
    if (seenCursors.has(nextCursor)) {
      throw new Error('Meta repeated an Insights pagination cursor')
    }

    seenCursors.add(nextCursor)
    after = nextCursor
  }

  throw new Error('Meta delivery insights exceeded the pagination limit')
}
