import 'server-only'

import {
  createHash,
  randomUUID
} from 'node:crypto'

import {
  createStorefrontBuyerContext
} from '@/api/shopify/storefront/createStorefrontBuyerContext'

import {
  canonicalBeginCheckoutSchema,
  type CanonicalBeginCheckout
} from '@/lib/analytics/beginCheckoutEvent'

import {
  readCheckoutMethod,
  type CheckoutMethod
} from '@/lib/analytics/checkoutMethod'

import {
  parseShopifyCartId,
  parseShopifyPublicCartId
} from '@/lib/cart/parseShopifyCartId'

import {
  readCartIdCookie
} from '@/lib/cart/readCartIdCookie'

import {
  resolveShopifyCheckoutUrl
} from '@/lib/cart/resolveShopifyCheckoutUrl'

import {
  CHECKOUT_SESSION_TTL_SECONDS
} from './createCheckoutSession'

import {
  checkoutSessionSchema,
  type CheckoutAttempt,
  type CheckoutSession,
  type CheckoutSessionEnvironment
} from './checkoutSessionSchema'

import {
  createCheckoutSessionEvent
} from './checkoutSessionEvent'

import {
  redisCheckoutSessionEventStream,
  type CheckoutSessionEventStream
} from './checkoutSessionEventStream'

import {
  redisCheckoutSessionStore,
  type CheckoutSessionStore
} from './checkoutSessionStore'

import {
  materializeCheckoutSessionFromCart
} from './materializeCheckoutSessionFromCart'

import type {
  Cart
} from 'types/cart'

export const REGISTER_BEGIN_CHECKOUT_MAX_CAS_ATTEMPTS =
  5

export const CAPTURE_SHOPIFY_CHECKOUT_MAX_CAS_ATTEMPTS =
  5

export const ADVANCE_KLARNA_EXPRESS_MAX_CAS_ATTEMPTS =
  5

/**
 * This window is only used to correlate two server-side
 * observations that can race with each other:
 *
 * - route-first operational CheckoutAttempt
 * - canonical begin_checkout `after()` handoff
 *
 * It is NOT used as the lifetime of a normal canonical
 * CheckoutAttempt.
 */
export const SHOPIFY_CHECKOUT_CAPTURE_LINK_WINDOW_MS =
  2 * 60 * 1000

export const KLARNA_EXPRESS_CAPTURE_LINK_WINDOW_MS =
  2 * 60 * 1000

export type CanonicalBeginCheckoutAttemptStore =
  Pick<
    CheckoutSessionStore,
    'compareAndSet'
  >

export type CanonicalBeginCheckoutAttemptEventStream =
  Pick<
    CheckoutSessionEventStream,
    'append'
  >

export type MaterializeCheckoutSession =
  (input: {
    cart: Cart
    environment:
      CheckoutSessionEnvironment
  }) => Promise<{
    session: CheckoutSession
  }>

export type MaterializeCanonicalBeginCheckoutSession =
  MaterializeCheckoutSession

export type FetchCanonicalBeginCheckoutCart =
  (input: {
    requestHeaders: Headers
    fullCartId: string
  }) => Promise<Cart | null>

export type RegisterCanonicalBeginCheckoutAttemptDependencies = {
  readCartId?: () =>
    Promise<string | null>

  fetchCart?:
    FetchCanonicalBeginCheckoutCart

  materializeSession?:
    MaterializeCheckoutSession

  sessionStore?:
    CanonicalBeginCheckoutAttemptStore

  eventStream?:
    CanonicalBeginCheckoutAttemptEventStream

  now?: () => Date
}

export type CaptureShopifyCheckoutUrlDependencies = {
  materializeSession?:
    MaterializeCheckoutSession

  sessionStore?:
    CanonicalBeginCheckoutAttemptStore

  eventStream?:
    CanonicalBeginCheckoutAttemptEventStream

  now?: () => Date

  attemptIdFactory?: () => string
}

export type AdvanceKlarnaExpressAttemptDependencies = {
  materializeSession?:
    MaterializeCheckoutSession

  sessionStore?:
    CanonicalBeginCheckoutAttemptStore

  eventStream?:
    CanonicalBeginCheckoutAttemptEventStream

  now?: () => Date

  attemptIdFactory?: () => string
}

export type RegisterCanonicalBeginCheckoutAttemptResult =
  | {
      status:
        'registered'

      attempt_id:
        string

      session:
        CheckoutSession

      journal_status:
        | 'appended'
        | 'failed'
    }
  | {
      status:
        'duplicate'

      attempt_id:
        string

      session:
        CheckoutSession

      journal_status:
        'not_appended'
    }
  | {
      status:
        'cart_cookie_missing'

      journal_status:
        'not_appended'
    }
  | {
      status:
        'cart_identity_mismatch'

      journal_status:
        'not_appended'
    }
  | {
      status:
        'cart_unavailable'

      journal_status:
        'not_appended'
    }
  | {
      status:
        'session_inactive'

      journal_status:
        'not_appended'
    }

export type CaptureShopifyCheckoutUrlResult =
  | {
      status:
        'captured'

      attempt_id:
        string

      session:
        CheckoutSession

      checkout_url_fingerprint:
        string

      checkout_host:
        string

      operational_attempt_created:
        boolean

      journal_status:
        | 'appended'
        | 'failed'
    }
  | {
      status:
        'duplicate'

      attempt_id:
        string

      session:
        CheckoutSession

      checkout_url_fingerprint:
        string

      checkout_host:
        string

      operational_attempt_created:
        false

      journal_status:
        'not_appended'
    }
  | {
      status:
        'session_inactive'

      checkout_url_fingerprint:
        string

      checkout_host:
        string

      journal_status:
        'not_appended'
    }

export type KlarnaFraudStatus =
  | 'ACCEPTED'
  | 'PENDING'
  | 'REJECTED'

export type KlarnaExpressRegistryFailureCode =
  | 'klarna_order_creation_failed'
  | 'shopify_order_creation_failed'

type AdvanceKlarnaExpressAttemptBase = {
  cart: Cart

  environment:
    CheckoutSessionEnvironment

  /**
   * SHA-256 fingerprint only.
   *
   * Raw Klarna authorization_token must never cross
   * into Registry persistence.
   */
  authorizationTokenFingerprint:
    string

  /**
   * We persist only the fact that Klarna returned usable
   * shipping-address material, never the address itself.
   */
  shippingAddressCollected:
    boolean
}

export type AdvanceKlarnaExpressAttemptInput =
  AdvanceKlarnaExpressAttemptBase &
    (
      | {
          stage:
            'authorizing'
        }
      | {
          stage:
            'authorized'
        }
      | {
          stage:
            'order_creating'
        }
      | {
          stage:
            'order_created'

          klarnaOrderId:
            string

          fraudStatus:
            KlarnaFraudStatus | null

          /**
           * Private provider continuation URL.
           * Redis Registry only.
           */
          privateRedirectUrl:
            string
        }
      | {
          stage:
            'shopify_order_created'

          klarnaOrderId:
            string

          shopifyOrderId:
            string
        }
      | {
          stage:
            'failed'

          failureCode:
            KlarnaExpressRegistryFailureCode

          klarnaOrderId?:
            string
        }
    )

export type AdvanceKlarnaExpressAttemptResult =
  | {
      status:
        'advanced'

      attempt_id:
        string

      session:
        CheckoutSession

      operational_attempt_created:
        boolean

      journal_status:
        | 'appended'
        | 'failed'
        | 'not_appended'
    }
  | {
      status:
        'duplicate'

      attempt_id:
        string

      session:
        CheckoutSession

      operational_attempt_created:
        false

      journal_status:
        'not_appended'
    }
  | {
      status:
        'attempt_terminal'

      attempt_id:
        string

      session:
        CheckoutSession

      journal_status:
        'not_appended'
    }
  | {
      status:
        'session_inactive'

      journal_status:
        'not_appended'
    }

