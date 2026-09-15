import { z } from 'zod'

export const SHOPIFY_CHECKOUT_OBSERVATION_CONTRACT =
  'utekos.shopify.checkout_observation' as const
export const SHOPIFY_CHECKOUT_OBSERVATION_SCHEMA_VERSION =
  1 as const
export const SHOPIFY_CHECKOUT_OBSERVATION_CANONICAL_SCHEMA_VERSION =
  2 as const
export const SHOPIFY_CHECKOUT_OBSERVATION_META_SCHEMA_VERSION =
  3 as const

const commonObservationShape = {
  contract: z.literal(SHOPIFY_CHECKOUT_OBSERVATION_CONTRACT),
  schemaVersion: z.literal(
    SHOPIFY_CHECKOUT_OBSERVATION_SCHEMA_VERSION
  ),
  source: z.literal('shopify_app_web_pixel'),
  verificationStatus: z.literal('observed'),
  eventId: z.string().min(1).max(255),
  eventSequence: z
    .number()
    .int()
    .nonnegative()
    .max(2_147_483_647),
  occurredAt: z.string().datetime({ offset: true }),
  privacy: z.strictObject({
    analyticsProcessingAllowed: z.boolean(),
    marketingAllowed: z.boolean(),
    preferencesProcessingAllowed: z.boolean(),
    saleOfDataAllowed: z.boolean()
  })
}

const commerceSchema = z
  .strictObject({
    currencyCode: z
      .string()
      .regex(/^[A-Z]{3}$/)
      .nullable(),
    value: z.number().finite().nonnegative().nullable(),
    itemQuantity: z.number().int().nonnegative().max(1_000_000)
  })
  .superRefine((commerce, context) => {
    if (
      commerce.value !== null &&
      commerce.currencyCode === null
    ) {
      context.addIssue({
        code: 'custom',
        message:
          'currencyCode is required when value is present',
        path: ['currencyCode']
      })
    }
  })

const shippingObservationSchema = z.strictObject({
  ...commonObservationShape,
  eventName: z.literal('checkout_shipping_info_submitted'),
  checkoutToken: z.string().min(1).max(255),
  commerce: commerceSchema
})

const paymentObservationSchema = z.strictObject({
  ...commonObservationShape,
  eventName: z.literal('payment_info_submitted'),
  checkoutToken: z.string().min(1).max(255),
  commerce: commerceSchema
})

const canonicalCheckoutProgressObservationShape = {
  ...commonObservationShape,
  schemaVersion: z.literal(
    SHOPIFY_CHECKOUT_OBSERVATION_CANONICAL_SCHEMA_VERSION
  ),
  checkoutToken: z.string().min(1).max(255),
  correlation: z.strictObject({
    beginCheckoutEventId: z.string().uuid()
  }),
  commerce: commerceSchema
}

const canonicalShippingObservationSchema = z.strictObject({
  ...canonicalCheckoutProgressObservationShape,
  eventName: z.literal('checkout_shipping_info_submitted')
})

const canonicalPaymentObservationSchema = z.strictObject({
  ...canonicalCheckoutProgressObservationShape,
  eventName: z.literal('payment_info_submitted')
})

const sha256ArraySchema = z
  .array(z.string().regex(/^[a-f0-9]{64}$/))
  .min(1)
  .max(2)

const metaCustomerMatchSchema = z.strictObject({
  city_sha256: sha256ArraySchema.optional(),
  country_sha256: sha256ArraySchema.optional(),
  email_sha256: sha256ArraySchema.optional(),
  first_name_sha256: sha256ArraySchema.optional(),
  last_name_sha256: sha256ArraySchema.optional(),
  phone_sha256: sha256ArraySchema.optional(),
  postal_code_sha256: sha256ArraySchema.optional(),
  state_sha256: sha256ArraySchema.optional()
})

const rawCustomerMatchSchema = z.strictObject({
  city: z.string().min(1).max(255).optional(),
  countryCode: z.string().min(2).max(255).optional(),
  email: z.string().email().max(320).optional(),
  firstName: z.string().min(1).max(255).optional(),
  lastName: z.string().min(1).max(255).optional(),
  phone: z.string().min(1).max(64).optional(),
  postalCode: z.string().min(1).max(32).optional(),
  provinceCode: z.string().min(1).max(255).optional()
})

const metaPrivacySchema = z.strictObject({
  analyticsProcessingAllowed: z.literal(true),
  marketingAllowed: z.literal(true),
  preferencesProcessingAllowed: z.boolean(),
  saleOfDataAllowed: z.literal(true)
})

