import { z } from 'zod'

import { checkoutMethodSchema } from '@/lib/analytics/checkoutMethod'

export const CHECKOUT_SESSION_SCHEMA_NAME =
  'utekos.checkout_session.v1' as const

export const checkoutSessionEnvironmentSchema = z.enum([
  'production',
  'preview',
  'development',
  'test'
])

export type CheckoutSessionEnvironment = z.infer<
  typeof checkoutSessionEnvironmentSchema
>

const isoDateTimeSchema = z.string().datetime({
  offset: true
})

const nullableIsoDateTimeSchema = isoDateTimeSchema.nullable()

const currencyCodeSchema = z.string().regex(/^[A-Z]{3}$/)

const moneyAmountSchema = z
  .string()
  .regex(/^(0|[1-9]\d*)(\.\d{1,4})?$/)

const sha256FingerprintSchema = z
  .string()
  .regex(/^sha256:[a-f0-9]{64}$/)

const nullableUrlSchema = z.url().max(4000).nullable()

const shopifyCartGidSchema = z
  .string()
  .regex(/^gid:\/\/shopify\/Cart\/[^/?#]+$/)

const shopifyProductGidSchema = z
  .string()
  .regex(/^gid:\/\/shopify\/Product\/\d+$/)

const shopifyVariantGidSchema = z
  .string()
  .regex(/^gid:\/\/shopify\/ProductVariant\/\d+$/)

  const SHOPIFY_CART_LINE_GID_PREFIX =
  'gid://shopify/CartLine/' as const

const MAX_SHOPIFY_OPAQUE_ID_LENGTH =
  4_096

const shopifyCartLineGidSchema = z
  .string()
  .min(
    SHOPIFY_CART_LINE_GID_PREFIX.length + 1
  )
  .max(
    MAX_SHOPIFY_OPAQUE_ID_LENGTH
  )
  .startsWith(
    SHOPIFY_CART_LINE_GID_PREFIX
  )

const shopifyOrderGidSchema = z
  .string()
  .regex(/^gid:\/\/shopify\/Order\/\d+$/)

const shopifyDraftOrderGidSchema = z
  .string()
  .regex(/^gid:\/\/shopify\/DraftOrder\/\d+$/)

const shopifyAbandonedCheckoutGidSchema = z
  .string()
  .regex(/^gid:\/\/shopify\/AbandonedCheckout\/\d+$/)

export const checkoutSessionMoneySchema = z.strictObject({
  amount: moneyAmountSchema,
  currency_code: currencyCodeSchema
})

export type CheckoutSessionMoney = z.infer<
  typeof checkoutSessionMoneySchema
>

export const checkoutSessionSelectedOptionSchema =
  z.strictObject({
    name: z.string().min(1).max(255),
    value: z.string().min(1).max(255)
  })

export type CheckoutSessionSelectedOption = z.infer<
  typeof checkoutSessionSelectedOptionSchema
>

export const checkoutSessionLineItemSchema = z.strictObject({
  line_id: shopifyCartLineGidSchema.nullable(),

  line_key: z.string().min(1).max(512).nullable(),

  product_id: shopifyProductGidSchema,

  variant_id: shopifyVariantGidSchema,

  sku: z.string().min(1).max(255).nullable(),

  title: z.string().min(1).max(500),

  variant_title: z.string().min(1).max(500).nullable(),

  vendor: z.string().min(1).max(255).nullable(),

  quantity: z.number().int().positive(),

  unit_price: checkoutSessionMoneySchema,

  line_total: checkoutSessionMoneySchema.nullable(),

  selected_options: z.array(
    checkoutSessionSelectedOptionSchema
  ),

  image_url: nullableUrlSchema,

  available_for_sale: z.boolean().nullable(),

  taxable: z.boolean().nullable()
})

export type CheckoutSessionLineItem = z.infer<
  typeof checkoutSessionLineItemSchema
>

export const checkoutSessionCartSourceSchema = z.enum([
  'storefront_api',
  'shopify_carts_webhook',
  'merged'
])

export type CheckoutSessionCartSource = z.infer<
  typeof checkoutSessionCartSourceSchema
>

export const checkoutSessionShopifyCartSchema =
  z
    .strictObject({
      cart_gid: shopifyCartGidSchema,

      cart_token: z.string().min(1).max(512),

      source: checkoutSessionCartSourceSchema,

      line_items: z.array(checkoutSessionLineItemSchema),

      total_quantity: z.number().int().nonnegative(),

      subtotal: checkoutSessionMoneySchema,

      total: checkoutSessionMoneySchema,

      provider_updated_at: nullableIsoDateTimeSchema,

      first_observed_at: isoDateTimeSchema,

      last_observed_at: isoDateTimeSchema
    })
    .superRefine((cart, context) => {
      const lineQuantity = cart.line_items.reduce(
        (sum, line) => sum + line.quantity,
        0
      )

      if (lineQuantity !== cart.total_quantity) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['total_quantity'],
          message:
            'total_quantity must equal the sum of line item quantities'
        })
      }

      if (
        cart.subtotal.currency_code !==
        cart.total.currency_code
      ) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['total', 'currency_code'],
          message:
            'subtotal and total must use the same currency'
        })
      }

      for (
        let index = 0;
        index < cart.line_items.length;
        index += 1
      ) {
        const line = cart.line_items[index]

        if (
          line &&
          line.unit_price.currency_code !==
            cart.total.currency_code
        ) {
          context.addIssue({
            code: z.ZodIssueCode.custom,
            path: [
              'line_items',
              index,
              'unit_price',
              'currency_code'
            ],
            message:
              'line item currency must equal cart currency'
          })
        }

        if (
          line?.line_total &&
          line.line_total.currency_code !==
            cart.total.currency_code
        ) {
          context.addIssue({
            code: z.ZodIssueCode.custom,
            path: [
              'line_items',
              index,
              'line_total',
              'currency_code'
            ],
            message:
              'line total currency must equal cart currency'
          })
        }
      }
    })

