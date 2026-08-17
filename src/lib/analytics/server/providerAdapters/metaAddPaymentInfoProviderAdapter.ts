import { canonicalAddPaymentInfoSchema } from '../../addPaymentInfoEvent'
import { createMetaProviderAdapter } from '../createMetaProviderAdapter'
import { dispatchCanonicalAddPaymentInfoToMeta } from '../dispatchCanonicalAddPaymentInfoToMeta'

export const metaAddPaymentInfoProviderAdapter =
  createMetaProviderAdapter({
    dispatch: dispatchCanonicalAddPaymentInfoToMeta,
    eventName: 'add_payment_info',
    key: 'meta:add_payment_info',
    schema: canonicalAddPaymentInfoSchema
  })
