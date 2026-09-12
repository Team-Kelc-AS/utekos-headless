export const metaInsightsDocs = {
  insights:
    'https://developers.facebook.com/documentation/ads-commerce/marketing-api/insights',
  breakdowns:
    'https://developers.facebook.com/documentation/ads-commerce/marketing-api/insights/breakdowns',
  bestPractices:
    'https://developers.facebook.com/documentation/ads-commerce/marketing-api/insights/best-practices',
  adAccountInsights:
    'https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ad-account/insights',
  campaignInsights:
    'https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ad-campaign-group/insights',
  advantageAudience:
    'https://developers.facebook.com/documentation/ads-commerce/marketing-api/audiences/reference/targeting-expansion/advantage-audience',
  customAudiences:
    'https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ad-account/customaudiences',
  customAudienceAds:
    'https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/custom-audience/ads',
  reachestimate:
    'https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ad-account/reachestimate',
  fieldExpansion:
    'https://developers.facebook.com/docs/graph-api/guides/field-expansion',
  batch:
    'https://developers.facebook.com/docs/graph-api/batch-requests/',
  marketingBatch:
    'https://developers.facebook.com/documentation/ads-commerce/marketing-api/asyncrequests',
  valueRules:
    'https://developers.facebook.com/documentation/ads-commerce/marketing-api/bidding/value-rules',
  valueRulesBreakdown:
    'https://www.facebook.com/business/help/1643671879847552',
  changelog:
    'https://developers.facebook.com/docs/graph-api/changelog/',
  changelogV26:
    'https://developers.facebook.com/docs/graph-api/changelog/version26.0/',
  marketingChangelog:
    'https://developers.facebook.com/documentation/ads-commerce/marketing-api/marketing-api-changelog',
  featureSettings:
    'https://developers.facebook.com/documentation/ads-commerce/marketing-api/insights/feature-settings'
} as const

export const metaInsightsType1Breakdowns = [
  'region',
  'dma',
  'hourly_stats_aggregated_by_advertiser_time_zone',
  'hourly_stats_aggregated_by_audience_time_zone'
] as const

export const metaInsightsType2Breakdowns = [
  'action_device',
  'action_destination',
  'action_target_id',
  'product_id',
  'action_carousel_card_id',
  'action_carousel_card_name',
  'action_canvas_component_name'
] as const

export const metaInsightsOfficialCombinations = [
  ['age'],
  ['gender'],
  ['age', 'gender'],
  ['country'],
  ['region'],
  ['publisher_platform'],
  ['publisher_platform', 'impression_device'],
  ['publisher_platform', 'platform_position'],
  ['publisher_platform', 'platform_position', 'impression_device'],
  ['product_id'],
  ['hourly_stats_aggregated_by_advertiser_time_zone'],
  ['hourly_stats_aggregated_by_audience_time_zone'],
  ['device_platform']
] as const

export type MetaInsightsBreakdownSlice = {
  id: string
  breakdowns: readonly string[]
  pack: 'conversion' | 'delivery'
  cadence: 'live' | 'deferred'
  level?: 'adset' | 'ad'
  why: string
}

