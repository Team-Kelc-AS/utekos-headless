import { z } from 'zod'

import { DUN_WAITLIST_SHOPIFY_QUEUE_NAME } from './dunWaitlistShopifyQueueConfig'

export { DUN_WAITLIST_SHOPIFY_QUEUE_NAME }

export const dunWaitlistShopifyQueueMessageSchema = z.strictObject({
  schema_version: z.literal(1),
  lead_id: z.string().uuid()
})

export type DunWaitlistShopifyQueueMessage = z.infer<
  typeof dunWaitlistShopifyQueueMessageSchema
>
