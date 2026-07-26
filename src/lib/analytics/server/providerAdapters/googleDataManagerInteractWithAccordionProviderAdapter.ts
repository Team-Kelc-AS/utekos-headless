import { canonicalInteractWithAccordionSchema } from '../../interactWithAccordionEvent'
import { createGoogleDataManagerProviderAdapter } from '../createGoogleDataManagerProviderAdapter'
import { dispatchCanonicalInteractWithAccordionToGoogleDataManager } from '../dispatchCanonicalInteractWithAccordionToGoogleDataManager'

export const googleDataManagerInteractWithAccordionProviderAdapter =
  createGoogleDataManagerProviderAdapter({
    dispatch: dispatchCanonicalInteractWithAccordionToGoogleDataManager,
    eventName: 'interact_with_accordion',
    key: 'google:interact_with_accordion',
    schema: canonicalInteractWithAccordionSchema
  })
