import {
  canonicalInteractWithAccordionSchema,
  type CanonicalInteractWithAccordion
} from '../interactWithAccordionEvent'
import {
  normalizeCanonicalBrowserEvent,
  type CanonicalBrowserEventRequestContext
} from './normalizeCanonicalBrowserEvent'

export type CanonicalInteractWithAccordionRequestContext =
  CanonicalBrowserEventRequestContext

export function normalizeCanonicalInteractWithAccordion(
  payload: unknown,
  requestContext: CanonicalInteractWithAccordionRequestContext
): CanonicalInteractWithAccordion {
  return normalizeCanonicalBrowserEvent(
    canonicalInteractWithAccordionSchema,
    payload,
    requestContext
  )
}
