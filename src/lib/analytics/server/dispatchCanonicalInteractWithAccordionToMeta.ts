import type { CanonicalInteractWithAccordion } from '../interactWithAccordionEvent'
import { createCanonicalMetaDispatch } from './createCanonicalMetaDispatch'
import { mapCanonicalInteractWithAccordionToMeta } from './mapCanonicalInteractWithAccordionToMeta'

export const dispatchCanonicalInteractWithAccordionToMeta =
  createCanonicalMetaDispatch<
    CanonicalInteractWithAccordion,
    'interact_with_accordion'
  >({
    eventName: 'interact_with_accordion',
    mapEvent: mapCanonicalInteractWithAccordionToMeta
  })
