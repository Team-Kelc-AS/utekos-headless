import { z } from 'zod'

export const SHOPIFY_CHECKOUT_OBSERVATION_CONTRACT =
  'utekos.shopify.checkout_observation' as const
export const SHOPIFY_CHECKOUT_OBSERVATION_SCHEMA_VERSION =
  1 as const

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

const alertObservationSchema = z.strictObject({
  ...commonObservationShape,
  eventName: z.literal('alert_displayed'),
  alert: z.strictObject({
    type: z.enum(['CHECKOUT_ERROR', 'PAYMENT_ERROR'])
  })
})

export const shopifyCheckoutProgressObservationSchema =
  z.discriminatedUnion('eventName', [
    shippingObservationSchema,
    paymentObservationSchema
  ])

export const shopifyCheckoutObservationSchema =
  z.discriminatedUnion('eventName', [
    shippingObservationSchema,
    paymentObservationSchema,
    alertObservationSchema
  ])

export type ShopifyCheckoutProgressObservation = z.infer<
  typeof shopifyCheckoutProgressObservationSchema
>
export type ShopifyCheckoutObservation = z.infer<
  typeof shopifyCheckoutObservationSchema
>
