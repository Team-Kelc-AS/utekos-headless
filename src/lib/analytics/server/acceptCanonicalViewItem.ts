import type { CanonicalEventStore } from './canonicalEventStore'
import {
  normalizeCanonicalViewItem,
  type CanonicalViewItemRequestContext
} from './normalizeCanonicalViewItem'
import { planCanonicalEventDispatch } from './planCanonicalEventDispatch'

export type CanonicalViewItemStore = CanonicalEventStore

type AcceptCanonicalViewItemInput = {
  payload: unknown
  requestContext: CanonicalViewItemRequestContext
  store: CanonicalViewItemStore
}

export type AcceptCanonicalViewItemResult =
  | { event_id: string; status: 'accepted' | 'duplicate' }
  | { reason: 'consent_denied'; status: 'rejected' }

export async function acceptCanonicalViewItem(
  input: AcceptCanonicalViewItemInput
): Promise<AcceptCanonicalViewItemResult> {
  const event = normalizeCanonicalViewItem(
    input.payload,
    input.requestContext
  )
  const hasPermittedPurpose =
    event.consent.analytics === 'granted'
    || event.consent.marketing === 'granted'

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