export class CheckoutSessionAttemptConflictError
  extends Error
{
  override readonly name =
    'CheckoutSessionAttemptConflictError'
}

type KlarnaLifecycleJournalEvent =
  | {
      eventType:
        'klarna_express.authorizing'

      source:
        'klarna_orders_api'
    }
  | {
      eventType:
        'klarna_express.authorized'

      source:
        'klarna_orders_api'
    }
  | {
      eventType:
        'klarna_express.order_created'

      source:
        'klarna_orders_api'
    }
  | {
      eventType:
        'klarna_express.failed'

      source:
        'klarna_orders_api'
    }
  | {
      eventType:
        'shopify_order.created'

      source:
        'shopify_admin_graphql'
    }

type ApplyKlarnaStageResult =
  | {
      status:
        'changed'

      attempt:
        CheckoutAttempt

      journal:
        KlarnaLifecycleJournalEvent | null
    }
  | {
      status:
        'unchanged'

      attempt:
        CheckoutAttempt
    }
  | {
      status:
        'terminal'

      attempt:
        CheckoutAttempt
    }

async function parseCanonicalRequest(
  request: Request
): Promise<{
  event: CanonicalBeginCheckout
  checkoutMethod: CheckoutMethod
}> {
  const rawBody =
    await request.text()

  let payload: unknown

  try {
    payload =
      JSON.parse(rawBody)
  } catch {
    throw new Error(
      'Canonical begin_checkout Registry handoff received invalid JSON'
    )
  }

  return {
    event:
      canonicalBeginCheckoutSchema.parse(
        payload
      ),

    checkoutMethod:
      readCheckoutMethod(
        request.headers
      )
  }
}

async function defaultFetchCart(
  input: {
    requestHeaders: Headers
    fullCartId: string
  }
): Promise<Cart | null> {
  /**
   * Deliberately lazy.
   *
   * Unit tests exercise this Registry module under
   * Node's react-server condition and inject their own
   * Storefront Cart reader. Do not eagerly instantiate
   * Hydrogen just by importing the Registry service.
   */
  const {
    fetchCart: fetchShopifyCart
  } =
    await import(
      '@/lib/helpers/cart/fetchCart'
    )

  const buyerContext =
    createStorefrontBuyerContext(
      input.requestHeaders
    )

  return fetchShopifyCart(
    buyerContext,
    input.fullCartId
  )
}

async function defaultMaterializeSession(
  input: {
    cart: Cart
    environment:
      CheckoutSessionEnvironment
  }
): Promise<{
  session: CheckoutSession
}> {
  const result =
    await materializeCheckoutSessionFromCart(
      input
    )

  return {
    session:
      result.session
  }
}

function parseTimestamp(
  value: string,
  fieldName: string
): number {
  const timestamp =
    Date.parse(value)

  if (
    Number.isNaN(timestamp)
  ) {
    throw new Error(
      `${fieldName} contains an invalid timestamp`
    )
  }

  return timestamp
}

function laterTimestamp(
  left: string,
  right: string
): string {
  return (
    parseTimestamp(
      left,
      'left timestamp'
    ) >=
    parseTimestamp(
      right,
      'right timestamp'
    )
  ) ?
      left
    : right
}

function earlierTimestamp(
  left: string,
  right: string
): string {
  return (
    parseTimestamp(
      left,
      'left timestamp'
    ) <=
    parseTimestamp(
      right,
      'right timestamp'
    )
  ) ?
      left
    : right
}

function refreshSessionActivity(
  current: CheckoutSession,
  activityAt: string
): {
  lastSeenAt: string
  expiresAt: string
} {
  const lastSeenAt =
    laterTimestamp(
      current.last_seen_at,
      activityAt
    )

  const semanticExpiresAt =
    new Date(
      parseTimestamp(
        lastSeenAt,
        'Checkout Session last_seen_at'
      ) +
        CHECKOUT_SESSION_TTL_SECONDS *
          1000
    ).toISOString()

  return {
    lastSeenAt,

    expiresAt:
      laterTimestamp(
        current.expires_at,
        semanticExpiresAt
      )
  }
}

function createInitialAttempt(
  input: {
    event: CanonicalBeginCheckout
    checkoutMethod: CheckoutMethod
    observedAt: string
  }
): CheckoutAttempt {
  const startedAt =
    input.event.event_time

  const lastUpdatedAt =
    laterTimestamp(
      startedAt,
      input.observedAt
    )

  if (
    input.checkoutMethod ===
    'shopify_checkout'
  ) {
    return {
      attempt_id:
        input.event.event_id,

      begin_checkout_event_id:
        input.event.event_id,

      method:
        'shopify_checkout',

      started_at:
        startedAt,

      last_updated_at:
        lastUpdatedAt,

      milestones: {
        began_at:
          startedAt,

        shipping_info_submitted_at:
          null,

        payment_info_submitted_at:
          null,

        completed_at:
          null
      },

      shopify: {
        status:
          'unresolved',

        checkout_token:
          null,

        private_checkout_url:
          null,

        checkout_url_fingerprint:
          null,

        abandoned_checkout_id:
          null,

        private_abandoned_checkout_url:
          null,

        abandoned_checkout_created_at:
          null,

        abandoned_checkout_updated_at:
          null,

        most_recent_step:
          null,

        inventory_available:
          null,

        native_email_state:
          null,

        customer_has_no_order_since_abandonment:
          null,

        customer_has_no_draft_order_since_abandonment:
          null
      },

      klarna:
        null
    }
  }

  return {
    attempt_id:
      input.event.event_id,

    begin_checkout_event_id:
      input.event.event_id,

    method:
      'klarna_express',

    started_at:
      startedAt,

    last_updated_at:
      lastUpdatedAt,

    milestones: {
      began_at:
        startedAt,

      shipping_info_submitted_at:
        null,

      payment_info_submitted_at:
        null,

      completed_at:
        null
    },

    shopify:
      null,

    klarna: {
      status:
        'started',

      authorization_token_fingerprint:
        null,

      klarna_order_id:
        null,

      fraud_status:
        null,

      shopify_draft_order_id:
        null,

      shopify_order_id:
        null,

      private_redirect_url:
        null,

      shipping_address_collected_at:
        null,

      authorization_completed_at:
        null,

      order_created_at:
        null,

      failed_at:
        null,

      failure_code:
        null
    }
  }
}

function createOperationalShopifyAttempt(
  input: {
    attemptId: string
    observedAt: string
    privateCheckoutUrl: string
    checkoutUrlFingerprint: string
  }
): CheckoutAttempt {
  return {
    attempt_id:
      input.attemptId,

    begin_checkout_event_id:
      null,

    method:
      'shopify_checkout',

    started_at:
      input.observedAt,

    last_updated_at:
      input.observedAt,

    milestones: {
      began_at:
        input.observedAt,

      shipping_info_submitted_at:
        null,

      payment_info_submitted_at:
        null,

      completed_at:
        null
    },

    shopify: {
      status:
        'checkout_url_resolved',

      checkout_token:
        null,

      private_checkout_url:
        input.privateCheckoutUrl,

      checkout_url_fingerprint:
        input.checkoutUrlFingerprint,

      abandoned_checkout_id:
        null,

      private_abandoned_checkout_url:
        null,

      abandoned_checkout_created_at:
        null,

      abandoned_checkout_updated_at:
        null,

      most_recent_step:
        null,

      inventory_available:
        null,

      native_email_state:
        null,

      customer_has_no_order_since_abandonment:
        null,

      customer_has_no_draft_order_since_abandonment:
        null
    },

    klarna:
      null
  }
}

