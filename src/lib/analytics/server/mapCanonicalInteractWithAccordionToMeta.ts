import type { ServerEvent } from 'facebook-nodejs-business-sdk'
import type { CanonicalInteractWithAccordion } from '../interactWithAccordionEvent'
import { mapCanonicalCommerceEventToMeta } from './mapCanonicalCommerceEventToMeta'

export function mapCanonicalInteractWithAccordionToMeta(
  event: CanonicalInteractWithAccordion
): ServerEvent {
  return mapCanonicalCommerceEventToMeta(
    event,
    'InteractWithAccordion',
    {
      accordion_id: event.custom_data.accordion_id,
      accordion_title: event.custom_data.accordion_title,
      gross_value: event.custom_data.gross_value,
      interaction_sequence: event.custom_data.interaction_sequence,
      interaction_type: event.custom_data.interaction_type,
      net_value: event.custom_data.value,
      tax_value: event.custom_data.tax_value
    }
  )
}
