import type { CanonicalEventStore } from './canonicalEventStore'
import {
  normalizeCanonicalFilterApply,
  type CanonicalFilterApplyRequestContext
} from './normalizeCanonicalFilterApply'
import { planCanonicalEventDispatch } from './planCanonicalEventDispatch'

export type CanonicalFilterApplyStore = CanonicalEventStore

type AcceptCanonicalFilterApplyInput = {
  payload: unknown
  requestContext: CanonicalFilterApplyRequestContext
  store: CanonicalFilterApplyStore
}

export type AcceptCanonicalFilterApplyResult =
  | { event_id: string; status: 'accepted' | 'duplicate' }
  | { reason: 'consent_denied'; status: 'rejected' }

export async function acceptCanonicalFilterApply(
  input: AcceptCanonicalFilterApplyInput
): Promise<AcceptCanonicalFilterApplyResult> {
  const event = normalizeCanonicalFilterApply(
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
