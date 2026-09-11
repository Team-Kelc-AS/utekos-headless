import type { MetaDatasetQualityResponse } from '../analytics/server/metaDatasetQualitySchema'
import type { MetaInsightsBatchItem } from './fetchMetaInsightsGraphBatch'
import { formatOsloTimestamp } from './formatOsloTimestamp'
import { metaInsightsApiVersion } from './metaInsightsApiVersion'
import {
  metaInsightsAdSchema,
  metaInsightsEdgeSchema,
  metaInsightsEntitySchema,
  metaInsightsErrorBodySchema,
  metaInsightsRowSchema
} from './metaInsightsLiveSnapshotSchema'
import type { MetaInsightsLiveWatch } from './metaInsightsLiveWatch'
import { parseMetaInsightsCustomAudience } from './parseMetaInsightsCustomAudience'
import { parseMetaInsightsReachEstimate } from './parseMetaInsightsReachEstimate'
import { parseMetaInsightsSentenceLines } from './parseMetaInsightsSentenceLines'
import { parseMetaInsightsTargeting } from './parseMetaInsightsTargeting'
import { pickMetaInsightsFunnel } from './pickMetaInsightsFunnel'
import { readMetaInsightsOptionalItem } from './readMetaInsightsOptionalItem'
import { summarizeMetaInsightsActions } from './summarizeMetaInsightsActions'
import { summarizeMetaInsightsPixelStats } from './summarizeMetaInsightsPixelStats'

function requireItem(
  items: readonly MetaInsightsBatchItem[],
  name: string
) {
  const item = items.find(candidate => candidate.name === name)
  if (!item)
    throw new Error(`Meta Insights batch omitted ${name}`)
  const error = metaInsightsErrorBodySchema.safeParse(item.body)
  if (item.code >= 400 || error.success) {
    const code =
      error.success ? error.data.error.code : item.code
    throw new Error(
      `Meta Insights item ${name} failed (${code})`
    )
  }
  return item.body
}

function parseNumber(value: string | undefined) {
  if (value === undefined) return 0
  const parsed = Number(value)
  if (!Number.isFinite(parsed) || parsed < 0) {
    throw new Error('Meta returned an invalid delivery metric')
  }
  return parsed
}

function parseEdge(body: unknown) {
  if (Array.isArray(body)) return { data: body }
  return metaInsightsEdgeSchema.parse(body)
}

function sumActionValues(
  rows:
    | ReadonlyArray<{ action_type: string; value: string }>
    | undefined,
  actionType?: string
) {
  if (rows === undefined) return null
  const matched =
    actionType ?
      rows.filter(row => row.action_type === actionType)
    : rows
  return matched.reduce(
    (sum, row) => sum + parseNumber(row.value),
    0
  )
}

function firstActionValue(
  rows:
    | ReadonlyArray<{ action_type: string; value: string }>
    | undefined
) {
  if (rows === undefined) return null
  const first = rows[0]
  return first === undefined ? null : parseNumber(first.value)
}

