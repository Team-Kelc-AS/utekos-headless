import type { ServerEvent } from 'facebook-nodejs-business-sdk'
import type { CanonicalAddShippingInfo } from '../addShippingInfoEvent'
import { mapCanonicalCommerceEventToMeta } from './mapCanonicalCommerceEventToMeta'

export function mapCanonicalAddShippingInfoToMeta(
  event: CanonicalAddShippingInfo
): ServerEvent {
  if (!event.page_url) {
    throw new Error('Meta AddShippingInfo requires page_url')
  }
  return mapCanonicalCommerceEventToMeta(
    { ...event, page_url: event.page_url },
    'AddShippingInfo',
    {
      checkout_id: event.custom_data.checkout_id,
      shipping_revision: event.custom_data.shipping_revision
    }
  )
}
