import {
  canonicalOpenQuickViewSchema,
  type CanonicalOpenQuickView
} from '../openQuickViewEvent'
import {
  normalizeCanonicalBrowserEvent,
  type CanonicalBrowserEventRequestContext
} from './normalizeCanonicalBrowserEvent'

export type CanonicalOpenQuickViewRequestContext =
  CanonicalBrowserEventRequestContext

export function normalizeCanonicalOpenQuickView(
  payload: unknown,
  requestContext: CanonicalOpenQuickViewRequestContext
): CanonicalOpenQuickView {
  return normalizeCanonicalBrowserEvent(
    canonicalOpenQuickViewSchema,
    payload,
    requestContext
  )
}
