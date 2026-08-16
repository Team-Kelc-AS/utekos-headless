import { canonicalAddToWishlistSchema } from '../../addToWishlistEvent'
import { createPinterestProviderAdapter } from '../createPinterestProviderAdapter'

export const pinterestAddToWishlistProviderAdapter =
  createPinterestProviderAdapter({
    eventName: 'add_to_wishlist',
    key: 'pinterest:add_to_wishlist',
    schema: canonicalAddToWishlistSchema
  })
