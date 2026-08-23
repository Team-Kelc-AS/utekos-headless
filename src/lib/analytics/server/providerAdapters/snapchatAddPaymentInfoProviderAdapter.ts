import { canonicalAddPaymentInfoSchema } from '../../addPaymentInfoEvent'
import { createSnapchatProviderAdapter } from '../createSnapchatProviderAdapter'

export const snapchatAddPaymentInfoProviderAdapter =
  createSnapchatProviderAdapter({
    eventName: 'add_payment_info',
    key: 'snapchat:add_payment_info',
    schema: canonicalAddPaymentInfoSchema
  })
