import type { CanonicalEventStore } from './canonicalEventStore'
import {
  normalizeCanonicalFormError,
  type CanonicalFormErrorRequestContext
} from './normalizeCanonicalFormError'
import { planCanonicalEventDispatch } from './planCanonicalEventDispatch'

export type CanonicalFormErrorStore = CanonicalEventStore

type AcceptCanonicalFormErrorInput = {
  payload: unknown
  requestContext: CanonicalFormErrorRequestContext
  store: CanonicalFormErrorStore
}

export type AcceptCanonicalFormErrorResult =
  | { event_id: string; status: 'accepted' | 'duplicate' }
  | { reason: 'consent_denied'; status: 'rejected' }

export async function acceptCanonicalFormError(
  input: AcceptCanonicalFormErrorInput
): Promise<AcceptCanonicalFormErrorResult> {
  const event = normalizeCanonicalFormError(
    input.payload,
    input.requestContext
  )
  const hasPermittedPurpose =
    event.consent.analytics === 'granted'

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
