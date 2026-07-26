import type { CanonicalInteractWithAccordion } from '../interactWithAccordionEvent'
import { mapCanonicalWebEventToGoogleDataManager } from './mapCanonicalWebEventToGoogleDataManager'

export function mapCanonicalInteractWithAccordionToGoogleDataManager(
  event: CanonicalInteractWithAccordion
) {
  return mapCanonicalWebEventToGoogleDataManager(
    event,
    'interact_with_accordion'
  )
}
