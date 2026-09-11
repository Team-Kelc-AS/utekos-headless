import type { MetaInsightsFieldPack } from './metaInsightsFieldPacks'

export type MetaInsightsQueryEdge =
  | 'self'
  | 'insights'
  | 'ads'
  | 'stats'
  | 'recommendations'
  | 'customconversions'
  | 'targetingsentencelines'
  | 'reachestimate'

export type MetaInsightsQuery = {
  name: string
  objectId: string
  edge: MetaInsightsQueryEdge
  fields: string
  pack: MetaInsightsFieldPack
  datePreset?: 'today'
  breakdowns?: readonly string[]
  level?: 'adset' | 'ad'
  aggregation?: 'event_total_counts' | 'event'
  startTime?: number
  endTime?: number
  eventSource?: 'WEB_ONLY' | 'SERVER_ONLY'
  targetingSpec?: Record<string, unknown>
}
