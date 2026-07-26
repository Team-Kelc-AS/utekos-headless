import type { CanonicalInteractWithAccordion } from '../interactWithAccordionEvent'
import { createCanonicalGoogleDataManagerDispatch } from './createCanonicalGoogleDataManagerDispatch'
import { mapCanonicalInteractWithAccordionToGoogleDataManager } from './mapCanonicalInteractWithAccordionToGoogleDataManager'

export const dispatchCanonicalInteractWithAccordionToGoogleDataManager =
  createCanonicalGoogleDataManagerDispatch<
    CanonicalInteractWithAccordion,
    'interact_with_accordion'
  >({
    eventName: 'interact_with_accordion',
    mapEvent: mapCanonicalInteractWithAccordionToGoogleDataManager
  })
