import { buildMetaInsightsBatchOperations } from './buildMetaInsightsBatchOperations'
import { buildMetaInsightsReachEstimateSpec } from './buildMetaInsightsReachEstimateSpec'
import { collectMetaInsightsAudienceIds } from './collectMetaInsightsAudienceIds'
import { metaInsightsFieldPacks } from './metaInsightsFieldPacks'
import type { MetaInsightsQuery } from './metaInsightsQuery'
import type { MetaInsightsTargetingSummary } from './parseMetaInsightsTargeting'

export function buildMetaInsightsFollowUpOperations(input: {
  accountId: string
  adSets: Readonly<
    Record<string, { targeting: MetaInsightsTargetingSummary | null }>
  >
}) {
  const queries: MetaInsightsQuery[] = []
  const targeting = Object.values(input.adSets).map(adSet => adSet.targeting)
  for (const id of collectMetaInsightsAudienceIds(targeting)) {
    queries.push({
      name: `audience:${id}`,
      objectId: id,
      edge: 'self',
      fields: metaInsightsFieldPacks.audience,
      pack: 'audience'
    })
  }

  const accountId = input.accountId.startsWith('act_')
    ? input.accountId
    : `act_${input.accountId}`

  for (const [key, adSet] of Object.entries(input.adSets)) {
    if (!adSet.targeting) continue
    const targetingSpec = buildMetaInsightsReachEstimateSpec(adSet.targeting)
    if (!targetingSpec) continue
    queries.push({
      name: `reachestimate:${key}`,
      objectId: accountId,
      edge: 'reachestimate',
      fields: '',
      pack: 'account',
      targetingSpec
    })
  }

  return buildMetaInsightsBatchOperations(queries)
}
