import 'server-only'

import {
  createStorefrontBuyerContext
} from '@/api/shopify/storefront/createStorefrontBuyerContext'

import {
  fetchCart as fetchShopifyCart
} from '@/lib/helpers/cart/fetchCart'

import type {
  FetchCanonicalBeginCheckoutCart
} from './registerCanonicalBeginCheckoutAttempt'

export const fetchCanonicalBeginCheckoutCart: FetchCanonicalBeginCheckoutCart =
  async input => {
    const buyerContext =
      createStorefrontBuyerContext(
        input.requestHeaders
      )

    return fetchShopifyCart(
      buyerContext,
      input.fullCartId
    )
  }
