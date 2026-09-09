import type { CanonicalStoredEvent } from './canonicalEventStore'

/** Consent and eligible identifiers can change, but the page identity cannot. */
export function canReleasePageViewMarketing(
  stored: CanonicalStoredEvent | null,
  incoming: CanonicalStoredEvent
) {
  if (
    stored?.event_name !== 'page_view' ||
    incoming.event_name !== 'page_view' ||
    stored.consent.analytics !== 'granted' ||
    stored.consent.marketing !== 'denied' ||
    incoming.consent.marketing !== 'granted'
  ) {
    return false
  }

  return (
    stored.event_id === incoming.event_id &&
    stored.page_view_id === incoming.page_view_id &&
    stored.event_time === incoming.event_time &&
    stored.page_url === incoming.page_url &&
    stored.referrer_url === incoming.referrer_url &&
    stored.edge_request_id === incoming.edge_request_id &&
    stored.environment === incoming.environment &&
    stored.source === incoming.source &&
    stored.schema_version === incoming.schema_version
  )
}
