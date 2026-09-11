import { metaInsightsPixelStatsResponseSchema } from './metaInsightsPixelStatsSchema'

export function summarizeMetaInsightsPixelStats(body: unknown) {
  const parsed = metaInsightsPixelStatsResponseSchema.parse(body)
  const counts: Record<string, number> = {}
  for (const bucket of parsed.data) {
    for (const item of bucket.data ?? []) {
      counts[item.value] = (counts[item.value] ?? 0) + item.count
    }
  }
  return counts
}
