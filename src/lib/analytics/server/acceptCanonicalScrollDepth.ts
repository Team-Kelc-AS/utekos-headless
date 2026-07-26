import type { CanonicalEventStore } from './canonicalEventStore'
import {
  normalizeCanonicalScrollDepth,
  type CanonicalScrollDepthRequestContext
} from './normalizeCanonicalScrollDepth'
import { planCanonicalEventDispatch } from './planCanonicalEventDispatch'

export type CanonicalScrollDepthStore = CanonicalEventStore

type AcceptCanonicalScrollDepthInput = {
  payload: unknown
  requestContext: CanonicalScrollDepthRequestContext
  store: CanonicalScrollDepthStore
}

export type AcceptCanonicalScrollDepthResult =
  | { event_id: string; status: 'accepted' | 'duplicate' }
  | { reason: 'consent_denied'; status: 'rejected' }

export async function acceptCanonicalScrollDepth(
  input: AcceptCanonicalScrollDepthInput
): Promise<AcceptCanonicalScrollDepthResult> {
  const event = normalizeCanonicalScrollDepth(
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
