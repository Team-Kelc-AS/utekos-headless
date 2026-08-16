export const PINTEREST_CANONICAL_EVENT_MAP = {
  add_payment_info: {
    api: 'add_payment_info',
    tag: 'AddPaymentInfo'
  },
  add_to_cart: { api: 'add_to_cart', tag: 'AddToCart' },
  add_to_wishlist: {
    api: 'add_to_wishlist',
    tag: 'AddToWishList'
  },
  begin_checkout: {
    api: 'initiate_checkout',
    tag: 'InitiateCheckout'
  },
  generate_lead: { api: 'lead', tag: 'Lead' },
  purchase: { api: 'checkout', tag: 'Checkout' },
  search: { api: 'search', tag: 'Search' },
  view_category: { api: 'view_category', tag: 'ViewCategory' },
  view_item: { api: 'page_visit', tag: 'PageVisit' }
} as const

export type PinterestCanonicalEventName =
  keyof typeof PINTEREST_CANONICAL_EVENT_MAP

export type PinterestApiEventName =
  (typeof PINTEREST_CANONICAL_EVENT_MAP)[PinterestCanonicalEventName]['api']

export type PinterestTagEventName =
  (typeof PINTEREST_CANONICAL_EVENT_MAP)[PinterestCanonicalEventName]['tag']

export function isPinterestCanonicalEventName(
  eventName: string
): eventName is PinterestCanonicalEventName {
  return eventName in PINTEREST_CANONICAL_EVENT_MAP
}
