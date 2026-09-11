import type { MetaInsightsQuery } from './metaInsightsQuery'

export const metaInsightsBatchLimit = 50

export type MetaInsightsBatchOperation = {
  name: string
  method: 'GET'
  relative_url: string
}

const edgeSuffix: Record<MetaInsightsQuery['edge'], string> = {
  self: '',
  ads: '/ads',
  stats: '/stats',
  recommendations: '/recommendations',
  insights: '/insights',
  customconversions: '/customconversions',
  targetingsentencelines: '/targetingsentencelines',
  reachestimate: '/reachestimate'
}

export function buildMetaInsightsBatchOperations(
  queries: readonly MetaInsightsQuery[]
): MetaInsightsBatchOperation[] {
  return queries.map(query => {
    const params = new URLSearchParams()
    if (query.edge === 'stats') {
      if (!query.aggregation) {
        throw new Error('Pixel stats queries require aggregation')
      }
      if (query.startTime === undefined || query.endTime === undefined) {
        throw new Error('Pixel stats queries require startTime and endTime')
      }
      if (query.eventSource && query.aggregation !== 'event') {
        throw new Error(
          'Pixel event_source only applies with aggregation=event'
        )
      }
      params.set('aggregation', query.aggregation)
      params.set('start_time', String(query.startTime))
      params.set('end_time', String(query.endTime))
      if (query.eventSource) params.set('event_source', query.eventSource)
    } else {
      if (query.fields) params.set('fields', query.fields)
      if (query.datePreset) params.set('date_preset', query.datePreset)
      if (query.level) params.set('level', query.level)
      if (query.breakdowns && query.breakdowns.length > 0) {
        params.set('breakdowns', query.breakdowns.join(','))
      }
      if (
        query.edge === 'ads' ||
        query.edge === 'recommendations' ||
        query.edge === 'customconversions'
      ) {
        params.set('limit', '50')
      }
      if (query.targetingSpec) {
        params.set('targeting_spec', JSON.stringify(query.targetingSpec))
      }
    }

    const relativeUrl = `${query.objectId}${edgeSuffix[query.edge]}?${params}`

    if (/access_token|token=/i.test(relativeUrl)) {
      throw new Error('Meta access tokens must not appear in batch URLs')
    }

    return {
      name: query.name,
      method: 'GET',
      relative_url: relativeUrl
    }
  })
}
