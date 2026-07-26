import type { CanonicalEventStore } from './canonicalEventStore'
import {
  normalizeCanonicalSizeGuideView,
  type CanonicalSizeGuideViewRequestContext
} from './normalizeCanonicalSizeGuideView'
import { planCanonicalEventDispatch } from './planCanonicalEventDispatch'

export type CanonicalSizeGuideViewStore = CanonicalEventStore

type AcceptCanonicalSizeGuideViewInput = {
  payload: unknown
  requestContext: CanonicalSizeGuideViewRequestContext
  store: CanonicalSizeGuideViewStore
}

export type AcceptCanonicalSizeGuideViewResult =
  | { event_id: string; status: 'accepted' | 'duplicate' }
  | { reason: 'consent_denied'; status: 'rejected' }

export async function acceptCanonicalSizeGuideView(
  input: AcceptCanonicalSizeGuideViewInput
): Promise<AcceptCanonicalSizeGuideViewResult> {
  const event = normalizeCanonicalSizeGuideView(
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