export const metaInsightsBreakdownSlices: readonly MetaInsightsBreakdownSlice[] =
  [
    {
      id: 'totals',
      breakdowns: [],
      pack: 'conversion',
      cadence: 'live',
      why: 'Ad set totals for spend, funnel actions and ROAS. No breakdown. date_preset=today.'
    },
    {
      id: 'value_rules',
      breakdowns: ['rule_set_id', 'rule_set_name'],
      pack: 'conversion',
      cadence: 'live',
      why: 'Value-rule attribution. Official help documents these as Insights breakdowns, not fields. Not in the generic combining table; verified on this account as a pair, never mixed with age or region.'
    },
    {
      id: 'age',
      breakdowns: ['age'],
      pack: 'conversion',
      cadence: 'live',
      why: 'Official permutation. Off-Meta ATC/Purchase are returned.'
    },
    {
      id: 'gender',
      breakdowns: ['gender'],
      pack: 'conversion',
      cadence: 'live',
      why: 'Official permutation. Off-Meta ATC/Purchase are returned.'
    },
    {
      id: 'age_gender',
      breakdowns: ['age', 'gender'],
      pack: 'conversion',
      cadence: 'live',
      why: 'Official permutation. Joint age×gender for value-rule diagnosis.'
    },
    {
      id: 'publisher_platform',
      breakdowns: ['publisher_platform'],
      pack: 'conversion',
      cadence: 'live',
      why: 'Official permutation. Facebook / Instagram / Audience Network mix with conversions.'
    },
    {
      id: 'region',
      breakdowns: ['region'],
      pack: 'delivery',
      cadence: 'live',
      why: 'Type 1. Official permutation. Spend/impressions/clicks/CPM only — off-Meta actions are omitted.'
    },
    {
      id: 'hourly_advertiser',
      breakdowns: [
        'hourly_stats_aggregated_by_advertiser_time_zone'
      ],
      pack: 'delivery',
      cadence: 'live',
      why: 'Type 1. Account timezone (PDT) pacing. Reach/frequency return 0 with hourly; unique_* and video_* are invalid here.'
    },
    {
      id: 'platform_position',
      breakdowns: ['publisher_platform', 'platform_position'],
      pack: 'delivery',
      cadence: 'live',
      why: 'Official permutation. Delivery pack only — conversion fields plus implicit action_type have failed on this account.'
    },
    {
      id: 'ads_platform_position',
      breakdowns: ['publisher_platform', 'platform_position'],
      pack: 'delivery',
      cadence: 'live',
      level: 'ad',
      why: 'Official permutation at level=ad. Spend and clicks per ad × placement. Delivery pack only — same conversion-pack failure as the ad-set slice. Catalog ads report per ad + creative id, not Dynamic Creative asset ids.'
    },
    {
      id: 'device_platform',
      breakdowns: ['device_platform'],
      pack: 'conversion',
      cadence: 'deferred',
      why: 'Generic breakdown used by the warehouse delivery cron. Not required every 15 minutes.'
    },
    {
      id: 'product_id',
      breakdowns: ['product_id'],
      pack: 'conversion',
      cadence: 'deferred',
      why: 'Type 2 catalog SKU. High cardinality. Off-Meta web actions return without the SKU. Use async if the row count is large.'
    },
    {
      id: 'impression_device',
      breakdowns: ['publisher_platform', 'impression_device'],
      pack: 'delivery',
      cadence: 'deferred',
      why: 'Official permutation. Feature Settings GET on this account already shows impression_device enabled. Still deferred so the 15-minute tick stays lean; promoting it requires a separate OK.'
    },
    {
      id: 'hourly_audience',
      breakdowns: [
        'hourly_stats_aggregated_by_audience_time_zone'
      ],
      pack: 'delivery',
      cadence: 'deferred',
      why: 'Type 1. Audience-local hour. Feature Settings GET on this account already shows time_of_day_viewer_tz enabled. Still deferred; promoting it requires a separate OK.'
    },
    {
      id: 'country',
      breakdowns: ['country'],
      pack: 'conversion',
      cadence: 'deferred',
      why: 'Official permutation. Utekos delivers only NO, so live ticks skip it.'
    },
    {
      id: 'ad_creative',
      breakdowns: [],
      pack: 'conversion',
      cadence: 'deferred',
      why: 'Same conversion fields at level=ad. The live plan now fills leftover Graph batch slots with this slice per watched ad set.'
    }
  ]

export const metaInsightsForbiddenQueries = [
  {
    breakdowns: ['age', 'region'],
    reason:
      'Not an official combining-breakdowns permutation. Graph returns error 100.'
  },
  {
    breakdowns: ['platform_position'],
    reason:
      'platform_position is only listed together with publisher_platform.'
  },
  {
    breakdowns: ['mmm'],
    reason:
      'Marketing mix modeling is async CSV only and cannot combine with other breakdowns.'
  }
] as const

export function metaInsightsSliceUsesType1(
  breakdowns: readonly string[]
) {
  return breakdowns.some(breakdown =>
    (metaInsightsType1Breakdowns as readonly string[]).includes(
      breakdown
    )
  )
}
