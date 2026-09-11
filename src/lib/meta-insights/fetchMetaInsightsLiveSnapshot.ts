import { fetchMetaDatasetQuality } from '../analytics/server/fetchMetaDatasetQuality'
import { attachMetaInsightsFollowUp } from './attachMetaInsightsFollowUp'
import { buildMetaInsightsBatchOperations } from './buildMetaInsightsBatchOperations'
import { buildMetaInsightsFollowUpOperations } from './buildMetaInsightsFollowUpOperations'
import { buildMetaInsightsLiveQueryPlan } from './buildMetaInsightsLiveQueryPlan'
import { buildMetaInsightsLiveSnapshot } from './buildMetaInsightsLiveSnapshot'
import {
  fetchMetaInsightsGraphBatch,
  type MetaInsightsGraphFetch
} from './fetchMetaInsightsGraphBatch'
import {
  metaInsightsLiveWatch,
  type MetaInsightsLiveWatch
} from './metaInsightsLiveWatch'
import { readMetaInsightsAccessToken } from './readMetaInsightsAccessToken'

export async function fetchMetaInsightsLiveSnapshot(input?: {
  accessToken?: string
  fetchedAt?: Date
  fetchImplementation?: MetaInsightsGraphFetch
  watch?: MetaInsightsLiveWatch
}) {
  const accessToken =
    input?.accessToken ?? readMetaInsightsAccessToken()
  const watch = input?.watch ?? metaInsightsLiveWatch
  const fetchedAt = input?.fetchedAt ?? new Date()
  const queries = buildMetaInsightsLiveQueryPlan(watch, fetchedAt)
  const operations = buildMetaInsightsBatchOperations(queries)
  const [batch, quality] = await Promise.all([
    fetchMetaInsightsGraphBatch(
      accessToken,
      operations,
      input?.fetchImplementation
    ),
    fetchMetaDatasetQuality(
      { accessToken, datasetId: watch.pixelId },
      input?.fetchImplementation
    )
  ])

  const snapshot = buildMetaInsightsLiveSnapshot({
    fetchedAt,
    items: batch.items,
    quality,
    throttle: batch.throttle,
    watch
  })
  const followUp = buildMetaInsightsFollowUpOperations({
    accountId: snapshot.account.id,
    adSets: snapshot.adSets
  })
  if (followUp.length === 0) return snapshot

  const followBatch = await fetchMetaInsightsGraphBatch(
    accessToken,
    followUp,
    input?.fetchImplementation
  )

  return attachMetaInsightsFollowUp(snapshot, followBatch.items)
}
