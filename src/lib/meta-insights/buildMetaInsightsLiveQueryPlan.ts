import { buildMetaInsightsPixelStatWindows } from './buildMetaInsightsPixelStatWindows'
import {
  metaInsightsBreakdownSlices,
  metaInsightsForbiddenQueries,
  metaInsightsSliceUsesType1
} from './metaInsightsBreakdownCatalog'
import { metaInsightsFieldPacks } from './metaInsightsFieldPacks'
import type { MetaInsightsLiveWatch } from './metaInsightsLiveWatch'
import type { MetaInsightsQuery } from './metaInsightsQuery'

function sameBreakdowns(
  left: readonly string[],
  right: readonly string[]
) {
  return (
    left.length === right.length &&
    left.every((value, index) => value === right[index])
  )
}

function assertQueryAllowed(query: MetaInsightsQuery) {
  const breakdowns = query.breakdowns ?? []
  const forbidden = metaInsightsForbiddenQueries.find(item =>
    sameBreakdowns(item.breakdowns, breakdowns)
  )
  if (forbidden) {
    throw new Error(forbidden.reason)
  }
  if (
    metaInsightsSliceUsesType1(breakdowns) &&
    query.pack !== 'delivery'
  ) {
    throw new Error(
      'Type 1 breakdowns must use the delivery field pack'
    )
  }
}

export function buildMetaInsightsLiveQueryPlan(
  watch: MetaInsightsLiveWatch,
  fetchedAt: Date = new Date()
): MetaInsightsQuery[] {
  const liveSlices = metaInsightsBreakdownSlices.filter(
    slice => slice.cadence === 'live'
  )
  const accountId = `act_${watch.accountId.replace(/^act_/, '')}`
  const queries: MetaInsightsQuery[] = [
    {
      name: 'account',
      objectId: accountId,
      edge: 'self',
      fields: metaInsightsFieldPacks.account,
      pack: 'account'
    },
    {
      name: 'recommendations',
      objectId: accountId,
      edge: 'recommendations',
      fields: metaInsightsFieldPacks.recommendations,
      pack: 'recommendations'
    },
    {
      name: 'customconversions',
      objectId: accountId,
      edge: 'customconversions',
      fields: metaInsightsFieldPacks.customconversions,
      pack: 'customconversions'
    }
  ]

  for (const window of buildMetaInsightsPixelStatWindows(fetchedAt)) {
    queries.push({
      name: `stats:${window.id}`,
      objectId: watch.pixelId,
      edge: 'stats',
      fields: '',
      pack: 'account',
      aggregation: window.aggregation,
      startTime: window.startTime,
      endTime: window.endTime,
      ...(window.eventSource ? { eventSource: window.eventSource } : {})
    })
  }

  for (const adSet of watch.adSets) {
    queries.push(
      {
        name: `campaign:${adSet.key}`,
        objectId: adSet.campaignId,
        edge: 'self',
        fields: metaInsightsFieldPacks.campaign,
        pack: 'campaign'
      },
      {
        name: `adset:${adSet.key}`,
        objectId: adSet.adSetId,
        edge: 'self',
        fields: metaInsightsFieldPacks.adSet,
        pack: 'adSet'
      },
      {
        name: `ads:${adSet.key}`,
        objectId: adSet.campaignId,
        edge: 'ads',
        fields: metaInsightsFieldPacks.ads,
        pack: 'ads'
      },
      {
        name: `sentences:${adSet.key}`,
        objectId: adSet.adSetId,
        edge: 'targetingsentencelines',
        fields: '',
        pack: 'adSet'
      }
    )

    for (const slice of liveSlices) {
      const query: MetaInsightsQuery = {
        name: `insights:${adSet.key}:${slice.id}`,
        objectId: adSet.adSetId,
        edge: 'insights',
        fields:
          slice.id === 'totals'
            ? metaInsightsFieldPacks.conversionTotals
            : metaInsightsFieldPacks[slice.pack],
        pack: slice.pack,
        datePreset: 'today',
        level: 'adset',
        ...(slice.breakdowns.length > 0
          ? { breakdowns: slice.breakdowns }
          : {})
      }
      assertQueryAllowed(query)
      queries.push(query)
    }
  }

  for (const adSet of watch.adSets) {
    queries.push({
      name: `insights:${adSet.key}:ads`,
      objectId: adSet.adSetId,
      edge: 'insights',
      fields: metaInsightsFieldPacks.conversionTotals,
      pack: 'conversion',
      datePreset: 'today',
      level: 'ad'
    })
  }

  return queries
}
