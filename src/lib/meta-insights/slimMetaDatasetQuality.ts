import { requiredMetaDatasetQualityEvents } from '../analytics/metaDatasetQualityRequiredEvents'
import type { MetaDatasetQualityResponse } from '../analytics/server/metaDatasetQualitySchema'

export function slimMetaDatasetQuality(
  quality: MetaDatasetQualityResponse
) {
  return {
    retrieval: {
      source: 'meta_dataset_quality_api',
      mode: 'live_read_only',
      persistence: 'not_written'
    },
    semantics: {
      emq: 'calculated_in_real_time',
      coverage: 'rolling_7_day_average',
      freshness: 'average_provider_receipt_delay_category',
      acr: 'last_7_days_when_returned_by_provider'
    },
    events: requiredMetaDatasetQualityEvents.map(eventName => {
      const event = quality.web.find(
        row => row.event_name === eventName
      )

      return {
        eventName,
        providerStatus: event ? 'returned' : 'not_returned',
        emq: event?.event_match_quality?.composite_score ?? null,
        matchKeyCoverage:
          event?.event_match_quality?.match_key_feedback?.map(
            feedback => ({
              identifier: feedback.identifier,
              percentage: feedback.coverage?.percentage ?? null
            })
          ) ?? [],
        coverage: event?.event_coverage?.percentage ?? null,
        coverageGoal:
          event?.event_coverage?.goal_percentage ?? null,
        dedupeKeyCoverage:
          event?.dedupe_key_feedback?.map(feedback => ({
            dedupeKey: feedback.dedupe_key,
            browserWithKey:
              feedback.browser_events_with_dedupe_key
                ?.percentage ?? null,
            serverWithKey:
              feedback.server_events_with_dedupe_key
                ?.percentage ?? null,
            deduplicatedBrowserCoverage:
              feedback.overall_browser_coverage_from_dedupe_key
                ?.percentage ?? null
          })) ?? [],
        freshness:
          event?.data_freshness?.upload_frequency ?? null,
        acr: event?.acr?.percentage ?? null,
        acrStatus:
          !event ? 'event_not_returned'
          : event.acr === null ? 'null_from_provider'
          : event.acr === undefined ? 'omitted_by_provider'
          : 'returned'
      }
    })
  }
}
