import { z } from 'zod'

const messageSchema = z
  .object({ message: z.string().min(1) })
  .passthrough()

export const metaCatalogItemsBatchResponseSchema = z.object({
  handles: z.array(z.string().min(1)).max(1),
  validation_status: z.array(
    z
      .object({
        retailer_id: z.string().min(1),
        errors: z.array(messageSchema).optional().default([]),
        warnings: z.array(messageSchema).optional().default([])
      })
      .passthrough()
  )
})

const batchStatusSchema = z
  .object({
    handle: z.string().min(1),
    status: z.string().min(1),
    errors_total_count: z.number().int().min(0).optional().default(0),
    warnings_total_count: z
      .number()
      .int()
      .min(0)
      .optional()
      .default(0),
    ids_of_invalid_requests: z
      .array(z.string())
      .optional()
      .default([]),
    errors: z.array(messageSchema).optional().default([]),
    warnings: z.array(messageSchema).optional().default([])
  })
  .passthrough()

export const metaCatalogBatchStatusResponseSchema = z.object({
  data: z.array(batchStatusSchema).max(1)
})

export const metaGraphErrorResponseSchema = z
  .object({
    error: z
      .object({
        message: z.string().optional(),
        type: z.string().optional(),
        code: z.number().optional(),
        error_subcode: z.number().optional(),
        fbtrace_id: z.string().optional()
      })
      .passthrough()
  })
  .passthrough()
