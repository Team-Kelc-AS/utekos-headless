import type { CanonicalEventStore } from './canonicalEventStore'
import {
  normalizeCanonicalViewSearchResults,
  type CanonicalViewSearchResultsRequestContext
} from './normalizeCanonicalViewSearchResults'
import { planCanonicalEventDispatch } from './planCanonicalEventDispatch'

export type CanonicalViewSearchResultsStore = CanonicalEventStore

type AcceptCanonicalViewSearchResultsInput = {
  payload: unknown
  requestContext: CanonicalViewSearchResultsRequestContext
  store: CanonicalViewSearchResultsStore
}

export type AcceptCanonicalViewSearchResultsResult =
  | { event_id: string; status: 'accepted' | 'duplicate' }
  | { reason: 'consent_denied'; status: 'rejected' }

export async function acceptCanonicalViewSearchResults(
  input: AcceptCanonicalViewSearchResultsInput
): Promise<AcceptCanonicalViewSearchResultsResult> {
  const event = normalizeCanonicalViewSearchResults(
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
