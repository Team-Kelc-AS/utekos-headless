import { acceptCanonicalInteractWithAccordion } from './acceptCanonicalInteractWithAccordion'
import { createBrowserEventRequestHandler } from './createBrowserEventRequestHandler'

export const handleCanonicalInteractWithAccordionRequest =
  createBrowserEventRequestHandler(
    acceptCanonicalInteractWithAccordion,
    { eventName: 'interact_with_accordion' }
  )