function createOperationalKlarnaAttempt(
  input: {
    attemptId: string
    observedAt: string
  }
): CheckoutAttempt {
  return {
    attempt_id:
      input.attemptId,

    begin_checkout_event_id:
      null,

    method:
      'klarna_express',

    started_at:
      input.observedAt,

    last_updated_at:
      input.observedAt,

    milestones: {
      began_at:
        input.observedAt,

      shipping_info_submitted_at:
        null,

      payment_info_submitted_at:
        null,

      completed_at:
        null
    },

    shopify:
      null,

    klarna: {
      status:
        'started',

      authorization_token_fingerprint:
        null,

      klarna_order_id:
        null,

      fraud_status:
        null,

      shopify_draft_order_id:
        null,

      shopify_order_id:
        null,

      private_redirect_url:
        null,

      shipping_address_collected_at:
        null,

      authorization_completed_at:
        null,

      order_created_at:
        null,

      failed_at:
        null,

      failure_code:
        null
    }
  }
}

function findExistingAttempt(
  session: CheckoutSession,
  eventId: string
): CheckoutAttempt | null {
  const byCanonicalEvent =
    session.checkout_attempts.find(
      attempt =>
        attempt
          .begin_checkout_event_id ===
        eventId
    )

  const byAttemptId =
    session.checkout_attempts.find(
      attempt =>
        attempt.attempt_id ===
        eventId
    )

  if (
    byCanonicalEvent &&
    byAttemptId &&
    byCanonicalEvent.attempt_id !==
      byAttemptId.attempt_id
  ) {
    throw new CheckoutSessionAttemptConflictError(
      'Canonical begin_checkout event identity collides with multiple CheckoutAttempts'
    )
  }

  return (
    byCanonicalEvent ??
    byAttemptId ??
    null
  )
}

function assertExistingAttemptMatches(
  input: {
    attempt: CheckoutAttempt
    event: CanonicalBeginCheckout
    checkoutMethod: CheckoutMethod
  }
): void {
  if (
    input.attempt
      .begin_checkout_event_id !==
    input.event.event_id
  ) {
    throw new CheckoutSessionAttemptConflictError(
      'CheckoutAttempt identity is already owned by another canonical begin_checkout event'
    )
  }

  if (
    input.attempt.method !==
    input.checkoutMethod
  ) {
    throw new CheckoutSessionAttemptConflictError(
      'Canonical begin_checkout retry changed checkout_method'
    )
  }
}

function findActiveAttempt(
  session: CheckoutSession
): CheckoutAttempt | null {
  if (
    !session.active_attempt_id
  ) {
    return null
  }

  return (
    session.checkout_attempts.find(
      attempt =>
        attempt.attempt_id ===
        session.active_attempt_id
    ) ??
    null
  )
}

function isWithinCorrelationWindow(
  timestamp: string,
  observedAt: Date,
  windowMs: number
): boolean {
  const timestampMs =
    parseTimestamp(
      timestamp,
      'CheckoutAttempt last_updated_at'
    )

  return (
    Math.abs(
      timestampMs -
        observedAt.getTime()
    ) <=
    windowMs
  )
}

function findPromotableOperationalShopifyAttempt(
  input: {
    session: CheckoutSession
    observedAt: Date
  }
): CheckoutAttempt | null {
  const active =
    findActiveAttempt(
      input.session
    )

  if (
    !active ||
    active.method !==
      'shopify_checkout' ||
    active.begin_checkout_event_id !==
      null ||
    !active.shopify ||
    active.milestones.completed_at !==
      null
  ) {
    return null
  }

  if (
    active.shopify.status !==
      'checkout_url_resolved' &&
    active.shopify.status !==
      'checkout_active'
  ) {
    return null
  }

  if (
    !active.shopify
      .private_checkout_url ||
    !active.shopify
      .checkout_url_fingerprint
  ) {
    return null
  }

  if (
    !isWithinCorrelationWindow(
      active.last_updated_at,
      input.observedAt,
      SHOPIFY_CHECKOUT_CAPTURE_LINK_WINDOW_MS
    )
  ) {
    return null
  }

  return active
}

function findPromotableOperationalKlarnaAttempt(
  input: {
    session: CheckoutSession
    observedAt: Date
  }
): CheckoutAttempt | null {
  const active =
    findActiveAttempt(
      input.session
    )

  if (
    !active ||
    active.method !==
      'klarna_express' ||
    active.begin_checkout_event_id !==
      null ||
    !active.klarna ||
    active.milestones.completed_at !==
      null
  ) {
    return null
  }

  if (
    active.klarna.status ===
      'completed' ||
    active.klarna.status ===
      'cancelled'
  ) {
    return null
  }

  /**
   * Strong server-side evidence that this attempt was
   * created by the Klarna authorization/order handoff.
   */
  if (
    !active.klarna
      .authorization_token_fingerprint
  ) {
    return null
  }

  if (
    !isWithinCorrelationWindow(
      active.last_updated_at,
      input.observedAt,
      KLARNA_EXPRESS_CAPTURE_LINK_WINDOW_MS
    )
  ) {
    return null
  }

  return active
}

function findAttachableShopifyAttempt(
  input: {
    session: CheckoutSession
    observedAt: Date
  }
): CheckoutAttempt | null {
  const active =
    findActiveAttempt(
      input.session
    )

  if (
    !active ||
    active.method !==
      'shopify_checkout' ||
    !active.shopify ||
    active.milestones.completed_at !==
      null
  ) {
    return null
  }

  if (
    active.shopify.status !==
      'unresolved' &&
    active.shopify.status !==
      'checkout_url_resolved' &&
    active.shopify.status !==
      'checkout_active'
  ) {
    return null
  }

  if (
    !isWithinCorrelationWindow(
      active.last_updated_at,
      input.observedAt,
      SHOPIFY_CHECKOUT_CAPTURE_LINK_WINDOW_MS
    )
  ) {
    return null
  }

  return active
}

function createNextSessionWithCanonicalAttempt(
  input: {
    current: CheckoutSession
    event: CanonicalBeginCheckout
    checkoutMethod: CheckoutMethod
    observedAt: string
  }
): CheckoutSession {
  const attempt =
    createInitialAttempt({
      event:
        input.event,

      checkoutMethod:
        input.checkoutMethod,

      observedAt:
        input.observedAt
    })

  const activity =
    refreshSessionActivity(
      input.current,
      laterTimestamp(
        input.event.event_time,
        input.observedAt
      )
    )

  return checkoutSessionSchema.parse({
    ...input.current,

    revision:
      input.current.revision + 1,

    checkout_attempts: [
      ...input.current
        .checkout_attempts,

      attempt
    ],

    active_attempt_id:
      attempt.attempt_id,

    last_seen_at:
      activity.lastSeenAt,

    expires_at:
      activity.expiresAt
  })
}

