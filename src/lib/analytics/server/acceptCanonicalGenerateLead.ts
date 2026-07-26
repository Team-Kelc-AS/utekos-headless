import type { CanonicalEventStore } from './canonicalEventStore'
import {
  normalizeCanonicalGenerateLead,
  type CanonicalGenerateLeadRequestContext
} from './normalizeCanonicalGenerateLead'
import { planCanonicalEventDispatch } from './planCanonicalEventDispatch'

export type CanonicalGenerateLeadStore = CanonicalEventStore

type AcceptCanonicalGenerateLeadInput = {
  payload: unknown
  requestContext: CanonicalGenerateLeadRequestContext
  store: CanonicalGenerateLeadStore
}

export type AcceptCanonicalGenerateLeadResult =
  | { event_id: string; status: 'accepted' | 'duplicate' }
  | { reason: 'consent_denied'; status: 'rejected' }

export async function acceptCanonicalGenerateLead(
  input: AcceptCanonicalGenerateLeadInput
): Promise<AcceptCanonicalGenerateLeadResult> {
  const event = normalizeCanonicalGenerateLead(
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
