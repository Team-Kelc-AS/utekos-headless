import type { CanonicalAddPaymentInfo } from '../addPaymentInfoEvent'
import { mapCanonicalCommerceEventToGoogleDataManager } from './mapCanonicalCommerceEventToGoogleDataManager'

export function mapCanonicalAddPaymentInfoToGoogleDataManager(
  event: CanonicalAddPaymentInfo
) {
  return mapCanonicalCommerceEventToGoogleDataManager(
    event,
    'add_payment_info'
  )
}