export type CheckoutSessionShopifyCart = z.infer<
  typeof checkoutSessionShopifyCartSchema
>

export const checkoutAttemptMilestonesSchema =
  z.strictObject({
    began_at: isoDateTimeSchema,

    shipping_info_submitted_at:
      nullableIsoDateTimeSchema,

    payment_info_submitted_at:
      nullableIsoDateTimeSchema,

    completed_at: nullableIsoDateTimeSchema
  })

export type CheckoutAttemptMilestones = z.infer<
  typeof checkoutAttemptMilestonesSchema
>

export const shopifyCheckoutAttemptStatusSchema = z.enum([
  'unresolved',
  'checkout_url_resolved',
  'checkout_active',
  'native_abandonment_available',
  'recovered',
  'completed',
  'failed'
])

export type ShopifyCheckoutAttemptStatus = z.infer<
  typeof shopifyCheckoutAttemptStatusSchema
>

export const shopifyCheckoutAttemptStateSchema =
  z.strictObject({
    status: shopifyCheckoutAttemptStatusSchema,

    /**
     * Token identifying the Shopify checkout/recovery resource.
     *
     * This is deliberately separate from:
     * - Storefront Cart token
     * - checkout recovery key
     */
    checkout_token: z
      .string()
      .min(1)
      .max(512)
      .nullable(),

    /**
     * PRIVATE CAPABILITY URL.
     *
     * May contain Shopify capability credentials.
     * Must NEVER be copied to:
     * - canonical analytics events
     * - Pinterest
     * - GTM
     * - Meta
     * - Microsoft
     * - Vercel Web Analytics
     * - ordinary unredacted runtime logs
     */
    private_checkout_url: nullableUrlSchema,

    /**
     * Safe correlation fingerprint for observability.
     *
     * Format:
     * sha256:<64 lowercase hexadecimal characters>
     */
    checkout_url_fingerprint:
      sha256FingerprintSchema.nullable(),

    abandoned_checkout_id:
      shopifyAbandonedCheckoutGidSchema.nullable(),

    /**
     * PRIVATE recovery capability URL from Shopify.
     */
    private_abandoned_checkout_url: nullableUrlSchema,

    abandoned_checkout_created_at:
      nullableIsoDateTimeSchema,

    abandoned_checkout_updated_at:
      nullableIsoDateTimeSchema,

    most_recent_step: z
      .string()
      .min(1)
      .max(255)
      .nullable(),

    inventory_available: z.boolean().nullable(),

    native_email_state: z
      .string()
      .min(1)
      .max(255)
      .nullable(),

    customer_has_no_order_since_abandonment:
      z.boolean().nullable(),

    customer_has_no_draft_order_since_abandonment:
      z.boolean().nullable()
  })

export type ShopifyCheckoutAttemptState = z.infer<
  typeof shopifyCheckoutAttemptStateSchema
>

export const klarnaExpressAttemptStatusSchema = z.enum([
  'started',
  'authorizing',
  'authorized',
  'order_creating',
  'order_created',
  'completed',
  'cancelled',
  'failed'
])

export type KlarnaExpressAttemptStatus = z.infer<
  typeof klarnaExpressAttemptStatusSchema
>

