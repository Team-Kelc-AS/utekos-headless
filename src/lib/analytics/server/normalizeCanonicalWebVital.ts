import {
  canonicalWebVitalSchema,
  type CanonicalWebVital
} from '../webVitalEvent'
import {
  normalizeCanonicalBrowserEvent,
  type CanonicalBrowserEventRequestContext
} from './normalizeCanonicalBrowserEvent'

export type CanonicalWebVitalRequestContext =
  CanonicalBrowserEventRequestContext

export function normalizeCanonicalWebVital(
  payload: unknown,
  requestContext: CanonicalWebVitalRequestContext
): CanonicalWebVital {
  return normalizeCanonicalBrowserEvent(
    canonicalWebVitalSchema,
    payload,
    requestContext
  )
}
