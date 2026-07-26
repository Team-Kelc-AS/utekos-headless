import type { CanonicalEventStore } from './canonicalEventStore'
import {
  normalizeCanonicalViewCategory,
  type CanonicalViewCategoryRequestContext
} from './normalizeCanonicalViewCategory'
import { planCanonicalEventDispatch } from './planCanonicalEventDispatch'

export type CanonicalViewCategoryStore = CanonicalEventStore

type AcceptCanonicalViewCategoryInput = {
  payload: unknown
  requestContext: CanonicalViewCategoryRequestContext
  store: CanonicalViewCategoryStore
}

export type AcceptCanonicalViewCategoryResult =
  | { event_id: string; status: 'accepted' | 'duplicate' }
  | { reason: 'consent_denied'; status: 'rejected' }

export async function acceptCanonicalViewCategory(
  input: AcceptCanonicalViewCategoryInput
): Promise<AcceptCanonicalViewCategoryResult> {
  const event = normalizeCanonicalViewCategory(
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
