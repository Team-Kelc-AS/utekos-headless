import { randomUUID } from 'node:crypto'

import { z } from 'zod'

import {
  checkoutSessionSchema,
  type CheckoutSession
} from './checkoutSessionSchema'

export const CHECKOUT_SESSION_EVENT_SCHEMA_NAME =
  'utekos.checkout_session_event.v1' as const

export const checkoutSessionEventTypeSchema =
  z.enum([
    'checkout_session.created',
    'checkout_session.cart_materialized',
    'checkout_session.cart_updated',

    'checkout_attempt.started',

    'shopify_checkout.url_resolved',
    'shopify_checkout.shipping_info_submitted',
    'shopify_checkout.payment_info_submitted',
    'shopify_checkout.abandonment_attached',
    'shopify_checkout.recovered',

    'klarna_express.authorizing',
    'klarna_express.authorized',
    'klarna_express.failed',
    'klarna_express.order_created',

    'shopify_order.created',

    'purchase.completed',

    'checkout_session.converted',

    'checkout_recovery.evaluated',
    'checkout_recovery.sent',

    'checkout_session.closed'
  ])

export type CheckoutSessionEventType =
  z.infer<
    typeof checkoutSessionEventTypeSchema
  >

export const checkoutSessionEventSourceSchema =
  z.enum([
    'registry',
    'storefront_api',
    'shopify_carts_webhook',
    'begin_checkout_collector',
    'shopify_checkout_route',
    'shopify_web_pixel',
    'shopify_admin_graphql',
    'klarna_express_client',
    'klarna_orders_api',
    'shopify_orders_webhook',
    'recovery_worker'
  ])

export type CheckoutSessionEventSource =
  z.infer<
    typeof checkoutSessionEventSourceSchema
  >

export const checkoutSessionEventMetadataValueSchema =
  z.union([
    z.string().max(2048),
    z.number().finite(),
    z.boolean(),
    z.null()
  ])

export type CheckoutSessionEventMetadataValue =
  z.infer<
    typeof checkoutSessionEventMetadataValueSchema
  >

export const checkoutSessionEventMetadataSchema =
  z.record(
    z.string().min(1).max(128),
    checkoutSessionEventMetadataValueSchema
  )

export type CheckoutSessionEventMetadata =
  z.infer<
    typeof checkoutSessionEventMetadataSchema
  >

export const checkoutSessionEventSchema =
  z.strictObject({
    schema: z.literal(
      CHECKOUT_SESSION_EVENT_SCHEMA_NAME
    ),

    event_id: z.string().uuid(),

    event_type:
      checkoutSessionEventTypeSchema,

    source:
      checkoutSessionEventSourceSchema,

    occurred_at: z
      .string()
      .datetime({
        offset: true
      }),

    session_id: z.string().uuid(),

    session_revision:
      z.number().int().nonnegative(),

    cart_token: z
      .string()
      .min(1)
      .max(512),

    attempt_id:
      z.string().uuid().nullable(),

    metadata:
      checkoutSessionEventMetadataSchema
  })

export type CheckoutSessionEvent =
  z.infer<
    typeof checkoutSessionEventSchema
  >

const FORBIDDEN_METADATA_KEYS =
  new Set([
    'checkout_url',
    'private_checkout_url',

    'abandoned_checkout_url',
    'private_abandoned_checkout_url',

    'recovery_url',

    'redirect_url',
    'private_redirect_url',

    'authorization_token',

    'email',
    'phone',

    'first_name',
    'last_name',

    'address1',
    'address2',

    'postal_code',
    'city',
    'region'
  ])

function assertSafeMetadata(
  metadata: CheckoutSessionEventMetadata
): void {
  for (
    const [key, value] of
    Object.entries(metadata)
  ) {
    const normalizedKey =
      key.trim().toLowerCase()

    if (
      FORBIDDEN_METADATA_KEYS.has(
        normalizedKey
      ) ||
      normalizedKey.startsWith(
        'private_'
      )
    ) {
      throw new Error(
        `Checkout Session event metadata cannot contain private field "${key}"`
      )
    }

    if (
      typeof value === 'string'
    ) {
      const normalizedValue =
        value.toLowerCase()

      if (
        normalizedValue.includes(
          '/recover?'
        ) ||
        normalizedValue.includes(
          '?key='
        ) ||
        normalizedValue.includes(
          '&key='
        )
      ) {
        throw new Error(
          `Checkout Session event metadata cannot contain a capability URL in "${key}"`
        )
      }
    }
  }
}

export type CreateCheckoutSessionEventInput = {
  session: CheckoutSession

  eventType:
    CheckoutSessionEventType

  source:
    CheckoutSessionEventSource

  attemptId?: string | null

  metadata?:
    CheckoutSessionEventMetadata

  now?: () => Date

  eventIdFactory?: () => string
}

export function createCheckoutSessionEvent(
  input: CreateCheckoutSessionEventInput
): CheckoutSessionEvent {
  const session =
    checkoutSessionSchema.parse(
      input.session
    )

  const now =
    input.now ??
    (() => new Date())

  const eventIdFactory =
    input.eventIdFactory ??
    randomUUID

  const occurredAt =
    now()

  if (
    Number.isNaN(
      occurredAt.getTime()
    )
  ) {
    throw new Error(
      'Checkout Session event requires a valid timestamp'
    )
  }

  const attemptId =
    input.attemptId ?? null

  if (
    attemptId !== null &&
    !session.checkout_attempts.some(
      attempt =>
        attempt.attempt_id ===
        attemptId
    )
  ) {
    throw new Error(
      'Checkout Session event attempt_id must reference an attempt in the session'
    )
  }

  const metadata =
    checkoutSessionEventMetadataSchema.parse(
      input.metadata ?? {}
    )

  assertSafeMetadata(
    metadata
  )

  return checkoutSessionEventSchema.parse({
    schema:
      CHECKOUT_SESSION_EVENT_SCHEMA_NAME,

    event_id:
      eventIdFactory(),

    event_type:
      input.eventType,

    source:
      input.source,

    occurred_at:
      occurredAt.toISOString(),

    session_id:
      session.session_id,

    session_revision:
      session.revision,

    cart_token:
      session.shopify_cart
        .cart_token,

    attempt_id:
      attemptId,

    metadata
  })
}