export const klarnaExpressAttemptStateSchema =
  z.strictObject({
    status: klarnaExpressAttemptStatusSchema,

    /**
     * Raw Klarna authorization tokens are intentionally forbidden
     * from the Checkout Session Registry.
     *
     * Only a one-way fingerprint can be persisted.
     */
    authorization_token_fingerprint:
      sha256FingerprintSchema.nullable(),

    klarna_order_id: z
      .string()
      .min(1)
      .max(512)
      .nullable(),

    fraud_status: z
      .enum(['ACCEPTED', 'PENDING', 'REJECTED'])
      .nullable(),

    shopify_draft_order_id:
      shopifyDraftOrderGidSchema.nullable(),

    shopify_order_id:
      shopifyOrderGidSchema.nullable(),

    /**
     * Klarna may return a redirect URL as part of successful
     * completion. Keep it private because its future semantics
     * are provider-owned.
     */
    private_redirect_url: nullableUrlSchema,

    shipping_address_collected_at:
      nullableIsoDateTimeSchema,

    authorization_completed_at:
      nullableIsoDateTimeSchema,

    order_created_at: nullableIsoDateTimeSchema,

    failed_at: nullableIsoDateTimeSchema,

    failure_code: z
      .string()
      .min(1)
      .max(255)
      .nullable()
  })

export type KlarnaExpressAttemptState = z.infer<
  typeof klarnaExpressAttemptStateSchema
>

export const checkoutAttemptSchema = z
  .strictObject({
    attempt_id: z.string().uuid(),

    begin_checkout_event_id: z
      .string()
      .uuid()
      .nullable(),

    method: checkoutMethodSchema,

    started_at: isoDateTimeSchema,

    last_updated_at: isoDateTimeSchema,

    milestones: checkoutAttemptMilestonesSchema,

    shopify: shopifyCheckoutAttemptStateSchema.nullable(),

    klarna: klarnaExpressAttemptStateSchema.nullable()
  })
  .superRefine((attempt, context) => {
    if (attempt.method === 'shopify_checkout') {
      if (attempt.shopify === null) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['shopify'],
          message:
            'shopify checkout attempts require Shopify provider state'
        })
      }

      if (attempt.klarna !== null) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['klarna'],
          message:
            'shopify checkout attempts cannot contain Klarna provider state'
        })
      }
    }

    if (attempt.method === 'klarna_express') {
      if (attempt.klarna === null) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['klarna'],
          message:
            'Klarna Express attempts require Klarna provider state'
        })
      }

      if (attempt.shopify !== null) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['shopify'],
          message:
            'Klarna Express attempts cannot contain Shopify checkout provider state'
        })
      }
    }

    if (
      attempt.milestones.began_at !== attempt.started_at
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['milestones', 'began_at'],
        message:
          'milestones.began_at must equal attempt.started_at'
      })
    }
  })

export type CheckoutAttempt = z.infer<
  typeof checkoutAttemptSchema
>

export const checkoutSessionCustomerSourceSchema = z.enum([
  'shopify_abandoned_checkout',
  'klarna_express',
  'shopify_order'
])

export type CheckoutSessionCustomerSource = z.infer<
  typeof checkoutSessionCustomerSourceSchema
>

export const privateCheckoutSessionCustomerSchema =
  z.strictObject({
    source: checkoutSessionCustomerSourceSchema,

    email: z
      .string()
      .email()
      .max(320)
      .nullable(),

    phone: z
      .string()
      .min(1)
      .max(64)
      .nullable(),

    first_name: z
      .string()
      .min(1)
      .max(255)
      .nullable(),

    last_name: z
      .string()
      .min(1)
      .max(255)
      .nullable(),

    address1: z
      .string()
      .min(1)
      .max(500)
      .nullable(),

    address2: z
      .string()
      .min(1)
      .max(500)
      .nullable(),

    postal_code: z
      .string()
      .min(1)
      .max(32)
      .nullable(),

    city: z
      .string()
      .min(1)
      .max(255)
      .nullable(),

    region: z
      .string()
      .min(1)
      .max(255)
      .nullable(),

    country_code: z
      .string()
      .regex(/^[A-Z]{2}$/)
      .nullable(),

    last_updated_at: isoDateTimeSchema
  })

export type PrivateCheckoutSessionCustomer = z.infer<
  typeof privateCheckoutSessionCustomerSchema
>

export const checkoutRecoveryStatusSchema = z.enum([
  'inactive',
  'eligible',
  'suppressed',
  'sent',
  'converted'
])

export type CheckoutRecoveryStatus = z.infer<
  typeof checkoutRecoveryStatusSchema
>

export const checkoutRecoveryTargetSchema = z.enum([
  'shopify_native',
  'utekos_restore'
])

export type CheckoutRecoveryTarget = z.infer<
  typeof checkoutRecoveryTargetSchema
>

