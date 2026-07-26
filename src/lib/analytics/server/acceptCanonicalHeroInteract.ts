import type { CanonicalEventStore } from './canonicalEventStore'
import {
  normalizeCanonicalHeroInteract,
  type CanonicalHeroInteractRequestContext
} from './normalizeCanonicalHeroInteract'
import { planCanonicalEventDispatch } from './planCanonicalEventDispatch'

export type CanonicalHeroInteractStore = CanonicalEventStore

type AcceptCanonicalHeroInteractInput = {
  payload: unknown
  requestContext: CanonicalHeroInteractRequestContext
  store: CanonicalHeroInteractStore
}

export type AcceptCanonicalHeroInteractResult =
  | { event_id: string; status: 'accepted' | 'duplicate' }
  | { reason: 'consent_denied'; status: 'rejected' }

export async function acceptCanonicalHeroInteract(
  input: AcceptCanonicalHeroInteractInput
): Promise<AcceptCanonicalHeroInteractResult> {
  const event = normalizeCanonicalHeroInteract(
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
