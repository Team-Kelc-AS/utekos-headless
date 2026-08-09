import { z } from 'zod'

/**
 * Shopify Admin REST webhook payload for topic `carts/update`
 * (API version 2026-04). Official sample:
 * https://shopify.dev/docs/api/admin-rest/2026-04/resources/webhook
 *
 * Snapshot-only: the payload is the cart *after* the update, not a
 * line-item diff. Removals require a prior snapshot.
 */
const shopifyMoneySchema = z.strictObject({
  amount: z.string().min(1),
  currency_code: z
    .string()
    .trim()
    .regex(/^[A-Za-z]{3}$/)
    .transform(value => value.toUpperCase())
})

const shopifyMoneySetSchema = z.strictObject({
  shop_money: shopifyMoneySchema,
  presentment_money: shopifyMoneySchema
})

/**
 * Shopify cart line IDs in webhook samples can exceed
 * Number.MAX_SAFE_INTEGER. Accept number|string and normalize to
 * decimal string so Zod never applies `.safe()` int bounds.
 */
const shopifyResourceIdSchema = z
  .union([z.number(), z.string().min(1)])
  .transform((value, ctx) => {
    const asString = String(value).trim()
    if (!/^\d+$/.test(asString) && !asString.startsWith('gid://')) {
      ctx.addIssue({
        code: 'custom',
        message: 'invalid_shopify_resource_id'
      })
      return z.NEVER
    }
    return asString
  })

const shopifyCartLineItemSchema = z
  .object({
    id: shopifyResourceIdSchema,
    properties: z.unknown().nullable().optional(),
    quantity: z.number().int().nonnegative(),
    variant_id: shopifyResourceIdSchema,
    key: z.string().min(1).optional().nullable(),
    discounted_price: z.string().min(1).optional().nullable(),
    discounts: z.array(z.unknown()).optional(),
    gift_card: z.boolean().optional(),
    grams: z.number().optional().nullable(),
    line_price: z.string().min(1).optional().nullable(),
    original_line_price: z.string().min(1).optional().nullable(),
    original_price: z.string().min(1).optional().nullable(),
    price: z.string().min(1),
    product_id: shopifyResourceIdSchema,
    sku: z.string().nullable().optional(),
    taxable: z.boolean().optional(),
    title: z.string().min(1),
    total_discount: z.string().optional().nullable(),
    vendor: z.string().nullable().optional(),
    discounted_price_set: shopifyMoneySetSchema.optional(),
    line_price_set: shopifyMoneySetSchema.optional(),
    original_line_price_set: shopifyMoneySetSchema.optional(),
    price_set: shopifyMoneySetSchema.optional(),
    total_discount_set: shopifyMoneySetSchema.optional(),
    parent_relationship: z.unknown().nullable().optional()
  })
  .passthrough()

export const shopifyCartsUpdateWebhookSchema = z
  .object({
    id: z.union([z.string().min(1), z.number()]),
    token: z.union([z.string().min(1), z.number()]),
    line_items: z.array(shopifyCartLineItemSchema),
    note: z.string().nullable().optional(),
    updated_at: z.string().min(1),
    created_at: z.string().min(1).optional()
  })
  .passthrough()

export type ShopifyCartsUpdateWebhook = z.infer<
  typeof shopifyCartsUpdateWebhookSchema
>

export type ShopifyCartsUpdateLineItem = z.infer<
  typeof shopifyCartLineItemSchema
>

export const SHOPIFY_CARTS_UPDATE_API_VERSION = '2026-04' as const
export const SHOPIFY_CARTS_UPDATE_TOPIC = 'carts/update' as const
