import { logWebVital } from '../logWebVital'
import { mapCanonicalWebVitalToRow } from './mapCanonicalWebVitalToRow'
import {
  normalizeCanonicalWebVital,
  type CanonicalWebVitalRequestContext
} from './normalizeCanonicalWebVital'
import type { CanonicalWebVitalStore } from './createPostgresWebVitalsStore'

type AcceptCanonicalWebVitalInput = {
  payload: unknown
  requestContext: CanonicalWebVitalRequestContext
  store: CanonicalWebVitalStore
}

export type AcceptCanonicalWebVitalResult =
  | { event_id: string; status: 'accepted' }
  | { reason: 'consent_denied'; status: 'rejected' }

export async function acceptCanonicalWebVital(
  input: AcceptCanonicalWebVitalInput
): Promise<AcceptCanonicalWebVitalResult> {
  const event = normalizeCanonicalWebVital(
    input.payload,
    input.requestContext
  )

  if (event.consent.analytics !== 'granted') {
    return { reason: 'consent_denied', status: 'rejected' }
  }

  await input.store.insert(mapCanonicalWebVitalToRow(event))

  logWebVital({
    name: event.custom_data.name,
    pathname: event.custom_data.pathname,
    ...(event.custom_data.rating ?
      { rating: event.custom_data.rating }
    : {}),
    value: event.custom_data.value
  })

  return {
    event_id: event.event_id,
    status: 'accepted'
  }
}
