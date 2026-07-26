import type { CanonicalEventStore } from './canonicalEventStore'
import {
  normalizeCanonicalVideoProgress,
  type CanonicalVideoProgressRequestContext
} from './normalizeCanonicalVideoProgress'
import { planCanonicalEventDispatch } from './planCanonicalEventDispatch'

export type CanonicalVideoProgressStore = CanonicalEventStore

type AcceptCanonicalVideoProgressInput = {
  payload: unknown
  requestContext: CanonicalVideoProgressRequestContext
  store: CanonicalVideoProgressStore
}

export type AcceptCanonicalVideoProgressResult =
  | { event_id: string; status: 'accepted' | 'duplicate' }
  | { reason: 'consent_denied'; status: 'rejected' }

export async function acceptCanonicalVideoProgress(
  input: AcceptCanonicalVideoProgressInput
): Promise<AcceptCanonicalVideoProgressResult> {
  const event = normalizeCanonicalVideoProgress(
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
