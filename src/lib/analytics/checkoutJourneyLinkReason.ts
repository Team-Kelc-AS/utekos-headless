import { z } from 'zod'

export const checkoutJourneyLinkReasonSchema = z.enum([
  'linked',
  'analytics_consent_not_granted',
  'begin_checkout_event_id_missing',
  'begin_checkout_not_found',
  'begin_checkout_mismatch',
  'begin_checkout_journey_missing',
  'lookup_unavailable'
])

export type CheckoutJourneyLinkReason = z.infer<
  typeof checkoutJourneyLinkReasonSchema
>
