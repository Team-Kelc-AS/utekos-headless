import { z } from 'zod'
import type { MetaInsightsActionType } from './metaInsightsActionTypes'
import { metaInsightsActionTypes } from './metaInsightsActionTypes'

const actionRowSchema = z.object({
  action_type: z.string(),
  value: z.string()
})

function parseActionValue(value: string) {
  const parsed = Number(value)
  if (!Number.isFinite(parsed) || parsed < 0) {
    throw new Error('Meta returned an invalid action metric')
  }
  return parsed
}

export function summarizeMetaInsightsActions(
  actions: unknown
): Partial<Record<MetaInsightsActionType, number>> {
  if (actions === undefined || actions === null) return {}

  const rows = z.array(actionRowSchema).parse(actions)
  const allowed = new Set<string>(metaInsightsActionTypes)
  const summary: Partial<Record<MetaInsightsActionType, number>> = {}

  for (const row of rows) {
    if (!allowed.has(row.action_type)) continue
    const key = row.action_type as MetaInsightsActionType
    summary[key] = (summary[key] ?? 0) + parseActionValue(row.value)
  }

  return summary
}
