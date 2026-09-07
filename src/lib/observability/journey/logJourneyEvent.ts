import type {
  JourneyAcceptance,
  JourneyRow
} from './journeyStore'

export function logJourneyEvent(
  row: JourneyRow,
  status: JourneyAcceptance | 'storage_failed'
) {
  const entry = {
    event: 'journey.event',
    level: status === 'storage_failed' ? 'warn' : 'info',
    timestamp: row.received_at,
    event_name: row.event.event_name,
    event_id: row.event.event_id,
    journey_id: row.event.journey_id,
    page_view_id: row.event.page_view_id,
    previous_page_view_id: row.event.previous_page_view_id,
    occurred_at: row.event.occurred_at,
    page_path: row.event.page_path,
    source: 'browser',
    evidence: 'browser_reported',
    consent_evidence: 'browser_reported',
    consent: row.event.consent,
    status,
    traffic_classification: row.traffic_classification,
    environment: row.runtime.environment,
    deployment_id: row.runtime.deploymentId,
    commit_sha: row.runtime.commitSha,
    data: row.event.data
  }
  try {
    if (status === 'storage_failed')
      console.warn(JSON.stringify(entry))
    else console.log(JSON.stringify(entry))
  } catch {
    // Logging must not change a committed receipt into a failed request.
  }
}