export const checkoutSessionRecoverySchema =
  z.strictObject({
    status: checkoutRecoveryStatusSchema,

    preferred_target:
      checkoutRecoveryTargetSchema.nullable(),

    /**
     * Public opaque identifier used by a future
     * Utekos-owned recovery route.
     *
     * It must NOT itself contain Shopify/Klarna secrets.
     */
    public_recovery_id: z
      .string()
      .min(16)
      .max(255)
      .nullable(),

    last_evaluated_at: nullableIsoDateTimeSchema,

    suppression_reason: z
      .string()
      .min(1)
      .max(500)
      .nullable()
  })

export type CheckoutSessionRecovery = z.infer<
  typeof checkoutSessionRecoverySchema
>

export const checkoutSessionConversionSchema =
  z.strictObject({
    occurred_at: isoDateTimeSchema,

    attempt_id: z.string().uuid().nullable(),

    method: checkoutMethodSchema.nullable(),

    shopify_order_id:
      shopifyOrderGidSchema.nullable(),

    shopify_order_name: z
      .string()
      .min(1)
      .max(255)
      .nullable()
  })

export type CheckoutSessionConversion = z.infer<
  typeof checkoutSessionConversionSchema
>

export const checkoutSessionStateSchema = z.enum([
  'active',
  'converted',
  'closed'
])

export type CheckoutSessionState = z.infer<
  typeof checkoutSessionStateSchema
>

export const checkoutSessionSchema = z
  .strictObject({
    schema: z.literal(CHECKOUT_SESSION_SCHEMA_NAME),

    /**
     * Internal Utekos Registry identity.
     *
     * This is NOT a Shopify ID and NOT an analytics event ID.
     */
    session_id: z.string().uuid(),

    /**
     * Optimistic concurrency revision.
     *
     * Every successful Registry mutation increments this by one.
     */
    revision: z.number().int().nonnegative(),

    environment: checkoutSessionEnvironmentSchema,

    state: checkoutSessionStateSchema,

    shopify_cart: checkoutSessionShopifyCartSchema,

    checkout_attempts: z.array(checkoutAttemptSchema),

    active_attempt_id: z.string().uuid().nullable(),

    conversion: checkoutSessionConversionSchema.nullable(),

    /**
     * PRIVATE operational customer state.
     *
     * Never copy this object wholesale into analytics/logging.
     */
    private_customer:
      privateCheckoutSessionCustomerSchema.nullable(),

    recovery: checkoutSessionRecoverySchema,

    first_seen_at: isoDateTimeSchema,

    last_seen_at: isoDateTimeSchema,

    /**
     * Redis hot-state expiry target.
     *
     * The Store will apply its TTL independently; this field records
     * the intended semantic expiry timestamp.
     */
    expires_at: isoDateTimeSchema
  })
  .superRefine((session, context) => {
    const attemptIds = new Set<string>()

    for (
      let index = 0;
      index < session.checkout_attempts.length;
      index += 1
    ) {
      const attempt =
        session.checkout_attempts[index]

      if (!attempt) continue

      if (attemptIds.has(attempt.attempt_id)) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: [
            'checkout_attempts',
            index,
            'attempt_id'
          ],
          message:
            'checkout attempt IDs must be unique within a session'
        })
      }

      attemptIds.add(attempt.attempt_id)
    }

    if (
      session.active_attempt_id !== null &&
      !attemptIds.has(session.active_attempt_id)
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['active_attempt_id'],
        message:
          'active_attempt_id must reference an attempt in checkout_attempts'
      })
    }

    if (session.state === 'converted') {
      if (session.conversion === null) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['conversion'],
          message:
            'converted sessions require conversion state'
        })
      }

      if (
        session.conversion?.attempt_id &&
        !attemptIds.has(
          session.conversion.attempt_id
        )
      ) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['conversion', 'attempt_id'],
          message:
            'conversion.attempt_id must reference an attempt in checkout_attempts'
        })
      }
    }

    if (
      session.state !== 'converted' &&
      session.conversion !== null
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['conversion'],
        message:
          'only converted sessions can contain conversion state'
      })
    }

    if (
      session.recovery.status === 'converted' &&
      session.state !== 'converted'
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['recovery', 'status'],
        message:
          'converted recovery state requires a converted checkout session'
      })
    }

    const firstSeen = Date.parse(session.first_seen_at)
    const lastSeen = Date.parse(session.last_seen_at)
    const expiresAt = Date.parse(session.expires_at)

    if (lastSeen < firstSeen) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['last_seen_at'],
        message:
          'last_seen_at cannot be earlier than first_seen_at'
      })
    }

    if (expiresAt <= lastSeen) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['expires_at'],
        message:
          'expires_at must be later than last_seen_at'
      })
    }
  })

export type CheckoutSession = z.infer<
  typeof checkoutSessionSchema
>