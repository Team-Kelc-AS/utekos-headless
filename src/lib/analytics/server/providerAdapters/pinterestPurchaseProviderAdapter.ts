import { canonicalPurchaseSchema } from '../../purchaseEvent'
import { createPinterestProviderAdapter } from '../createPinterestProviderAdapter'

export const pinterestPurchaseProviderAdapter =
  createPinterestProviderAdapter({
    eventName: 'purchase',
    key: 'pinterest:purchase',
    schema: canonicalPurchaseSchema
  })
