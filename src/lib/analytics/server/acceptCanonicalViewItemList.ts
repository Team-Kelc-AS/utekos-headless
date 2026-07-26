import type { CanonicalEventStore } from './canonicalEventStore'
import {
  normalizeCanonicalViewItemList,
  type CanonicalViewItemListRequestContext
} from './normalizeCanonicalViewItemList'
import { planCanonicalEventDispatch } from './planCanonicalEventDispatch'

export type CanonicalViewItemListStore = CanonicalEventStore

type AcceptCanonicalViewItemListInput = {
  payload: unknown
  requestContext: CanonicalViewItemListRequestContext
  store: CanonicalViewItemListStore
}

export type AcceptCanonicalViewItemListResult =
  | { event_id: string; status: 'accepted' | 'duplicate' }
  | { reason: 'consent_denied'; status: 'rejected' }

export async function acceptCanonicalViewItemList(
  input: AcceptCanonicalViewItemListInput
): Promise<AcceptCanonicalViewItemListResult> {
  const event = normalizeCanonicalViewItemList(
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
