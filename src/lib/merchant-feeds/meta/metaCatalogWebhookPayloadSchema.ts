import { z } from 'zod'

const catalogChangeSchema = z
  .object({
    field: z.enum(['items_batch', 'product_feed']),
    value: z.unknown().optional()
  })
  .passthrough()

const catalogEntrySchema = z
  .object({
    id: z.string().min(1),
    time: z.number().int().optional(),
    changes: z.array(catalogChangeSchema)
  })
  .passthrough()

export const metaCatalogWebhookPayloadSchema = z
  .object({
    object: z.literal('catalog'),
    entry: z.array(catalogEntrySchema).min(1)
  })
  .passthrough()
