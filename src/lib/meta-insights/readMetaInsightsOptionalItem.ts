import type { MetaInsightsBatchItem } from './fetchMetaInsightsGraphBatch'
import { metaInsightsErrorBodySchema } from './metaInsightsLiveSnapshotSchema'

export function readMetaInsightsOptionalItem(
  items: readonly MetaInsightsBatchItem[],
  name: string
) {
  const item = items.find(candidate => candidate.name === name)
  if (!item) {
    return { ok: false as const, error: `omitted ${name}` }
  }
  const error = metaInsightsErrorBodySchema.safeParse(item.body)
  if (item.code >= 400 || error.success) {
    const message = error.success
      ? error.data.error.message
      : `HTTP ${item.code}`
    return { ok: false as const, error: `${name}: ${message}` }
  }
  return { ok: true as const, body: item.body }
}
