import type { CanonicalEventStore } from './canonicalEventStore'
import { normalizeMetaNonWebIngestEvent } from './normalizeMetaNonWebIngestEvent'
import { planCanonicalEventDispatch } from './planCanonicalEventDispatch'

export async function acceptMetaNonWebEvent(input: {
  payload: unknown
  store: CanonicalEventStore
}) {
  const event = normalizeMetaNonWebIngestEvent(input.payload)
  const accepted = await input.store.accept({
    dispatches: planCanonicalEventDispatch(event),
    event
  })

  return {
    event_id: event.event_id,
    status:
      accepted.status === 'inserted' ?
        ('accepted' as const)
      : ('duplicate' as const)
  }
}
