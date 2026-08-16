import { canonicalAddToCartSchema } from '../../addToCartEvent'
import { createPinterestProviderAdapter } from '../createPinterestProviderAdapter'

export const pinterestAddToCartProviderAdapter =
  createPinterestProviderAdapter({
    eventName: 'add_to_cart',
    key: 'pinterest:add_to_cart',
    schema: canonicalAddToCartSchema
  })
