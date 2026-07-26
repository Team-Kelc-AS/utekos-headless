import type { CanonicalViewCart } from '../viewCartEvent'
import { createCanonicalMetaDispatch } from './createCanonicalMetaDispatch'
import { mapCanonicalViewCartToMeta } from './mapCanonicalViewCartToMeta'

export const dispatchCanonicalViewCartToMeta =
  createCanonicalMetaDispatch<CanonicalViewCart, 'view_cart'>({
    eventName: 'view_cart',
    mapEvent: mapCanonicalViewCartToMeta
  })
