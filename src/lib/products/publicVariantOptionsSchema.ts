import { z } from 'zod'

export const publicProductOptionKeySchema = z.enum([
  'color',
  'size',
  'gender'
])

export const publicVariantOptionsSchema = z.partialRecord(
  publicProductOptionKeySchema,
  z.string().min(1)
)

export type PublicVariantOptions = z.infer<
  typeof publicVariantOptionsSchema
>
