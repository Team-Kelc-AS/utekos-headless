import { randomUUID } from 'node:crypto'

import {
  checkoutSessionSchema,
  checkoutSessionShopifyCartSchema,
  type CheckoutSession,
  type CheckoutSessionEnvironment,
  type CheckoutSessionShopifyCart
} from './checkoutSessionSchema'

export const CHECKOUT_SESSION_TTL_SECONDS =
  60 * 60 * 24 * 14

type CreateCheckoutSessionInput = {
  environment: CheckoutSessionEnvironment
  shopifyCart: CheckoutSessionShopifyCart

  /**
   * Injectable for deterministic tests.
   */
  now?: () => Date

  /**
   * Injectable for deterministic tests.
   */
  sessionIdFactory?: () => string

  /**
   * Defaults to 14 days.
   *
   * This controls the semantic expires_at value.
   * The Redis store calculates the actual Redis TTL from expires_at.
   */
  ttlSeconds?: number
}

function validateTtlSeconds(value: number): number {
  if (
    !Number.isInteger(value) ||
    value <= 0
  ) {
    throw new Error(
      'Checkout session TTL must be a positive integer'
    )
  }

  return value
}

function validateCanonicalCartToken(
  cartToken: string
): void {
  if (
    cartToken.length === 0 ||
    cartToken !== cartToken.trim()
  ) {
    throw new Error(
      'Shopify cart token must be a canonical non-empty value'
    )
  }
}

export function createCheckoutSession(
  input: CreateCheckoutSessionInput
): CheckoutSession {
  const now = input.now ?? (() => new Date())
  const sessionIdFactory =
    input.sessionIdFactory ?? randomUUID

  const ttlSeconds = validateTtlSeconds(
    input.ttlSeconds ??
      CHECKOUT_SESSION_TTL_SECONDS
  )

  const observedAt = now()

  if (
    Number.isNaN(observedAt.getTime())
  ) {
    throw new Error(
      'Checkout session creation requires a valid timestamp'
    )
  }

  const shopifyCart =
    checkoutSessionShopifyCartSchema.parse(
      input.shopifyCart
    )

  validateCanonicalCartToken(
    shopifyCart.cart_token
  )

  const sessionId = sessionIdFactory()

  const observedAtIso =
    observedAt.toISOString()

  const expiresAtIso = new Date(
    observedAt.getTime() +
      ttlSeconds * 1000
  ).toISOString()

  return checkoutSessionSchema.parse({
    schema: 'utekos.checkout_session.v1',

    session_id: sessionId,

    revision: 0,

    environment: input.environment,

    state: 'active',

    shopify_cart: shopifyCart,

    checkout_attempts: [],

    active_attempt_id: null,

    conversion: null,

    private_customer: null,

    recovery: {
      status: 'inactive',
      preferred_target: null,
      public_recovery_id: null,
      last_evaluated_at: null,
      suppression_reason: null
    },

    first_seen_at: observedAtIso,

    last_seen_at: observedAtIso,

    expires_at: expiresAtIso
  })
}