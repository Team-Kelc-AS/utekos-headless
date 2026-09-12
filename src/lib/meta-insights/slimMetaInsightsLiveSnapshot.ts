import type { MetaInsightsLiveSnapshot } from './buildMetaInsightsLiveSnapshot'
import { slimMetaDatasetQuality } from './slimMetaDatasetQuality'
import { requiredMetaDatasetQualityEvents } from '../analytics/metaDatasetQualityRequiredEvents'

function firstRow<T>(rows: T[]) {
  return rows[0]
}

function pickCounts(
  counts: Record<string, number>,
  names: readonly string[]
) {
  return Object.fromEntries(
    names.map(name => [name, counts[name] ?? 0])
  )
}

export function slimMetaInsightsLiveSnapshot(
  snapshot: MetaInsightsLiveSnapshot
) {
  const slimAdSets = Object.fromEntries(
    Object.entries(snapshot.adSets).map(([key, value]) => {
      const totals = firstRow(value.insights.totals)
      return [
        key,
        {
          adSetId: value.adSet.id,
          campaignId: value.campaign.id,
          campaignStatus: value.campaign.effective_status,
          adSetStatus: value.adSet.effective_status,
          optimizationGoal: value.adSet.optimization_goal,
          customEventType:
            value.adSet.promoted_object?.custom_event_type ??
            null,
          learning: value.adSet.learning_stage_info ?? null,
          issues: value.adSet.issues_info ?? null,
          ads: value.ads.map(ad => {
            const row = value.insights.ads.find(
              insight => insight.adId === ad.id
            )
            const creative = ad.creative
            return {
              id: ad.id,
              name: ad.name,
              status: ad.status,
              effectiveStatus: ad.effective_status,
              issues: ad.issues_info ?? null,
              creativeId: creative?.id ?? null,
              creativeName: creative?.name ?? null,
              creativeTitle: creative?.title ?? null,
              creativeBody: creative?.body ?? null,
              spend: row?.spend ?? null,
              impressions: row?.impressions ?? null,
              clicks: row?.clicks ?? null,
              landingPageViews: row?.landingPageViews ?? null,
              addToCart: row?.addToCart ?? null,
              initiateCheckout: row?.initiateCheckout ?? null,
              purchase: row?.purchase ?? null,
              placements: [...value.insights.adsPlatformPosition]
                .filter(insight => insight.adId === ad.id)
                .sort((left, right) => right.spend - left.spend)
                .map(insight => ({
                  platform: insight.publisherPlatform ?? null,
                  position: insight.platformPosition ?? null,
                  spend: insight.spend,
                  impressions: insight.impressions,
                  clicks: insight.clicks,
                  cpm: insight.cpm
                }))
            }
          }),
          adPlacements: [...value.insights.adsPlatformPosition]
            .sort((left, right) => right.spend - left.spend)
            .map(row => ({
              adId: row.adId ?? null,
              adName: row.adName ?? null,
              platform: row.publisherPlatform ?? null,
              position: row.platformPosition ?? null,
              spend: row.spend,
              impressions: row.impressions,
              clicks: row.clicks,
              cpm: row.cpm
            })),
          targeting:
            value.targeting ?
              {
                advantageAudience:
                  value.targeting.advantageAudience,
                ageMin: value.targeting.ageMin,
                ageMax: value.targeting.ageMax,
                ageRange: value.targeting.ageRange,
                countries: value.targeting.countries,
                targetingOptimization:
                  value.targeting.targetingOptimization,
                ageSuggestion: value.targeting.ageSuggestion,
                genderSuggestion:
                  value.targeting.genderSuggestion,
                relaxLookalike: value.targeting.relaxLookalike,
                relaxCustomAudience:
                  value.targeting.relaxCustomAudience,
                customAudiences: value.targeting.customAudiences,
                excludedCustomAudiences:
                  value.targeting.excludedCustomAudiences
              }
            : null,
          advantageState:
            value.campaign.advantage_state_info ?? null,
          sentences: value.sentences,
          reachEstimate: snapshot.reachEstimates[key] ?? null,
          spend: totals?.spend ?? 0,
          impressions: totals?.impressions ?? 0,
          clicks: totals?.clicks ?? 0,
          cpm: totals?.cpm ?? null,
          cpc: totals?.cpc ?? null,
          frequency: totals?.frequency ?? null,
          qualityRanking: totals?.qualityRanking ?? null,
          purchaseRoas: totals?.purchaseRoas ?? null,
          outboundClicks: totals?.outboundClicks ?? null,
          landingPageViews: totals?.landingPageViews ?? 0,
          uniqueClicks: totals?.uniqueClicks ?? null,
          uniqueInlineLinkClicks:
            totals?.uniqueInlineLinkClicks ?? null,
          landingPageViewPerLinkClick:
            totals?.landingPageViewPerLinkClick ?? null,
          costPerInlineLinkClick:
            totals?.costPerInlineLinkClick ?? null,
          addToCart: totals?.addToCart ?? 0,
          initiateCheckout: totals?.initiateCheckout ?? 0,
          purchase: totals?.purchase ?? 0,
          rules: value.insights.valueRules.map(row => ({
            id: row.ruleSetId ?? '-1',
            name: row.ruleSetName ?? 'Uncategorized',
            spend: row.spend,
            impressions: row.impressions,
            clicks: row.clicks,
            landingPageViews: row.landingPageViews,
            addToCart: row.addToCart,
            purchase: row.purchase,
            cpm: row.cpm
          })),
          hourly: value.insights.hourlyAdvertiser.map(row => ({
            hour: row.hour ?? null,
            spend: row.spend,
            impressions: row.impressions,
            clicks: row.clicks,
            cpm: row.cpm,
            landingPageViews: row.landingPageViews,
            addToCart: row.addToCart,
            purchase: row.purchase
          })),
          age: value.insights.age.map(row => ({
            age: row.age ?? null,
            spend: row.spend,
            clicks: row.clicks,
            cpm: row.cpm,
            landingPageViews: row.landingPageViews,
            addToCart: row.addToCart,
            purchase: row.purchase
          })),
          gender: value.insights.gender.map(row => ({
            gender: row.gender ?? null,
            spend: row.spend,
            clicks: row.clicks,
            cpm: row.cpm,
            landingPageViews: row.landingPageViews,
            addToCart: row.addToCart,
            purchase: row.purchase
          })),
          ageGender: value.insights.ageGender.map(row => ({
            age: row.age ?? null,
            gender: row.gender ?? null,
            spend: row.spend,
            clicks: row.clicks,
            impressions: row.impressions,
            landingPageViews: row.landingPageViews,
            addToCart: row.addToCart,
            purchase: row.purchase
          })),
          region: [...value.insights.region]
            .sort((left, right) => right.spend - left.spend)
            .map(row => ({
              region: row.region ?? null,
              spend: row.spend,
              impressions: row.impressions,
              clicks: row.clicks,
              cpm: row.cpm
            })),
          publisherPlatform: value.insights.publisherPlatform.map(
            row => ({
              platform: row.publisherPlatform ?? null,
              spend: row.spend,
              clicks: row.clicks,
              cpm: row.cpm,
              landingPageViews: row.landingPageViews,
              addToCart: row.addToCart,
              purchase: row.purchase
            })
          ),
          placements: [...value.insights.platformPosition]
            .sort((left, right) => right.spend - left.spend)
            .map(row => ({
              platform: row.publisherPlatform ?? null,
              position: row.platformPosition ?? null,
              spend: row.spend,
              impressions: row.impressions,
              clicks: row.clicks,
              cpm: row.cpm
            }))
        }
      ]
    })
  )

  return {
    fetchedAtOslo: snapshot.fetchedAtOslo,
    fetchedAtUtc: snapshot.fetchedAtUtc,
    apiVersion: snapshot.apiVersion,
    datePreset: snapshot.datePreset,
    accountId: snapshot.account.id,
    timezone: snapshot.account.timezone_name,
    opportunityScore: snapshot.account.opportunity_score ?? null,
    throttle: snapshot.throttle,
    quality: slimMetaDatasetQuality(snapshot.quality),
    pixelStats: {
      m15: pickCounts(
        snapshot.pixelStats.m15,
        requiredMetaDatasetQualityEvents
      ),
      h1: pickCounts(
        snapshot.pixelStats.h1,
        requiredMetaDatasetQualityEvents
      ),
      h1Web: pickCounts(
        snapshot.pixelStats.h1Web,
        requiredMetaDatasetQualityEvents
      ),
      h1Server: pickCounts(
        snapshot.pixelStats.h1Server,
        requiredMetaDatasetQualityEvents
      ),
      h24: pickCounts(
        snapshot.pixelStats.h24,
        requiredMetaDatasetQualityEvents
      )
    },
    recommendationCount: snapshot.recommendations.length,
    customConversionCount: snapshot.customConversions.length,
    followUpErrors: snapshot.followUpErrors,
    audiences: Object.fromEntries(
      Object.entries(snapshot.audiences).map(
        ([id, audience]) => [
          id,
          {
            name: audience.name,
            subtype: audience.subtype,
            approximateCountLower:
              audience.approximateCountLower,
            approximateCountUpper:
              audience.approximateCountUpper,
            deliveryCode: audience.deliveryStatus?.code ?? null,
            operationCode: audience.operationStatus?.code ?? null
          }
        ]
      )
    ),
    adSets: slimAdSets
  }
}
