import type { MetaInsightsLiveSnapshot } from './buildMetaInsightsLiveSnapshot'
import type { MetaInsightsBatchItem } from './fetchMetaInsightsGraphBatch'
import { parseMetaInsightsCustomAudience } from './parseMetaInsightsCustomAudience'
import { parseMetaInsightsReachEstimate } from './parseMetaInsightsReachEstimate'
import { readMetaInsightsOptionalItem } from './readMetaInsightsOptionalItem'

export function attachMetaInsightsFollowUp(
  snapshot: MetaInsightsLiveSnapshot,
  items: readonly MetaInsightsBatchItem[]
): MetaInsightsLiveSnapshot {
  const audiences = { ...snapshot.audiences }
  const reachEstimates = { ...snapshot.reachEstimates }
  const followUpErrors = [...snapshot.followUpErrors]

  for (const item of items) {
    if (item.name.startsWith('audience:')) {
      const read = readMetaInsightsOptionalItem(items, item.name)
      if (!read.ok) {
        followUpErrors.push(read.error)
        continue
      }
      const audience = parseMetaInsightsCustomAudience(read.body)
      audiences[audience.id] = audience
      continue
    }
    if (item.name.startsWith('reachestimate:')) {
      const read = readMetaInsightsOptionalItem(items, item.name)
      if (!read.ok) {
        followUpErrors.push(read.error)
        continue
      }
      const key = item.name.slice('reachestimate:'.length)
      reachEstimates[key] = parseMetaInsightsReachEstimate(read.body)
    }
  }

  return {
    ...snapshot,
    audiences,
    reachEstimates,
    followUpErrors
  }
}
