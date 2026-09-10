import { z } from 'zod'

export const shopifyTransactionalEmailNotificationTypes = [
  'order_confirmation',
  'shipping_confirmation',
  'shipment_out_for_delivery',
  'shipment_delivered'
] as const

export const shopifyTransactionalEmailLiveNotificationTypes:
readonly ShopifyTransactionalEmailNotificationType[] = [
  'shipment_out_for_delivery',
  'shipment_delivered'
]

const baseSchema = z.strictObject({
  contract: z.literal(
    'utekos.shopify.transactional_email_evidence'
  ),
  schemaVersion: z.literal(1),
  source: z.literal('shopify_app_webhook'),
  verificationStatus: z.literal('shopify_hmac_verified'),
  webhookId: z.string().uuid(),
  occurredAt: z.string().datetime({ offset: true }),
  shopifyOrderId: z.string()
    .regex(/^gid:\/\/shopify\/Order\/[1-9][0-9]{0,19}$/u),
  shopDomain: z.string()
    .regex(/^[a-z0-9][a-z0-9-]*\.myshopify\.com$/u)
})

export const shopifyTransactionalEmailEvidenceSchema =
  z.discriminatedUnion('notificationType', [
    baseSchema.extend({
      eventName: z.literal('orders/create'),
      notificationType: z.literal('order_confirmation'),
      shopifyFulfillmentId: z.null()
    }),
    baseSchema.extend({
      eventName: z.literal('fulfillments/create'),
      notificationType: z.literal('shipping_confirmation'),
      shopifyFulfillmentId: z.string()
        .regex(/^gid:\/\/shopify\/Fulfillment\/[1-9][0-9]{0,19}$/u)
    }),
    baseSchema.extend({
      eventName: z.literal('fulfillments/update'),
      notificationType: z.literal('shipment_out_for_delivery'),
      shopifyFulfillmentId: z.string()
        .regex(/^gid:\/\/shopify\/Fulfillment\/[1-9][0-9]{0,19}$/u)
    }),
    baseSchema.extend({
      eventName: z.literal('fulfillments/update'),
      notificationType: z.literal('shipment_delivered'),
      shopifyFulfillmentId: z.string()
        .regex(/^gid:\/\/shopify\/Fulfillment\/[1-9][0-9]{0,19}$/u)
    })
  ])

export type ShopifyTransactionalEmailEvidence = z.infer<
  typeof shopifyTransactionalEmailEvidenceSchema
>

export type ShopifyTransactionalEmailNotificationType =
  ShopifyTransactionalEmailEvidence['notificationType']
