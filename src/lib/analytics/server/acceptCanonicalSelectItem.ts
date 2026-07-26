import type { CanonicalEventStore } from './canonicalEventStore'
import {
  normalizeCanonicalSelectItem,
  type CanonicalSelectItemRequestContext
} from './normalizeCanonicalSelectItem'
import { planCanonicalEventDispatch } from './planCanonicalEventDispatch'

export type CanonicalSelectItemStore = CanonicalEventStore

type AcceptCanonicalSelectItemInput = {
  payload: unknown
  requestContext: CanonicalSelectItemRequestContext
  store: CanonicalSelectItemStore
}

export type AcceptCanonicalSelectItemResult =
  | { event_id: string; status: 'accepted' | 'duplicate' }
  | { reason: 'consent_denied'; status: 'rejected' }

export async function acceptCanonicalSelectItem(
  input: AcceptCanonicalSelectItemInput
): Promise<AcceptCanonicalSelectItemResult> {
  const event = normalizeCanonicalSelectItem(
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
