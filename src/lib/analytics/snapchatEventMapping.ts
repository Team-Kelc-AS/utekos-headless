export const SNAPCHAT_CANONICAL_EVENT_MAP = {
  page_view: 'PAGE_VIEW',
  view_item: 'VIEW_CONTENT',
  add_to_cart: 'ADD_CART',
  begin_checkout: 'START_CHECKOUT',
  add_payment_info: 'ADD_BILLING',
  purchase: 'PURCHASE'
} as const

export type SnapchatCanonicalEventName =
  keyof typeof SNAPCHAT_CANONICAL_EVENT_MAP

export type SnapchatEventName =
  (typeof SNAPCHAT_CANONICAL_EVENT_MAP)[SnapchatCanonicalEventName]

export function isSnapchatCanonicalEventName(
  eventName: string
): eventName is SnapchatCanonicalEventName {
  return eventName in SNAPCHAT_CANONICAL_EVENT_MAP
}
