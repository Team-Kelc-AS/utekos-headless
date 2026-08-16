import { canonicalAddPaymentInfoSchema } from '../../addPaymentInfoEvent'
import { createPinterestProviderAdapter } from '../createPinterestProviderAdapter'

export const pinterestAddPaymentInfoProviderAdapter =
  createPinterestProviderAdapter({
    eventName: 'add_payment_info',
    key: 'pinterest:add_payment_info',
    schema: canonicalAddPaymentInfoSchema
  })
