import { z } from 'zod'

export const DUN_WAITLIST_SHOPIFY_QUEUE_NAME =
  'shopify_dun_waitlist_sync' as const

export const dunWaitlistShopifyQueueMessageSchema = z.strictObject({
  schema_version: z.literal(1),
  lead_id: z.string().uuid()
})

export type DunWaitlistShopifyQueueMessage = z.infer<
  typeof dunWaitlistShopifyQueueMessageSchema
>
