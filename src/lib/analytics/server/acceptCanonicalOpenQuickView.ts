import type { CanonicalEventStore } from './canonicalEventStore'
import {
  normalizeCanonicalOpenQuickView,
  type CanonicalOpenQuickViewRequestContext
} from './normalizeCanonicalOpenQuickView'
import { planCanonicalEventDispatch } from './planCanonicalEventDispatch'

type AcceptCanonicalOpenQuickViewInput = {
  payload: unknown
  requestContext: CanonicalOpenQuickViewRequestContext
  store: CanonicalEventStore
}

export async function acceptCanonicalOpenQuickView(
  input: AcceptCanonicalOpenQuickViewInput
) {
  const event = normalizeCanonicalOpenQuickView(
    input.payload,
    input.requestContext
  )
  const hasPermittedPurpose =
    event.consent.analytics === 'granted' ||
    event.consent.marketing === 'granted'

  if (!hasPermittedPurpose) {
    return { reason: 'consent_denied' as const, status: 'rejected' as const }
  }

  const result = await input.store.accept({
    dispatches: planCanonicalEventDispatch(event),
    event
  })

  return {
    event_id: event.event_id,
    status:
      result.status === 'inserted' ?
        ('accepted' as const)
      : ('duplicate' as const)
  }
}
