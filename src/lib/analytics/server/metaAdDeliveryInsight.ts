export const metaAdDeliveryBreakdownKinds = [
  'overall',
  'publisher_platform',
  'platform_position',
  'device_platform',
  'impression_device'
] as const

export type MetaAdDeliveryBreakdownKind =
  (typeof metaAdDeliveryBreakdownKinds)[number]

export const metaAdDeliveryMetricNames = [
  'impressions',
  'clicks',
  'link_clicks',
  'outbound_clicks',
  'landing_page_views'
] as const

export type MetaAdDeliveryMetricName =
  (typeof metaAdDeliveryMetricNames)[number]

export type MetaAdDeliveryMetricAvailability = Record<
  MetaAdDeliveryMetricName,
  'available' | 'unavailable'
>

export type MetaAdDeliveryInsight = {
  accountId: string
  accountTimezone: string
  actionReportTime: 'impression'
  adId: string
  adName?: string
  adsetId: string
  adsetName?: string
  apiVersion: 'v25.0'
  attributionSetting: 'account'
  breakdownKind: MetaAdDeliveryBreakdownKind
  campaignId: string
  campaignName?: string
  clicks: number | null
  devicePlatform?: string
  dimensionKey: string
  impressionDevice?: string
  impressions: number | null
  insightDate: string
  landingPageViews: number | null
  linkClicks: number | null
  metricAvailability: MetaAdDeliveryMetricAvailability
  outboundClicks: number | null
  platformPosition?: string
  publisherPlatform?: string
}
