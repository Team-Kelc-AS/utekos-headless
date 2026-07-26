import type { CanonicalEventStore } from './canonicalEventStore'
import {
  normalizeCanonicalSearch,
  type CanonicalSearchRequestContext
} from './normalizeCanonicalSearch'
import { planCanonicalEventDispatch } from './planCanonicalEventDispatch'

export type CanonicalSearchStore = CanonicalEventStore

type AcceptCanonicalSearchInput = {
  payload: unknown
  requestContext: CanonicalSearchRequestContext
  store: CanonicalSearchStore
}

export type AcceptCanonicalSearchResult =
  | { event_id: string; status: 'accepted' | 'duplicate' }
  | { reason: 'consent_denied'; status: 'rejected' }

export async function acceptCanonicalSearch(
  input: AcceptCanonicalSearchInput
): Promise<AcceptCanonicalSearchResult> {
  const event = normalizeCanonicalSearch(
    input.payload,
    input.requestContext
  )
  const hasPermittedPurpose =
    event.consent.analytics === 'granted' ||
    event.consent.marketing === 'granted'

  if (!hasPermittedPurpose) {
    return { reason: 'consent_denied', status: 'rejected' }
  }

  const result = await input.store.accept({
    dispatches: planCanonicalEventDispatch(event),
    event
  })

  return {
    event_id: event.event_id,
    status:
      result.status === 'inserted' ? 'accepted' : 'duplicate'
  }
}
