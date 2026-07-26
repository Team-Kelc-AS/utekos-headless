import type { CanonicalEventStore } from './canonicalEventStore'
import {
  normalizeCanonicalVariantSelect,
  type CanonicalVariantSelectRequestContext
} from './normalizeCanonicalVariantSelect'
import { planCanonicalEventDispatch } from './planCanonicalEventDispatch'

export type CanonicalVariantSelectStore = CanonicalEventStore

type AcceptCanonicalVariantSelectInput = {
  payload: unknown
  requestContext: CanonicalVariantSelectRequestContext
  store: CanonicalVariantSelectStore
}

export type AcceptCanonicalVariantSelectResult =
  | { event_id: string; status: 'accepted' | 'duplicate' }
  | { reason: 'consent_denied'; status: 'rejected' }

export async function acceptCanonicalVariantSelect(
  input: AcceptCanonicalVariantSelectInput
): Promise<AcceptCanonicalVariantSelectResult> {
  const event = normalizeCanonicalVariantSelect(
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