function createPromotedOperationalSession(
  input: {
    current: CheckoutSession
    attempt: CheckoutAttempt
    event: CanonicalBeginCheckout
    observedAt: string
  }
): CheckoutSession {
  const startedAt =
    earlierTimestamp(
      input.attempt.started_at,
      input.event.event_time
    )

  const lastUpdatedAt =
    laterTimestamp(
      input.attempt.last_updated_at,
      input.observedAt
    )

  const checkoutAttempts =
    input.current
      .checkout_attempts
      .map(attempt => {
        if (
          attempt.attempt_id !==
          input.attempt.attempt_id
        ) {
          return attempt
        }

        return {
          ...attempt,

          /**
           * Operational attempt_id remains stable because
           * a Redis secondary index may already exist for it.
           */
          begin_checkout_event_id:
            input.event.event_id,

          started_at:
            startedAt,

          last_updated_at:
            lastUpdatedAt,

          milestones: {
            ...attempt.milestones,

            began_at:
              startedAt
          }
        }
      })

  const activity =
    refreshSessionActivity(
      input.current,
      lastUpdatedAt
    )

  return checkoutSessionSchema.parse({
    ...input.current,

    revision:
      input.current.revision + 1,

    checkout_attempts:
      checkoutAttempts,

    active_attempt_id:
      input.attempt.attempt_id,

    last_seen_at:
      activity.lastSeenAt,

    expires_at:
      activity.expiresAt
  })
}

function inspectPrivateCheckoutUrl(
  checkoutUrl: URL
): {
  privateCheckoutUrl: string
  checkoutUrlFingerprint: string
  checkoutHost: string
} {
  const resolved =
    resolveShopifyCheckoutUrl(
      checkoutUrl.href,
      process.env.STORE_DOMAIN
    )

  if (!resolved) {
    throw new Error(
      'Checkout Session Registry refused an invalid Shopify checkout URL'
    )
  }

  const privateCheckoutUrl =
    resolved.href

  const digest =
    createHash('sha256')
      .update(
        privateCheckoutUrl,
        'utf8'
      )
      .digest('hex')

  return {
    privateCheckoutUrl,

    checkoutUrlFingerprint:
      `sha256:${digest}`,

    checkoutHost:
      resolved.hostname
        .toLowerCase()
  }
}

function hasExactCapturedUrl(
  attempt: CheckoutAttempt,
  privateCheckoutUrl: string,
  checkoutUrlFingerprint: string
): boolean {
  return (
    attempt.method ===
      'shopify_checkout' &&
    attempt.shopify !== null &&
    attempt.shopify
      .private_checkout_url ===
      privateCheckoutUrl &&
    attempt.shopify
      .checkout_url_fingerprint ===
      checkoutUrlFingerprint
  )
}

function canAttachCapturedUrl(
  attempt: CheckoutAttempt,
  privateCheckoutUrl: string,
  checkoutUrlFingerprint: string
): boolean {
  if (
    attempt.method !==
      'shopify_checkout' ||
    !attempt.shopify
  ) {
    return false
  }

  const existingUrl =
    attempt.shopify
      .private_checkout_url

  const existingFingerprint =
    attempt.shopify
      .checkout_url_fingerprint

  if (
    existingUrl === null &&
    existingFingerprint === null
  ) {
    return true
  }

  if (
    existingUrl ===
      privateCheckoutUrl &&
    (
      existingFingerprint ===
        null ||
      existingFingerprint ===
        checkoutUrlFingerprint
    )
  ) {
    return true
  }

  if (
    existingUrl === null &&
    existingFingerprint ===
      checkoutUrlFingerprint
  ) {
    return true
  }

  return false
}

function attachCheckoutUrlToAttempt(
  input: {
    current: CheckoutSession
    attempt: CheckoutAttempt
    privateCheckoutUrl: string
    checkoutUrlFingerprint: string
    observedAt: string
  }
): CheckoutSession {
  const checkoutAttempts =
    input.current
      .checkout_attempts
      .map(attempt => {
        if (
          attempt.attempt_id !==
          input.attempt.attempt_id
        ) {
          return attempt
        }

        if (
          !attempt.shopify
        ) {
          throw new Error(
            'Cannot attach a Shopify checkout URL to a non-Shopify attempt'
          )
        }

        return {
          ...attempt,

          last_updated_at:
            laterTimestamp(
              attempt.last_updated_at,
              input.observedAt
            ),

          shopify: {
            ...attempt.shopify,

            status:
              attempt.shopify
                .status ===
                'checkout_active' ?
                'checkout_active'
              : 'checkout_url_resolved',

            private_checkout_url:
              input.privateCheckoutUrl,

            checkout_url_fingerprint:
              input.checkoutUrlFingerprint
          }
        }
      })

  const activity =
    refreshSessionActivity(
      input.current,
      input.observedAt
    )

  return checkoutSessionSchema.parse({
    ...input.current,

    revision:
      input.current.revision + 1,

    checkout_attempts:
      checkoutAttempts,

    active_attempt_id:
      input.attempt.attempt_id,

    last_seen_at:
      activity.lastSeenAt,

    expires_at:
      activity.expiresAt
  })
}

function addOperationalCheckoutAttempt(
  input: {
    current: CheckoutSession
    attemptId: string
    observedAt: string
    privateCheckoutUrl: string
    checkoutUrlFingerprint: string
  }
): CheckoutSession {
  const attempt =
    createOperationalShopifyAttempt({
      attemptId:
        input.attemptId,

      observedAt:
        input.observedAt,

      privateCheckoutUrl:
        input.privateCheckoutUrl,

      checkoutUrlFingerprint:
        input.checkoutUrlFingerprint
    })

  const activity =
    refreshSessionActivity(
      input.current,
      input.observedAt
    )

  return checkoutSessionSchema.parse({
    ...input.current,

    revision:
      input.current.revision + 1,

    checkout_attempts: [
      ...input.current
        .checkout_attempts,

      attempt
    ],

    active_attempt_id:
      attempt.attempt_id,

    last_seen_at:
      activity.lastSeenAt,

    expires_at:
      activity.expiresAt
  })
}

export function fingerprintKlarnaAuthorizationToken(
  authorizationToken: string
): string {
  const normalized =
    authorizationToken.trim()

  if (!normalized) {
    throw new Error(
      'Klarna authorization token cannot be empty'
    )
  }

  return `sha256:${
    createHash('sha256')
      .update(
        normalized,
        'utf8'
      )
      .digest('hex')
  }`
}

function assertKlarnaAuthorizationFingerprint(
  value: string
): void {
  if (
    !/^sha256:[a-f0-9]{64}$/.test(
      value
    )
  ) {
    throw new Error(
      'Klarna authorization token fingerprint must be SHA-256'
    )
  }
}

function assertNonEmptyProviderId(
  value: string,
  fieldName: string
): void {
  if (
    value.trim().length ===
    0
  ) {
    throw new Error(
      `${fieldName} cannot be empty`
    )
  }
}

function assertPrivateKlarnaRedirectUrl(
  value: string
): void {
  let parsed: URL

  try {
    parsed =
      new URL(value)
  } catch {
    throw new Error(
      'Klarna redirect URL is invalid'
    )
  }

  if (
    parsed.protocol !==
      'https:' ||
    parsed.username !==
      '' ||
    parsed.password !==
      ''
  ) {
    throw new Error(
      'Klarna redirect URL must be an HTTPS provider URL'
    )
  }
}

function isKlarnaTerminalStatus(
  status:
    NonNullable<
      CheckoutAttempt['klarna']
    >['status']
): boolean {
  return (
    status ===
      'completed' ||
    status ===
      'cancelled' ||
    status ===
      'failed'
  )
}

function getKlarnaProgressRank(
  status:
    NonNullable<
      CheckoutAttempt['klarna']
    >['status']
): number | null {
  switch (status) {
    case 'started':
      return 0

    case 'authorizing':
      return 1

    case 'authorized':
      return 2

    case 'order_creating':
      return 3

    case 'order_created':
      return 4

    default:
      return null
  }
}