function parseInsightRows(body: unknown) {
  return parseEdge(body).data.map(row => {
    const parsed = metaInsightsRowSchema.parse(row)
    const actions = summarizeMetaInsightsActions(parsed.actions)
    const funnel = pickMetaInsightsFunnel(actions)
    return {
      spend: parseNumber(parsed.spend),
      impressions: parseNumber(parsed.impressions),
      clicks: parseNumber(parsed.clicks),
      cpm:
        parsed.cpm === undefined ?
          null
        : parseNumber(parsed.cpm),
      cpc:
        parsed.cpc === undefined ?
          null
        : parseNumber(parsed.cpc),
      cpp:
        parsed.cpp === undefined ?
          null
        : parseNumber(parsed.cpp),
      ctr:
        parsed.ctr === undefined ?
          null
        : parseNumber(parsed.ctr),
      reach:
        parsed.reach === undefined ?
          null
        : parseNumber(parsed.reach),
      frequency:
        parsed.frequency === undefined ?
          null
        : parseNumber(parsed.frequency),
      inlineLinkClicks:
        parsed.inline_link_clicks === undefined ?
          null
        : parseNumber(parsed.inline_link_clicks),
      outboundClicks: sumActionValues(parsed.outbound_clicks),
      websiteCtr: firstActionValue(parsed.website_ctr),
      purchaseRoas: firstActionValue(parsed.purchase_roas),
      websitePurchaseRoas: firstActionValue(
        parsed.website_purchase_roas
      ),
      conversions: sumActionValues(parsed.conversions),
      videoPlays: sumActionValues(parsed.video_play_actions),
      qualityRanking: parsed.quality_ranking,
      engagementRateRanking: parsed.engagement_rate_ranking,
      conversionRateRanking: parsed.conversion_rate_ranking,
      attributionSetting: parsed.attribution_setting ?? null,
      objective: parsed.objective ?? null,
      results: parsed.results ?? null,
      adId: parsed.ad_id,
      adName: parsed.ad_name,
      costPerInlineLinkClick:
        parsed.cost_per_inline_link_click === undefined ?
          null
        : parseNumber(parsed.cost_per_inline_link_click),
      landingPageViewPerLinkClick:
        parsed.landing_page_view_per_link_click === undefined ?
          null
        : parseNumber(parsed.landing_page_view_per_link_click),
      inlinePostEngagement:
        parsed.inline_post_engagement === undefined ?
          null
        : parseNumber(parsed.inline_post_engagement),
      wishBid:
        parsed.wish_bid === undefined ?
          null
        : parseNumber(parsed.wish_bid),
      uniqueClicks:
        parsed.unique_clicks === undefined ?
          null
        : parseNumber(parsed.unique_clicks),
      uniqueInlineLinkClicks:
        parsed.unique_inline_link_clicks === undefined ?
          null
        : parseNumber(parsed.unique_inline_link_clicks),
      costPerUniqueClick:
        parsed.cost_per_unique_click === undefined ?
          null
        : parseNumber(parsed.cost_per_unique_click),
      dateStart: parsed.date_start,
      dateStop: parsed.date_stop,
      age: parsed.age,
      gender: parsed.gender,
      region: parsed.region,
      publisherPlatform: parsed.publisher_platform,
      platformPosition: parsed.platform_position,
      ruleSetId:
        parsed.rule_set_id === undefined ?
          undefined
        : String(parsed.rule_set_id),
      ruleSetName: parsed.rule_set_name,
      hour: parsed.hourly_stats_aggregated_by_advertiser_time_zone,
      actions,
      actionValues: summarizeMetaInsightsActions(
        parsed.action_values
      ),
      costPerActionType: summarizeMetaInsightsActions(
        parsed.cost_per_action_type
      ),
      ...funnel
    }
  })
}

