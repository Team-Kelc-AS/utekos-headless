import { canonicalInteractWithAccordionSchema } from '../../interactWithAccordionEvent'
import { createMetaProviderAdapter } from '../createMetaProviderAdapter'
import { dispatchCanonicalInteractWithAccordionToMeta } from '../dispatchCanonicalInteractWithAccordionToMeta'

export const metaInteractWithAccordionProviderAdapter =
  createMetaProviderAdapter({
    dispatch: dispatchCanonicalInteractWithAccordionToMeta,
    eventName: 'interact_with_accordion',
    key: 'meta:interact_with_accordion',
    schema: canonicalInteractWithAccordionSchema
  })
