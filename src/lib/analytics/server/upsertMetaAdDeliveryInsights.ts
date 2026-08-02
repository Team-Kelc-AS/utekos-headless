import 'server-only'

import postgres from 'postgres'
import type { MetaAdDeliveryInsight } from './metaAdDeliveryInsight'

let trackingSql: ReturnType<typeof postgres> | undefined

function getTrackingSql() {
  const connectionString =
    process.env.SUPABASE_VERCEL_POSTGRES_URL_NON_POOLING

  if (!connectionString) {
    throw new Error('Missing tracking database connection string')
  }

  trackingSql ??= postgres(connectionString, {
    connect_timeout: 10,
    idle_timeout: 20,
    max: 1,
    max_lifetime: 60 * 30,
    prepare: false
  })

  return trackingSql
}

export type MetaAdDeliveryInsightsUpsertInput = {
  fetchedAt: Date
  insights: MetaAdDeliveryInsight[]
}

export async function upsertMetaAdDeliveryInsights(
  input: MetaAdDeliveryInsightsUpsertInput
) {
  if (input.insights.length === 0) return 0

  return getTrackingSql().begin(async sql => {
    let upsertedCount = 0

    for (const insight of input.insights) {
      const upserted = await sql`
        insert into marketing.meta_ad_delivery_insights (
          account_id,
          account_timezone,
          api_version,
          action_report_time,
          attribution_setting,
          campaign_id,
          campaign_name,
          adset_id,
          adset_name,
          ad_id,
          ad_name,
          insight_date,
          breakdown_kind,
          dimension_key,
          publisher_platform,
          platform_position,
          device_platform,
          impression_device,
          impressions,
          clicks,
          link_clicks,
          outbound_clicks,
          landing_page_views,
          metric_availability,
          fetched_at,
          updated_at
        ) values (
          ${insight.accountId},
          ${insight.accountTimezone},
          ${insight.apiVersion},
          ${insight.actionReportTime},
          ${insight.attributionSetting},
          ${insight.campaignId},
          ${insight.campaignName ?? null},
          ${insight.adsetId},
          ${insight.adsetName ?? null},
          ${insight.adId},
          ${insight.adName ?? null},
          ${insight.insightDate},
          ${insight.breakdownKind},
          ${insight.dimensionKey},
          ${insight.publisherPlatform ?? null},
          ${insight.platformPosition ?? null},
          ${insight.devicePlatform ?? null},
          ${insight.impressionDevice ?? null},
          ${insight.impressions},
          ${insight.clicks},
          ${insight.linkClicks},
          ${insight.outboundClicks},
          ${insight.landingPageViews},
          ${sql.json(insight.metricAvailability)},
          ${input.fetchedAt},
          ${input.fetchedAt}
        )
        on conflict (
          account_id,
          ad_id,
          insight_date,
          breakdown_kind,
          dimension_key
        ) do update set
          account_timezone = excluded.account_timezone,
          api_version = excluded.api_version,
          action_report_time = excluded.action_report_time,
          attribution_setting = excluded.attribution_setting,
          campaign_id = excluded.campaign_id,
          campaign_name = excluded.campaign_name,
          adset_id = excluded.adset_id,
          adset_name = excluded.adset_name,
          ad_name = excluded.ad_name,
          publisher_platform = excluded.publisher_platform,
          platform_position = excluded.platform_position,
          device_platform = excluded.device_platform,
          impression_device = excluded.impression_device,
          impressions = excluded.impressions,
          clicks = excluded.clicks,
          link_clicks = excluded.link_clicks,
          outbound_clicks = excluded.outbound_clicks,
          landing_page_views = excluded.landing_page_views,
          metric_availability = excluded.metric_availability,
          fetched_at = excluded.fetched_at,
          updated_at = excluded.updated_at
        returning id
      `

      upsertedCount += upserted.length
    }

    return upsertedCount
  })
}
