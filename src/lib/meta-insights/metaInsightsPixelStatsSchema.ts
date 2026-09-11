import { z } from 'zod'

export const metaInsightsPixelStatItemSchema = z.object({
  count: z.number(),
  value: z.string()
})

export const metaInsightsPixelStatsResponseSchema = z
  .object({
    data: z.array(
      z
        .object({
          aggregation: z.string().optional(),
          data: z.array(metaInsightsPixelStatItemSchema).optional(),
          start_time: z.string().optional()
        })
        .passthrough()
    )
  })
  .passthrough()