function findKlarnaAttemptByFingerprint(
  session: CheckoutSession,
  fingerprint: string
): CheckoutAttempt | null {
  const matches =
    session
      .checkout_attempts
      .filter(
        attempt =>
          attempt.method ===
            'klarna_express' &&
          attempt.klarna
            ?.authorization_token_fingerprint ===
            fingerprint
      )

  if (
    matches.length >
    1
  ) {
    throw new CheckoutSessionAttemptConflictError(
      'Multiple Klarna CheckoutAttempts share one authorization fingerprint'
    )
  }

  return (
    matches[0] ??
    null
  )
}

function findAttachableKlarnaAttempt(
  input: {
    session: CheckoutSession
    fingerprint: string
    observedAt: Date
  }
): CheckoutAttempt | null {
  const byFingerprint =
    findKlarnaAttemptByFingerprint(
      input.session,
      input.fingerprint
    )

  if (byFingerprint) {
    return byFingerprint
  }

  const active =
    findActiveAttempt(
      input.session
    )

  if (
    !active ||
    active.method !==
      'klarna_express' ||
    !active.klarna ||
    active.milestones.completed_at !==
      null
  ) {
    return null
  }

  if (
    active.klarna
      .authorization_token_fingerprint !==
      null
  ) {
    return null
  }

  if (
    isKlarnaTerminalStatus(
      active.klarna.status
    )
  ) {
    return null
  }

  /**
   * A canonical active Klarna attempt is already an
   * explicit user checkout intent. Authorization can
   * legitimately take more than two minutes, so do not
   * impose the route-race window here.
   */
  if (
    active.begin_checkout_event_id !==
    null
  ) {
    return active
  }

  /**
   * An unlinked operational attempt is correlated only
   * inside the narrow server race window.
   */
  if (
    !isWithinCorrelationWindow(
      active.last_updated_at,
      input.observedAt,
      KLARNA_EXPRESS_CAPTURE_LINK_WINDOW_MS
    )
  ) {
    return null
  }

  return active
}

function applyKlarnaStage(
  input: {
    attempt: CheckoutAttempt
    transition:
      AdvanceKlarnaExpressAttemptInput
    observedAt: string
  }
): ApplyKlarnaStageResult {
  const current =
    input.attempt

  if (
    current.method !==
      'klarna_express' ||
    !current.klarna
  ) {
    throw new CheckoutSessionAttemptConflictError(
      'Klarna lifecycle cannot update a non-Klarna CheckoutAttempt'
    )
  }

  const klarna =
    current.klarna

  const existingFingerprint =
    klarna
      .authorization_token_fingerprint

  if (
    existingFingerprint !==
      null &&
    existingFingerprint !==
      input.transition
        .authorizationTokenFingerprint
  ) {
    throw new CheckoutSessionAttemptConflictError(
      'Klarna CheckoutAttempt is already bound to another authorization fingerprint'
    )
  }

  if (
    isKlarnaTerminalStatus(
      klarna.status
    )
  ) {
    if (
      input.transition.stage ===
        'failed' &&
      klarna.status ===
        'failed' &&
      klarna.failure_code ===
        input.transition
          .failureCode
    ) {
      return {
        status:
          'unchanged',

        attempt:
          current
      }
    }

    return {
      status:
        'terminal',

      attempt:
        current
    }
  }

  const original =
    JSON.stringify(
      klarna
    )

  const nextKlarna = {
    ...klarna,

    authorization_token_fingerprint:
      input.transition
        .authorizationTokenFingerprint
  }

  if (
    input.transition
      .shippingAddressCollected &&
    nextKlarna
      .shipping_address_collected_at ===
      null
  ) {
    nextKlarna
      .shipping_address_collected_at =
      input.observedAt
  }

  let journal:
    KlarnaLifecycleJournalEvent | null =
    null

  const currentRank =
    getKlarnaProgressRank(
      klarna.status
    )

  switch (
    input.transition.stage
  ) {
    case 'authorizing': {
      if (
        currentRank !==
          null &&
        currentRank <
          1
      ) {
        nextKlarna.status =
          'authorizing'

        journal = {
          eventType:
            'klarna_express.authorizing',

          source:
            'klarna_orders_api'
        }
      }

      break
    }

    case 'authorized': {
      if (
        currentRank !==
          null &&
        currentRank <
          2
      ) {
        nextKlarna.status =
          'authorized'

        journal = {
          eventType:
            'klarna_express.authorized',

          source:
            'klarna_orders_api'
        }
      }

      if (
        nextKlarna
          .authorization_completed_at ===
        null
      ) {
        nextKlarna
          .authorization_completed_at =
          input.observedAt
      }

      break
    }

    case 'order_creating': {
      if (
        currentRank !==
          null &&
        currentRank <
          3
      ) {
        nextKlarna.status =
          'order_creating'
      }

      if (
        nextKlarna
          .authorization_completed_at ===
        null
      ) {
        nextKlarna
          .authorization_completed_at =
          input.observedAt
      }

      break
    }

    case 'order_created': {
      assertNonEmptyProviderId(
        input.transition
          .klarnaOrderId,
        'Klarna order ID'
      )

      assertPrivateKlarnaRedirectUrl(
        input.transition
          .privateRedirectUrl
      )

      if (
        nextKlarna
          .klarna_order_id !==
          null &&
        nextKlarna
          .klarna_order_id !==
          input.transition
            .klarnaOrderId
      ) {
        throw new CheckoutSessionAttemptConflictError(
          'Klarna CheckoutAttempt is already bound to another Klarna order'
        )
      }

      if (
        nextKlarna
          .private_redirect_url !==
          null &&
        nextKlarna
          .private_redirect_url !==
          input.transition
            .privateRedirectUrl
      ) {
        throw new CheckoutSessionAttemptConflictError(
          'Klarna CheckoutAttempt is already bound to another private redirect URL'
        )
      }

      const wasOrderCreated =
        nextKlarna
          .klarna_order_id ===
          input.transition
            .klarnaOrderId &&
        nextKlarna
          .private_redirect_url ===
          input.transition
            .privateRedirectUrl &&
        nextKlarna.status ===
          'order_created'

      nextKlarna.status =
        'order_created'

      nextKlarna.klarna_order_id =
        input.transition
          .klarnaOrderId

      nextKlarna.fraud_status =
        input.transition
          .fraudStatus

      nextKlarna.private_redirect_url =
        input.transition
          .privateRedirectUrl

      nextKlarna
        .authorization_completed_at ??=
        input.observedAt

      nextKlarna.order_created_at ??=
        input.observedAt

      if (
        !wasOrderCreated
      ) {
        journal = {
          eventType:
            'klarna_express.order_created',

          source:
            'klarna_orders_api'
        }
      }

      break
    }

    case 'shopify_order_created': {
      assertNonEmptyProviderId(
        input.transition
          .klarnaOrderId,
        'Klarna order ID'
      )

      assertNonEmptyProviderId(
        input.transition
          .shopifyOrderId,
        'Shopify order ID'
      )

      if (
        nextKlarna
          .klarna_order_id !==
          null &&
        nextKlarna
          .klarna_order_id !==
          input.transition
            .klarnaOrderId
      ) {
        throw new CheckoutSessionAttemptConflictError(
          'Klarna CheckoutAttempt cannot attach a Shopify order from another Klarna order'
        )
      }

      if (
        nextKlarna
          .shopify_order_id !==
          null &&
        nextKlarna
          .shopify_order_id !==
          input.transition
            .shopifyOrderId
      ) {
        throw new CheckoutSessionAttemptConflictError(
          'Klarna CheckoutAttempt is already bound to another Shopify order'
        )
      }

      const alreadyAttached =
        nextKlarna
          .shopify_order_id ===
        input.transition
          .shopifyOrderId

      nextKlarna.status =
        'order_created'

      nextKlarna.klarna_order_id =
        input.transition
          .klarnaOrderId

      nextKlarna.shopify_order_id =
        input.transition
          .shopifyOrderId

      nextKlarna
        .authorization_completed_at ??=
        input.observedAt

      nextKlarna.order_created_at ??=
        input.observedAt

      if (
        !alreadyAttached
      ) {
        journal = {
          eventType:
            'shopify_order.created',

          source:
            'shopify_admin_graphql'
        }
      }

      break
    }

    case 'failed': {
      if (
        input.transition
          .klarnaOrderId
      ) {
        assertNonEmptyProviderId(
          input.transition
            .klarnaOrderId,
          'Klarna order ID'
        )

        if (
          nextKlarna
            .klarna_order_id !==
            null &&
          nextKlarna
            .klarna_order_id !==
            input.transition
              .klarnaOrderId
        ) {
          throw new CheckoutSessionAttemptConflictError(
            'Klarna failure references another Klarna order'
          )
        }

        nextKlarna.klarna_order_id =
          input.transition
            .klarnaOrderId
      }

      nextKlarna.status =
        'failed'

      nextKlarna.failed_at =
        input.observedAt

      nextKlarna.failure_code =
        input.transition
          .failureCode

      journal = {
        eventType:
          'klarna_express.failed',

        source:
          'klarna_orders_api'
      }

      break
    }
  }

  if (
    JSON.stringify(
      nextKlarna
    ) ===
    original
  ) {
    return {
      status:
        'unchanged',

      attempt:
        current
    }
  }

  return {
    status:
      'changed',

    attempt: {
      ...current,

      last_updated_at:
        laterTimestamp(
          current.last_updated_at,
          input.observedAt
        ),

      klarna:
        nextKlarna
    },

    journal
  }
}

