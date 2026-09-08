import type { ServerEvent } from 'facebook-nodejs-business-sdk'
import type { CanonicalRemoveFromCart } from '../removeFromCartEvent'
import { mapCanonicalCommerceEventToMeta } from './mapCanonicalCommerceEventToMeta'

export function mapCanonicalRemoveFromCartToMeta(
  event: CanonicalRemoveFromCart
): ServerEvent {
  if (!event.page_url) {
    throw new Error('Meta remove_from_cart: missing_page_url')
  }
  return mapCanonicalCommerceEventToMeta(
    {
      ...event,
      page_url: event.page_url
    },
    'RemoveFromCart'
  )
}