const metaObservationShape = {
  ...commonObservationShape,
  schemaVersion: z.literal(
    SHOPIFY_CHECKOUT_OBSERVATION_META_SCHEMA_VERSION
  ),
  checkoutToken: z.string().min(1).max(255),
  correlation: z.strictObject({
    beginCheckoutEventId: z.string().uuid()
  }),
  commerce: commerceSchema,
  customerMatch: metaCustomerMatchSchema,
  privacy: metaPrivacySchema
}

const metaShippingObservationSchema = z.strictObject({
  ...metaObservationShape,
  eventName: z.literal('checkout_shipping_info_submitted')
})

const metaPaymentObservationSchema = z.strictObject({
  ...metaObservationShape,
  eventName: z.literal('payment_info_submitted')
})

const metaCompletedObservationSchema = z.strictObject({
  ...metaObservationShape,
  eventName: z.literal('checkout_completed'),
  orderLegacyId: z.string().regex(/^\d+$/u).max(32)
})

export const shopifyCheckoutMetaObservationSchema =
  z.discriminatedUnion('eventName', [
    metaShippingObservationSchema,
    metaPaymentObservationSchema,
    metaCompletedObservationSchema
  ])

const rawMetaObservationShape = {
  ...commonObservationShape,
  schemaVersion: z.literal(
    SHOPIFY_CHECKOUT_OBSERVATION_META_SCHEMA_VERSION
  ),
  checkoutToken: z.string().min(1).max(255),
  correlation: z.strictObject({
    beginCheckoutEventId: z.string().uuid()
  }),
  commerce: commerceSchema,
  customer: rawCustomerMatchSchema,
  privacy: metaPrivacySchema
}

const rawMetaShippingObservationSchema = z.strictObject({
  ...rawMetaObservationShape,
  eventName: z.literal('checkout_shipping_info_submitted')
})

const rawMetaPaymentObservationSchema = z.strictObject({
  ...rawMetaObservationShape,
  eventName: z.literal('payment_info_submitted')
})

const rawMetaCompletedObservationSchema = z.strictObject({
  ...rawMetaObservationShape,
  eventName: z.literal('checkout_completed'),
  orderLegacyId: z.string().regex(/^\d+$/u).max(32)
})

const alertObservationSchema = z.strictObject({
  ...commonObservationShape,
  eventName: z.literal('alert_displayed'),
  alert: z.strictObject({
    type: z.enum([
      'CHECKOUT_ERROR',
      'CONTACT_ERROR',
      'DELIVERY_ERROR',
      'PAYMENT_ERROR'
    ])
  })
})

export const shopifyCheckoutProgressObservationSchema =
  z.discriminatedUnion('eventName', [
    shippingObservationSchema,
    paymentObservationSchema
  ])

export const shopifyCheckoutObservationSchema = z.union([
  z.discriminatedUnion('eventName', [
    shippingObservationSchema,
    paymentObservationSchema,
    alertObservationSchema
  ]),
  z.discriminatedUnion('eventName', [
    canonicalShippingObservationSchema,
    canonicalPaymentObservationSchema
  ]),
  shopifyCheckoutMetaObservationSchema
])

export const shopifyCheckoutMetaObservationInputSchema =
  z.discriminatedUnion('eventName', [
    rawMetaShippingObservationSchema,
    rawMetaPaymentObservationSchema,
    rawMetaCompletedObservationSchema
  ])

export const shopifyCanonicalCheckoutProgressObservationSchema =
  z.union([
    z.discriminatedUnion('eventName', [
      canonicalShippingObservationSchema,
      canonicalPaymentObservationSchema
    ]),
    z.discriminatedUnion('eventName', [
      metaShippingObservationSchema,
      metaPaymentObservationSchema
    ])
  ])

export const shopifyCanonicalPaymentObservationSchema =
  canonicalPaymentObservationSchema

export type ShopifyCheckoutProgressObservation = z.infer<
  typeof shopifyCheckoutProgressObservationSchema
>
export type ShopifyCheckoutObservation = z.infer<
  typeof shopifyCheckoutObservationSchema
>
export type ShopifyCanonicalPaymentObservation = z.infer<
  typeof shopifyCanonicalPaymentObservationSchema
>
export type ShopifyCanonicalCheckoutProgressObservation =
  z.infer<
    typeof shopifyCanonicalCheckoutProgressObservationSchema
  >
export type ShopifyCheckoutMetaObservationInput = z.infer<
  typeof shopifyCheckoutMetaObservationInputSchema
>
export type ShopifyCheckoutMetaObservation = z.infer<
  typeof shopifyCheckoutMetaObservationSchema
>
