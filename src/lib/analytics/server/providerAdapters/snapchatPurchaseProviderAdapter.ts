import { canonicalPurchaseSchema } from '../../purchaseEvent'
import { createSnapchatProviderAdapter } from '../createSnapchatProviderAdapter'

export const snapchatPurchaseProviderAdapter =
  createSnapchatProviderAdapter({
    eventName: 'purchase',
    key: 'snapchat:purchase',
    schema: canonicalPurchaseSchema
  })
