import type { ServerEvent } from 'facebook-nodejs-business-sdk'
import type { CanonicalViewCart } from '../viewCartEvent'
import { mapCanonicalCommerceEventToMeta } from './mapCanonicalCommerceEventToMeta'

export function mapCanonicalViewCartToMeta(
  event: CanonicalViewCart
): ServerEvent {
  return mapCanonicalCommerceEventToMeta(event, 'ViewCart', {
    cart_id: event.custom_data.cart_id,
    gross_value: event.custom_data.gross_value,
    net_value: event.custom_data.value,
    tax_value: event.custom_data.tax_value,
    view_sequence: event.custom_data.view_sequence
  })
}
