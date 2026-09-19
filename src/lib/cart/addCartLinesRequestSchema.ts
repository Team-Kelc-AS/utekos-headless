import * as z from '@/lib/validation/zodMini'

export const addCartLinesRequestSchema = z.strictObject({
  lines: z
    .array(
      z.strictObject({
        variantId: z.string().check(z.minLength(1)),
        quantity: z.number().check(z.int(), z.gte(1), z.lte(100))
      })
    )
    .check(z.minLength(1)),
  discountCode: z.optional(
    z.string().check(z.trim(), z.minLength(1), z.maxLength(255))
  )
})
