import type { CanonicalEventStore } from './canonicalEventStore'
import {
  normalizeCanonicalInteractWithAccordion,
  type CanonicalInteractWithAccordionRequestContext
} from './normalizeCanonicalInteractWithAccordion'
import { planCanonicalEventDispatch } from './planCanonicalEventDispatch'

type AcceptCanonicalInteractWithAccordionInput = {
  payload: unknown
  requestContext: CanonicalInteractWithAccordionRequestContext
  store: CanonicalEventStore
}

export async function acceptCanonicalInteractWithAccordion(
  input: AcceptCanonicalInteractWithAccordionInput
) {
  const event = normalizeCanonicalInteractWithAccordion(
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
