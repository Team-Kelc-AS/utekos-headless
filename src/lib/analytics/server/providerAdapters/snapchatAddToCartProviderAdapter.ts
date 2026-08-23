import { canonicalAddToCartSchema } from '../../addToCartEvent'
import { createSnapchatProviderAdapter } from '../createSnapchatProviderAdapter'

export const snapchatAddToCartProviderAdapter =
  createSnapchatProviderAdapter({
    eventName: 'add_to_cart',
    key: 'snapchat:add_to_cart',
    schema: canonicalAddToCartSchema
  })
