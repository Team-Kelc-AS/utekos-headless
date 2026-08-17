import type { ServerEvent } from 'facebook-nodejs-business-sdk'
import type { CanonicalAddPaymentInfo } from '../addPaymentInfoEvent'
import { mapCanonicalCommerceEventToMeta } from './mapCanonicalCommerceEventToMeta'

export function mapCanonicalAddPaymentInfoToMeta(
  event: CanonicalAddPaymentInfo
): ServerEvent {
  if (!event.page_url) {
    throw new Error('Meta AddPaymentInfo requires page_url')
  }
  return mapCanonicalCommerceEventToMeta(
    { ...event, page_url: event.page_url },
    'AddPaymentInfo',
    {
      checkout_id: event.custom_data.checkout_id,
      payment_revision: event.custom_data.payment_revision
    }
  )
}
