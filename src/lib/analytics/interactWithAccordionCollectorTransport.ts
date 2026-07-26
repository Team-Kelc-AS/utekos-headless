import { createCanonicalCollectorTransport } from './createCanonicalCollectorTransport'
import type { CanonicalInteractWithAccordion } from './interactWithAccordionEvent'

export const startInteractWithAccordionCollectorTransport =
  createCanonicalCollectorTransport<CanonicalInteractWithAccordion>({
    analyticsEventName: 'interact_with_accordion',
    endpoint: '/api/events/interact-with-accordion'
  })
