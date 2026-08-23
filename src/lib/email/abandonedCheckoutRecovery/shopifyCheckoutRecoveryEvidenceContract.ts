import { z } from 'zod'

export const SHOPIFY_CHECKOUT_RECOVERY_EVIDENCE_CONTRACT =
  'utekos.shopify.checkout_recovery_evidence' as const
export const SHOPIFY_CHECKOUT_RECOVERY_EVIDENCE_SCHEMA_VERSION =
  1 as const

const fieldPresenceSchema = z.strictObject({
  contactPhone: z.boolean(),
  firstName: z.boolean(),
  lastName: z.boolean(),
  address1: z.boolean(),
  address2: z.boolean(),
  city: z.boolean(),
  countryCode: z.boolean(),
  postalCode: z.boolean(),
  shippingPhone: z.boolean()
})

export const shopifyCheckoutRecoveryEvidenceSchema =
  z.strictObject({
    contract: z.literal(
      SHOPIFY_CHECKOUT_RECOVERY_EVIDENCE_CONTRACT
    ),
    schemaVersion: z.literal(
      SHOPIFY_CHECKOUT_RECOVERY_EVIDENCE_SCHEMA_VERSION
    ),
    source: z.literal('shopify_app_web_pixel'),
    verificationStatus: z.literal('observed'),
    eventId: z.string().min(1).max(255),
    eventName: z.enum([
      'checkout_contact_info_submitted',
      'checkout_address_info_submitted'
    ]),
    eventSequence: z
      .number()
      .int()
      .nonnegative()
      .max(2_147_483_647),
    occurredAt: z.string().datetime({ offset: true }),
    checkoutToken: z.string().min(1).max(255),
    beginCheckoutEventId: z.string().uuid(),
    email: z.email().max(320),
    buyerAcceptsEmailMarketing: z.boolean(),
    buyerAcceptsSmsMarketing: z.boolean(),
    fieldPresence: fieldPresenceSchema
  })

export type ShopifyCheckoutRecoveryEvidence = z.infer<
  typeof shopifyCheckoutRecoveryEvidenceSchema
>

export type ProtectedShopifyCheckoutRecoveryEvidence = Omit<
  ShopifyCheckoutRecoveryEvidence,
  'email'
> & {
  recipientFingerprint: string
}

export const shopifyCheckoutRecoveryWebhookEvidenceSchema =
  z.strictObject({
    contract: z.literal(
      SHOPIFY_CHECKOUT_RECOVERY_EVIDENCE_CONTRACT
    ),
    schemaVersion: z.literal(2),
    source: z.literal('shopify_checkouts_update_webhook'),
    verificationStatus: z.literal('shopify_hmac_verified'),
    webhookId: z.string().min(1).max(255),
    eventName: z.literal('checkouts/update'),
    occurredAt: z.string().datetime({ offset: true }),
    checkoutCreatedAt: z.string().datetime({ offset: true }),
    checkoutToken: z.string().min(1).max(255),
    beginCheckoutEventId: z.string().uuid(),
    email: z.email().max(320),
    buyerAcceptsEmailMarketing: z.boolean(),
    shopDomain: z
      .string()
      .regex(/^[a-z0-9][a-z0-9-]*\.myshopify\.com$/)
  })
  .superRefine((evidence, context) => {
    if (
      Date.parse(evidence.occurredAt)
      < Date.parse(evidence.checkoutCreatedAt)
    ) {
      context.addIssue({
        code: 'custom',
        message: 'occurredAt cannot precede checkoutCreatedAt',
        path: ['occurredAt']
      })
    }
  })

export type ShopifyCheckoutRecoveryWebhookEvidence = z.infer<
  typeof shopifyCheckoutRecoveryWebhookEvidenceSchema
>

export type ProtectedShopifyCheckoutRecoveryWebhookEvidence = Omit<
  ShopifyCheckoutRecoveryWebhookEvidence,
  'email'
> & {
  recipientFingerprint: string
}
