import { canonicalAddPaymentInfoSchema } from '../../addPaymentInfoEvent'
import { createGoogleDataManagerProviderAdapter } from '../createGoogleDataManagerProviderAdapter'
import { dispatchCanonicalAddPaymentInfoToGoogleDataManager } from '../dispatchCanonicalAddPaymentInfoToGoogleDataManager'

export const googleDataManagerAddPaymentInfoProviderAdapter =
  createGoogleDataManagerProviderAdapter({
    dispatch:
      dispatchCanonicalAddPaymentInfoToGoogleDataManager,
    eventName: 'add_payment_info',
    key: 'google:add_payment_info',
    schema: canonicalAddPaymentInfoSchema
  })