function createSessionWithKlarnaAttempt(
  input: {
    current: CheckoutSession
    previousAttemptId: string | null
    nextAttempt: CheckoutAttempt
    observedAt: string
  }
): CheckoutSession {
  const checkoutAttempts =
    input.previousAttemptId ?
      input.current
        .checkout_attempts
        .map(attempt =>
          attempt.attempt_id ===
          input.previousAttemptId ?
            input.nextAttempt
          : attempt
        )
    : [
        ...input.current
          .checkout_attempts,

        input.nextAttempt
      ]

  const activity =
    refreshSessionActivity(
      input.current,
      input.observedAt
    )

  return checkoutSessionSchema.parse({
    ...input.current,

    revision:
      input.current.revision + 1,

    checkout_attempts:
      checkoutAttempts,

    active_attempt_id:
      input.nextAttempt
        .attempt_id,

    last_seen_at:
      activity.lastSeenAt,

    expires_at:
      activity.expiresAt
  })
}

async function appendAttemptStartedEvent(
  input: {
    eventStream:
      CanonicalBeginCheckoutAttemptEventStream

    session:
      CheckoutSession

    canonicalEvent:
      CanonicalBeginCheckout

    checkoutMethod:
      CheckoutMethod

    observedAt: Date

    canonicalPromotion:
      boolean
  }
): Promise<
  'appended' | 'failed'
> {
  try {
    const attempt =
      input.session
        .checkout_attempts
        .find(
          candidate =>
            candidate
              .begin_checkout_event_id ===
            input.canonicalEvent
              .event_id
        )

    if (!attempt) {
      throw new Error(
        'Canonical begin_checkout attempt was not present after Registry commit'
      )
    }

    const journalEvent =
      createCheckoutSessionEvent({
        session:
          input.session,

        eventType:
          'checkout_attempt.started',

        source:
          'begin_checkout_collector',

        attemptId:
          attempt.attempt_id,

        metadata: {
          checkout_method:
            input.checkoutMethod,

          canonical_event_id:
            input.canonicalEvent
              .event_id,

          canonical_event_time:
            input.canonicalEvent
              .event_time,

          canonical_promotion:
            input.canonicalPromotion
        },

        now:
          () =>
            input.observedAt
      })

    await input.eventStream.append(
      journalEvent
    )

    return 'appended'
  } catch (error) {
    console.error(
      '[checkout-session] begin_checkout journal append failed',
      {
        eventId:
          input.canonicalEvent
            .event_id,

        sessionId:
          input.session
            .session_id,

        revision:
          input.session
            .revision,

        error:
          error instanceof Error ?
            error.message
          : 'unknown_error'
      }
    )

    return 'failed'
  }
}

async function appendShopifyCheckoutUrlResolvedEvent(
  input: {
    eventStream:
      CanonicalBeginCheckoutAttemptEventStream

    session:
      CheckoutSession

    attemptId:
      string

    checkoutUrlFingerprint:
      string

    checkoutHost:
      string

    operationalAttemptCreated:
      boolean

    observedAt: Date
  }
): Promise<
  'appended' | 'failed'
> {
  try {
    const attempt =
      input.session
        .checkout_attempts
        .find(
          candidate =>
            candidate.attempt_id ===
            input.attemptId
        )

    if (!attempt) {
      throw new Error(
        'Shopify checkout attempt was not present after URL capture'
      )
    }

    const journalEvent =
      createCheckoutSessionEvent({
        session:
          input.session,

        eventType:
          'shopify_checkout.url_resolved',

        source:
          'shopify_checkout_route',

        attemptId:
          input.attemptId,

        metadata: {
          checkout_method:
            'shopify_checkout',

          checkout_url_fingerprint:
            input.checkoutUrlFingerprint,

          checkout_host:
            input.checkoutHost,

          operational_attempt_created:
            input.operationalAttemptCreated,

          canonical_begin_checkout_linked:
            attempt
              .begin_checkout_event_id !==
            null
        },

        now:
          () =>
            input.observedAt
      })

    await input.eventStream.append(
      journalEvent
    )

    return 'appended'
  } catch (error) {
    console.error(
      '[checkout-session] Shopify checkout URL journal append failed',
      {
        attemptId:
          input.attemptId,

        sessionId:
          input.session
            .session_id,

        revision:
          input.session
            .revision,

        error:
          error instanceof Error ?
            error.message
          : 'unknown_error'
      }
    )

    return 'failed'
  }
}

function createKlarnaJournalMetadata(
  input: {
    transition:
      AdvanceKlarnaExpressAttemptInput

    event:
      KlarnaLifecycleJournalEvent
  }
): Record<
  string,
  string | number | boolean | null
> {
  const base = {
    checkout_method:
      'klarna_express',

    shipping_address_collected:
      input.transition
        .shippingAddressCollected
  }

  switch (
    input.event.eventType
  ) {
    case 'klarna_express.order_created':
      if (
        input.transition.stage !==
        'order_created'
      ) {
        return base
      }

      return {
        ...base,

        klarna_order_id:
          input.transition
            .klarnaOrderId,

        fraud_status:
          input.transition
            .fraudStatus
      }

    case 'shopify_order.created':
      if (
        input.transition.stage !==
        'shopify_order_created'
      ) {
        return base
      }

      return {
        ...base,

        klarna_order_id:
          input.transition
            .klarnaOrderId,

        shopify_order_id:
          input.transition
            .shopifyOrderId
      }

    case 'klarna_express.failed':
      if (
        input.transition.stage !==
        'failed'
      ) {
        return base
      }

      return {
        ...base,

        failure_code:
          input.transition
            .failureCode,

        ...(input.transition
          .klarnaOrderId ?
          {
            klarna_order_id:
              input.transition
                .klarnaOrderId
          }
        : {})
      }

    default:
      return base
  }
}

