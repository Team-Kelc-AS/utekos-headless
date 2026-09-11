import type { MetaInsightsTargetingSummary } from './parseMetaInsightsTargeting'

export function collectMetaInsightsAudienceIds(
  summaries: ReadonlyArray<MetaInsightsTargetingSummary | null>
) {
  const ids = new Set<string>()
  for (const summary of summaries) {
    if (!summary) continue
    for (const row of summary.customAudiences) ids.add(row.id)
    for (const row of summary.excludedCustomAudiences) ids.add(row.id)
  }
  return [...ids].sort()
}
