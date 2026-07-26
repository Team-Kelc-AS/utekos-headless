import type { ServerEvent } from 'facebook-nodejs-business-sdk'
import type { CanonicalOpenQuickView } from '../openQuickViewEvent'
import { mapCanonicalCommerceEventToMeta } from './mapCanonicalCommerceEventToMeta'

export function mapCanonicalOpenQuickViewToMeta(
  event: CanonicalOpenQuickView
): ServerEvent {
  return mapCanonicalCommerceEventToMeta(event, 'OpenQuickView', {
    gross_value: event.custom_data.gross_value,
    net_value: event.custom_data.value,
    open_sequence: event.custom_data.open_sequence,
    source_surface: event.custom_data.source_surface,
    tax_value: event.custom_data.tax_value
  })
}