async function appendKlarnaLifecycleEvent(
  input: {
    eventStream:
      CanonicalBeginCheckoutAttemptEventStream

    session:
      CheckoutSession

    attemptId:
      string

    transition:
      AdvanceKlarnaExpressAttemptInput

    journal:
      KlarnaLifecycleJournalEvent

    observedAt:
      Date
  }
): Promise<
  'appended' | 'failed'
> {
  try {
    const journalEvent =
      createCheckoutSessionEvent({
        session:
          input.session,

        eventType:
          input.journal
            .eventType,

        source:
          input.journal
            .source,

        attemptId:
          input.attemptId,

        metadata:
          createKlarnaJournalMetadata({
            transition:
              input.transition,

            event:
              input.journal
          }),

        now:
          () =>
            input.observedAt
      })

    await input.eventStream.append(
      journalEvent
    )

    return 'appended'
  } catch (error) {
    /**
     * Registry state is already committed.
     * Stream remains fail-open.
     */
    console.error(
      '[checkout-session] Klarna lifecycle journal append failed',
      {
        eventType:
          input.journal
            .eventType,

        attemptId:
          input.attemptId,

        sessionId:
          input.session
            .session_id,

        revision:
          input.session
            .revision,

        error:
          error instanceof Error ?
            error.message
          : 'unknown_error'
      }
    )

    return 'failed'
  }
}

export async function captureShopifyCheckoutUrl(
  input: {
    cart: Cart
    checkoutUrl: URL
    environment:
      CheckoutSessionEnvironment
  },
  dependencies:
    CaptureShopifyCheckoutUrlDependencies = {}
): Promise<CaptureShopifyCheckoutUrlResult> {
  const {
    privateCheckoutUrl,
    checkoutUrlFingerprint,
    checkoutHost
  } =
    inspectPrivateCheckoutUrl(
      input.checkoutUrl
    )

  const now =
    dependencies.now ??
    (() => new Date())

  const observedAt =
    now()

  if (
    Number.isNaN(
      observedAt.getTime()
    )
  ) {
    throw new Error(
      'Shopify checkout URL capture requires a valid timestamp'
    )
  }

  const materializeSession =
    dependencies.materializeSession ??
    defaultMaterializeSession

  const sessionStore =
    dependencies.sessionStore ??
    redisCheckoutSessionStore

  const eventStream =
    dependencies.eventStream ??
    redisCheckoutSessionEventStream

  const attemptIdFactory =
    dependencies.attemptIdFactory ??
    randomUUID

  let materialized =
    await materializeSession({
      cart:
        input.cart,

      environment:
        input.environment
    })

  let current =
    materialized.session

  let generatedAttemptId:
    string | null =
    null

  for (
    let casAttempt = 0;
    casAttempt <
    CAPTURE_SHOPIFY_CHECKOUT_MAX_CAS_ATTEMPTS;
    casAttempt += 1
  ) {
    if (
      current.state !==
      'active'
    ) {
      return {
        status:
          'session_inactive',

        checkout_url_fingerprint:
          checkoutUrlFingerprint,

        checkout_host:
          checkoutHost,

        journal_status:
          'not_appended'
      }
    }

    const attachable =
      findAttachableShopifyAttempt({
        session:
          current,

        observedAt
      })

    if (
      attachable &&
      hasExactCapturedUrl(
        attachable,
        privateCheckoutUrl,
        checkoutUrlFingerprint
      )
    ) {
      return {
        status:
          'duplicate',

        attempt_id:
          attachable.attempt_id,

        session:
          current,

        checkout_url_fingerprint:
          checkoutUrlFingerprint,

        checkout_host:
          checkoutHost,

        operational_attempt_created:
          false,

        journal_status:
          'not_appended'
      }
    }

    let attemptId: string

    let operationalAttemptCreated:
      boolean

    let nextSession:
      CheckoutSession

    if (
      attachable &&
      canAttachCapturedUrl(
        attachable,
        privateCheckoutUrl,
        checkoutUrlFingerprint
      )
    ) {
      attemptId =
        attachable.attempt_id

      operationalAttemptCreated =
        false

      nextSession =
        attachCheckoutUrlToAttempt({
          current,

          attempt:
            attachable,

          privateCheckoutUrl,

          checkoutUrlFingerprint,

          observedAt:
            observedAt
              .toISOString()
        })
    } else {
      generatedAttemptId ??=
        attemptIdFactory()

      attemptId =
        generatedAttemptId

      operationalAttemptCreated =
        true

      nextSession =
        addOperationalCheckoutAttempt({
          current,

          attemptId,

          observedAt:
            observedAt
              .toISOString(),

          privateCheckoutUrl,

          checkoutUrlFingerprint
        })
    }

    const result =
      await sessionStore
        .compareAndSet({
          cartToken:
            current.shopify_cart
              .cart_token,

          expectedRevision:
            current.revision,

          nextSession
        })

    if (
      result.status ===
      'updated'
    ) {
      const journalStatus =
        await appendShopifyCheckoutUrlResolvedEvent({
          eventStream,

          session:
            result.session,

          attemptId,

          checkoutUrlFingerprint,

          checkoutHost,

          operationalAttemptCreated,

          observedAt
        })

      return {
        status:
          'captured',

        attempt_id:
          attemptId,

        session:
          result.session,

        checkout_url_fingerprint:
          checkoutUrlFingerprint,

        checkout_host:
          checkoutHost,

        operational_attempt_created:
          operationalAttemptCreated,

        journal_status:
          journalStatus
      }
    }

    if (
      result.status ===
      'conflict'
    ) {
      current =
        result.current

      continue
    }

    materialized =
      await materializeSession({
        cart:
          input.cart,

        environment:
          input.environment
      })

    current =
      materialized.session
  }

  throw new Error(
    `Shopify checkout URL capture exceeded ${CAPTURE_SHOPIFY_CHECKOUT_MAX_CAS_ATTEMPTS} concurrent CAS attempts`
  )
}

