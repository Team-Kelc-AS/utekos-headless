import { z } from 'zod'

export const addCartLinesRequestSchema = z
  .object({
    lines: z
      .array(
        z
          .object({
            variantId: z.string().min(1),
            quantity: z.number().int().min(1).max(100)
          })
          .strict()
      )
      .min(1),
    discountCode: z.string().trim().min(1).max(255).optional()
  })
  .strict()
