const CHECKOUT_SESSION_NAMESPACE =
  'commerce:checkout_session:v1'

const CHECKOUT_SESSION_INDEX_NAMESPACE =
  'commerce:checkout_session_index:v1'

export const CHECKOUT_SESSION_EVENT_STREAM_KEY =
  'commerce:checkout_events:v1'

function encodeKeyPart(
  value: string,
  fieldName: string
): string {
  const normalized = value.trim()

  if (normalized.length === 0) {
    throw new Error(
      `${fieldName} must not be empty`
    )
  }

  if (normalized.length > 2048) {
    throw new Error(
      `${fieldName} exceeds the maximum Redis key-part length`
    )
  }

  return encodeURIComponent(normalized)
}

/**
 * Primary materialized CheckoutSession record.
 *
 * One Shopify Cart maps to one CheckoutSession.
 * The session may contain multiple checkout attempts.
 */
export function checkoutSessionByCartTokenKey(
  cartToken: string
): string {
  return [
    CHECKOUT_SESSION_NAMESPACE,
    'cart',
    encodeKeyPart(cartToken, 'cartToken')
  ].join(':')
}

/**
 * session_id → cart_token
 *
 * Value stored at this key will be the raw cart token.
 */
export function checkoutSessionIdIndexKey(
  sessionId: string
): string {
  return [
    CHECKOUT_SESSION_INDEX_NAMESPACE,
    'session',
    encodeKeyPart(sessionId, 'sessionId')
  ].join(':')
}

/**
 * attempt_id → cart_token
 */
export function checkoutAttemptIndexKey(
  attemptId: string
): string {
  return [
    CHECKOUT_SESSION_INDEX_NAMESPACE,
    'attempt',
    encodeKeyPart(attemptId, 'attemptId')
  ].join(':')
}

/**
 * canonical begin_checkout event_id → cart_token
 */
export function checkoutBeginEventIndexKey(
  eventId: string
): string {
  return [
    CHECKOUT_SESSION_INDEX_NAMESPACE,
    'begin_checkout',
    encodeKeyPart(eventId, 'eventId')
  ].join(':')
}

/**
 * Shopify AbandonedCheckout GID → cart_token
 */
export function checkoutShopifyAbandonmentIndexKey(
  abandonedCheckoutId: string
): string {
  return [
    CHECKOUT_SESSION_INDEX_NAMESPACE,
    'shopify_abandoned_checkout',
    encodeKeyPart(
      abandonedCheckoutId,
      'abandonedCheckoutId'
    )
  ].join(':')
}

/**
 * Klarna order_id → cart_token
 */
export function checkoutKlarnaOrderIndexKey(
  klarnaOrderId: string
): string {
  return [
    CHECKOUT_SESSION_INDEX_NAMESPACE,
    'klarna_order',
    encodeKeyPart(
      klarnaOrderId,
      'klarnaOrderId'
    )
  ].join(':')
}

/**
 * Shopify Order GID → cart_token
 */
export function checkoutShopifyOrderIndexKey(
  shopifyOrderId: string
): string {
  return [
    CHECKOUT_SESSION_INDEX_NAMESPACE,
    'shopify_order',
    encodeKeyPart(
      shopifyOrderId,
      'shopifyOrderId'
    )
  ].join(':')
}