export async function advanceKlarnaExpressAttempt(
  input:
    AdvanceKlarnaExpressAttemptInput,
  dependencies:
    AdvanceKlarnaExpressAttemptDependencies = {}
): Promise<AdvanceKlarnaExpressAttemptResult> {
  assertKlarnaAuthorizationFingerprint(
    input.authorizationTokenFingerprint
  )

  const now =
    dependencies.now ??
    (() => new Date())

  const observedAt =
    now()

  if (
    Number.isNaN(
      observedAt.getTime()
    )
  ) {
    throw new Error(
      'Klarna lifecycle capture requires a valid timestamp'
    )
  }

  const observedAtIso =
    observedAt.toISOString()

  const materializeSession =
    dependencies.materializeSession ??
    defaultMaterializeSession

  const sessionStore =
    dependencies.sessionStore ??
    redisCheckoutSessionStore

  const eventStream =
    dependencies.eventStream ??
    redisCheckoutSessionEventStream

  const attemptIdFactory =
    dependencies.attemptIdFactory ??
    randomUUID

  let generatedAttemptId:
    string | null =
    null

  let materialized =
    await materializeSession({
      cart:
        input.cart,

      environment:
        input.environment
    })

  let current =
    materialized.session

  for (
    let casAttempt = 0;
    casAttempt <
    ADVANCE_KLARNA_EXPRESS_MAX_CAS_ATTEMPTS;
    casAttempt += 1
  ) {
    if (
      current.state !==
      'active'
    ) {
      return {
        status:
          'session_inactive',

        journal_status:
          'not_appended'
      }
    }

    let attempt =
      findAttachableKlarnaAttempt({
        session:
          current,

        fingerprint:
          input
            .authorizationTokenFingerprint,

        observedAt
      })

    const previousAttemptId =
      attempt?.attempt_id ??
      null

    const operationalAttemptCreated =
      attempt ===
      null

    if (!attempt) {
      generatedAttemptId ??=
        attemptIdFactory()

      attempt =
        createOperationalKlarnaAttempt({
          attemptId:
            generatedAttemptId,

          observedAt:
            observedAtIso
        })
    }

    const applied =
      applyKlarnaStage({
        attempt,

        transition:
          input,

        observedAt:
          observedAtIso
      })

    if (
      applied.status ===
      'terminal'
    ) {
      return {
        status:
          'attempt_terminal',

        attempt_id:
          attempt.attempt_id,

        session:
          current,

        journal_status:
          'not_appended'
      }
    }

    if (
      applied.status ===
      'unchanged'
    ) {
      return {
        status:
          'duplicate',

        attempt_id:
          attempt.attempt_id,

        session:
          current,

        operational_attempt_created:
          false,

        journal_status:
          'not_appended'
      }
    }

    const nextSession =
      createSessionWithKlarnaAttempt({
        current,

        previousAttemptId,

        nextAttempt:
          applied.attempt,

        observedAt:
          observedAtIso
      })

    const result =
      await sessionStore
        .compareAndSet({
          cartToken:
            current.shopify_cart
              .cart_token,

          expectedRevision:
            current.revision,

          nextSession
        })

    if (
      result.status ===
      'updated'
    ) {
      const journalStatus =
        applied.journal ?
          await appendKlarnaLifecycleEvent({
            eventStream,

            session:
              result.session,

            attemptId:
              applied.attempt
                .attempt_id,

            transition:
              input,

            journal:
              applied.journal,

            observedAt
          })
        : 'not_appended'

      return {
        status:
          'advanced',

        attempt_id:
          applied.attempt
            .attempt_id,

        session:
          result.session,

        operational_attempt_created:
          operationalAttemptCreated,

        journal_status:
          journalStatus
      }
    }

    if (
      result.status ===
      'conflict'
    ) {
      current =
        result.current

      continue
    }

    materialized =
      await materializeSession({
        cart:
          input.cart,

        environment:
          input.environment
      })

    current =
      materialized.session
  }

  throw new Error(
    `Klarna lifecycle capture exceeded ${ADVANCE_KLARNA_EXPRESS_MAX_CAS_ATTEMPTS} concurrent CAS attempts`
  )
}

export async function registerCanonicalBeginCheckoutAttempt(
  request: Request,
  dependencies:
    RegisterCanonicalBeginCheckoutAttemptDependencies = {}
): Promise<RegisterCanonicalBeginCheckoutAttemptResult> {
  const {
    event,
    checkoutMethod
  } =
    await parseCanonicalRequest(
      request
    )

  const eventCartId =
    parseShopifyPublicCartId(
      event.custom_data.cart_id
    )

  if (!eventCartId) {
    return {
      status:
        'cart_identity_mismatch',

      journal_status:
        'not_appended'
    }
  }

  const readCartId =
    dependencies.readCartId ??
    readCartIdCookie

  const fullCartId =
    await readCartId()

  if (!fullCartId) {
    return {
      status:
        'cart_cookie_missing',

      journal_status:
        'not_appended'
    }
  }

  const parsedFullCart =
    parseShopifyCartId(
      fullCartId
    )

  if (
    !parsedFullCart ||
    parsedFullCart.publicId !==
      eventCartId
  ) {
    return {
      status:
        'cart_identity_mismatch',

      journal_status:
        'not_appended'
    }
  }

  const fetchCart =
    dependencies.fetchCart ??
    defaultFetchCart

  const cart =
    await fetchCart({
      requestHeaders:
        request.headers,

      fullCartId:
        parsedFullCart.fullId
    })

  if (!cart) {
    return {
      status:
        'cart_unavailable',

      journal_status:
        'not_appended'
    }
  }

  if (
    cart.id !==
    eventCartId
  ) {
    return {
      status:
        'cart_identity_mismatch',

      journal_status:
        'not_appended'
    }
  }

  const materializeSession =
    dependencies.materializeSession ??
    defaultMaterializeSession

  const sessionStore =
    dependencies.sessionStore ??
    redisCheckoutSessionStore

  const eventStream =
    dependencies.eventStream ??
    redisCheckoutSessionEventStream

  const now =
    dependencies.now ??
    (() => new Date())

  const observedAt =
    now()

  if (
    Number.isNaN(
      observedAt.getTime()
    )
  ) {
    throw new Error(
      'Canonical begin_checkout Registry handoff requires a valid timestamp'
    )
  }

  let materialized =
    await materializeSession({
      cart,

      environment:
        event.environment
    })

  let current =
    materialized.session

  for (
    let casAttempt = 0;
    casAttempt <
    REGISTER_BEGIN_CHECKOUT_MAX_CAS_ATTEMPTS;
    casAttempt += 1
  ) {
    if (
      current.state !==
      'active'
    ) {
      return {
        status:
          'session_inactive',

        journal_status:
          'not_appended'
      }
    }

    const existing =
      findExistingAttempt(
        current,
        event.event_id
      )

    if (existing) {
      assertExistingAttemptMatches({
        attempt:
          existing,

        event,

        checkoutMethod
      })

      return {
        status:
          'duplicate',

        attempt_id:
          existing.attempt_id,

        session:
          current,

        journal_status:
          'not_appended'
      }
    }

    /**
     * Either operational provider path may beat the
     * canonical `after()` handoff.
     *
     * Promote the operational attempt instead of
     * creating a second CheckoutAttempt.
     */
    const promotable =
      checkoutMethod ===
        'shopify_checkout' ?
        findPromotableOperationalShopifyAttempt({
          session:
            current,

          observedAt
        })
      : findPromotableOperationalKlarnaAttempt({
          session:
            current,

          observedAt
        })

    let nextSession:
      CheckoutSession

    let registeredAttemptId:
      string

    let canonicalPromotion =
      false

    if (promotable) {
      registeredAttemptId =
        promotable.attempt_id

      canonicalPromotion =
        true

      nextSession =
        createPromotedOperationalSession({
          current,

          attempt:
            promotable,

          event,

          observedAt:
            observedAt
              .toISOString()
        })
    } else {
      registeredAttemptId =
        event.event_id

      nextSession =
        createNextSessionWithCanonicalAttempt({
          current,

          event,

          checkoutMethod,

          observedAt:
            observedAt
              .toISOString()
        })
    }

    const result =
      await sessionStore
        .compareAndSet({
          cartToken:
            current.shopify_cart
              .cart_token,

          expectedRevision:
            current.revision,

          nextSession
        })

    if (
      result.status ===
      'updated'
    ) {
      const journalStatus =
        await appendAttemptStartedEvent({
          eventStream,

          session:
            result.session,

          canonicalEvent:
            event,

          checkoutMethod,

          observedAt,

          canonicalPromotion
        })

      return {
        status:
          'registered',

        attempt_id:
          registeredAttemptId,

        session:
          result.session,

        journal_status:
          journalStatus
      }
    }

    if (
      result.status ===
      'conflict'
    ) {
      current =
        result.current

      continue
    }

    materialized =
      await materializeSession({
        cart,

        environment:
          event.environment
      })

    current =
      materialized.session
  }

  throw new Error(
    `Canonical begin_checkout Registry handoff exceeded ${REGISTER_BEGIN_CHECKOUT_MAX_CAS_ATTEMPTS} concurrent CAS attempts`
  )
}