export function buildMetaInsightsLiveSnapshot(input: {
  fetchedAt: Date
  quality: MetaDatasetQualityResponse
  throttle: string | null
  watch: MetaInsightsLiveWatch
  items: readonly MetaInsightsBatchItem[]
}) {
  const optionalItemErrors: string[] = []
  const account = metaInsightsEntitySchema.parse(
    requireItem(input.items, 'account')
  )

  const adSets = Object.fromEntries(
    input.watch.adSets.map(adSet => {
      const adsRead = readMetaInsightsOptionalItem(
        input.items,
        `ads:${adSet.key}`
      )
      if (!adsRead.ok) optionalItemErrors.push(adsRead.error)
      const ads =
        adsRead.ok ?
          parseEdge(adsRead.body).data.map(row =>
            metaInsightsAdSchema.parse(row)
          )
        : []
      const adSetEntity = metaInsightsEntitySchema.parse(
        requireItem(input.items, `adset:${adSet.key}`)
      )
      const adInsightsItem = input.items.find(
        item => item.name === `insights:${adSet.key}:ads`
      )
      const adInsightsRead =
        adInsightsItem ?
          readMetaInsightsOptionalItem(
            input.items,
            adInsightsItem.name
          )
        : null
      if (adInsightsRead && !adInsightsRead.ok) {
        optionalItemErrors.push(adInsightsRead.error)
      }
      const sentencesRead = readMetaInsightsOptionalItem(
        input.items,
        `sentences:${adSet.key}`
      )
      if (!sentencesRead.ok) {
        optionalItemErrors.push(sentencesRead.error)
      }

      return [
        adSet.key,
        {
          campaign: metaInsightsEntitySchema.parse(
            requireItem(input.items, `campaign:${adSet.key}`)
          ),
          adSet: adSetEntity,
          targeting: parseMetaInsightsTargeting(
            adSetEntity.targeting
          ),
          sentences:
            sentencesRead.ok ?
              parseMetaInsightsSentenceLines(sentencesRead.body)
            : [],
          ads,
          insights: {
            totals: parseInsightRows(
              requireItem(
                input.items,
                `insights:${adSet.key}:totals`
              )
            ),
            valueRules: parseInsightRows(
              requireItem(
                input.items,
                `insights:${adSet.key}:value_rules`
              )
            ),
            age: parseInsightRows(
              requireItem(
                input.items,
                `insights:${adSet.key}:age`
              )
            ),
            gender: parseInsightRows(
              requireItem(
                input.items,
                `insights:${adSet.key}:gender`
              )
            ),
            ageGender: parseInsightRows(
              requireItem(
                input.items,
                `insights:${adSet.key}:age_gender`
              )
            ),
            publisherPlatform: parseInsightRows(
              requireItem(
                input.items,
                `insights:${adSet.key}:publisher_platform`
              )
            ),
            region: parseInsightRows(
              requireItem(
                input.items,
                `insights:${adSet.key}:region`
              )
            ),
            hourlyAdvertiser: parseInsightRows(
              requireItem(
                input.items,
                `insights:${adSet.key}:hourly_advertiser`
              )
            ),
            platformPosition: parseInsightRows(
              requireItem(
                input.items,
                `insights:${adSet.key}:platform_position`
              )
            ),
            ads:
              adInsightsRead?.ok ?
                parseInsightRows(adInsightsRead.body)
              : []
          }
        }
      ]
    })
  )

  const recommendationsRead = readMetaInsightsOptionalItem(
    input.items,
    'recommendations'
  )
  if (!recommendationsRead.ok) {
    optionalItemErrors.push(recommendationsRead.error)
  }
  const recommendations =
    recommendationsRead.ok ?
      parseEdge(recommendationsRead.body).data
    : []
  const customConversionsRead = readMetaInsightsOptionalItem(
    input.items,
    'customconversions'
  )
  if (!customConversionsRead.ok) {
    optionalItemErrors.push(customConversionsRead.error)
  }
  const customConversions =
    customConversionsRead.ok ?
      parseEdge(customConversionsRead.body).data
    : []

  const pixelStats = {
    m15: summarizeMetaInsightsPixelStats(
      requireItem(input.items, 'stats:m15')
    ),
    h1: summarizeMetaInsightsPixelStats(
      requireItem(input.items, 'stats:h1')
    ),
    h1Web: summarizeMetaInsightsPixelStats(
      requireItem(input.items, 'stats:h1_web')
    ),
    h1Server: summarizeMetaInsightsPixelStats(
      requireItem(input.items, 'stats:h1_server')
    ),
    h24: summarizeMetaInsightsPixelStats(
      requireItem(input.items, 'stats:h24')
    )
  }

  return {
    apiVersion: metaInsightsApiVersion,
    datePreset: 'today' as const,
    fetchedAtUtc: input.fetchedAt.toISOString(),
    fetchedAtOslo: formatOsloTimestamp(input.fetchedAt),
    throttle: input.throttle,
    account,
    quality: input.quality,
    pixelStats,
    recommendations,
    customConversions,
    audiences: {} as Record<
      string,
      ReturnType<typeof parseMetaInsightsCustomAudience>
    >,
    reachEstimates: {} as Record<
      string,
      ReturnType<typeof parseMetaInsightsReachEstimate>
    >,
    followUpErrors: optionalItemErrors,
    adSets
  }
}

export type MetaInsightsLiveSnapshot = ReturnType<
  typeof buildMetaInsightsLiveSnapshot
>
