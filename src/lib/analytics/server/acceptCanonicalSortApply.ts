import type { CanonicalEventStore } from './canonicalEventStore'
import {
  normalizeCanonicalSortApply,
  type CanonicalSortApplyRequestContext
} from './normalizeCanonicalSortApply'
import { planCanonicalEventDispatch } from './planCanonicalEventDispatch'

export type CanonicalSortApplyStore = CanonicalEventStore

type AcceptCanonicalSortApplyInput = {
  payload: unknown
  requestContext: CanonicalSortApplyRequestContext
  store: CanonicalSortApplyStore
}

export type AcceptCanonicalSortApplyResult =
  | { event_id: string; status: 'accepted' | 'duplicate' }
  | { reason: 'consent_denied'; status: 'rejected' }

export async function acceptCanonicalSortApply(
  input: AcceptCanonicalSortApplyInput
): Promise<AcceptCanonicalSortApplyResult> {
  const event = normalizeCanonicalSortApply(
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
