import { fetchMetaAdAccountTimezone } from './fetchMetaAdAccountTimezone'
import { fetchMetaAdDeliveryInsights } from './fetchMetaAdDeliveryInsights'
import { getMetaAdDeliveryDateWindow } from './getMetaAdDeliveryDateWindow'
import {
  metaAdDeliveryBreakdownKinds,
  metaAdDeliveryMetricNames,
  type MetaAdDeliveryBreakdownKind,
  type MetaAdDeliveryInsight,
  type MetaAdDeliveryMetricName
} from './metaAdDeliveryInsight'
import {
  readMetaAdDeliveryInsightsConfig,
  type MetaAdDeliveryInsightsConfig
} from './metaAdDeliveryInsightsConfig'
import {
  upsertMetaAdDeliveryInsights,
  type MetaAdDeliveryInsightsUpsertInput
} from './upsertMetaAdDeliveryInsights'

export type MetaAdDeliveryInsightsSyncResult = {
  accountId: string
  accountTimezone: string
  fetchedAt: string
  rowCount: number
  rowsByBreakdown: Record<MetaAdDeliveryBreakdownKind, number>
  since: string
  unavailableMetrics: Record<MetaAdDeliveryMetricName, number>
  until: string
  upsertedCount: number
}

export type MetaAdDeliveryInsightsSyncDependencies = {
  fetchAccountTimezone: (
    config: MetaAdDeliveryInsightsConfig
  ) => Promise<string>
  fetchInsights: (
    config: MetaAdDeliveryInsightsConfig,
    input: {
      accountTimezone: string
      breakdownKind: MetaAdDeliveryBreakdownKind
      dateWindow: { since: string; until: string }
    }
  ) => Promise<MetaAdDeliveryInsight[]>
  getConfig: () => MetaAdDeliveryInsightsConfig
  getNow: () => Date
  upsertInsights: (
    input: MetaAdDeliveryInsightsUpsertInput
  ) => Promise<number>
}

const defaultDependencies: MetaAdDeliveryInsightsSyncDependencies = {
  fetchAccountTimezone: fetchMetaAdAccountTimezone,
  fetchInsights: fetchMetaAdDeliveryInsights,
  getConfig: readMetaAdDeliveryInsightsConfig,
  getNow: () => new Date(),
  upsertInsights: upsertMetaAdDeliveryInsights
}

function emptyBreakdownCounts() {
  return Object.fromEntries(
    metaAdDeliveryBreakdownKinds.map(kind => [kind, 0])
  ) as Record<MetaAdDeliveryBreakdownKind, number>
}

function emptyUnavailableMetricCounts() {
  return Object.fromEntries(
    metaAdDeliveryMetricNames.map(name => [name, 0])
  ) as Record<MetaAdDeliveryMetricName, number>
}

export async function syncMetaAdDeliveryInsights(
  dependencies: MetaAdDeliveryInsightsSyncDependencies =
    defaultDependencies
): Promise<MetaAdDeliveryInsightsSyncResult> {
  const config = dependencies.getConfig()
  const accountTimezone = await dependencies.fetchAccountTimezone(
    config
  )
  const fetchedAt = dependencies.getNow()
  const dateWindow = getMetaAdDeliveryDateWindow(
    fetchedAt,
    accountTimezone
  )
  const insights: MetaAdDeliveryInsight[] = []
  const rowsByBreakdown = emptyBreakdownCounts()

  for (const breakdownKind of metaAdDeliveryBreakdownKinds) {
    const breakdownInsights = await dependencies.fetchInsights(config, {
      accountTimezone,
      breakdownKind,
      dateWindow
    })
    rowsByBreakdown[breakdownKind] = breakdownInsights.length
    insights.push(...breakdownInsights)
  }

  const unavailableMetrics = emptyUnavailableMetricCounts()
  for (const insight of insights) {
    for (const metricName of metaAdDeliveryMetricNames) {
      if (insight.metricAvailability[metricName] === 'unavailable') {
        unavailableMetrics[metricName] += 1
      }
    }
  }

  const upsertedCount = await dependencies.upsertInsights({
    fetchedAt,
    insights
  })

  return {
    accountId: config.accountId,
    accountTimezone,
    fetchedAt: fetchedAt.toISOString(),
    rowCount: insights.length,
    rowsByBreakdown,
    since: dateWindow.since,
    unavailableMetrics,
    until: dateWindow.until,
    upsertedCount
  }
}
