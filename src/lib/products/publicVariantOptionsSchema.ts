import * as z from '@/lib/validation/zodMini'

export const publicProductOptionKeySchema = z.enum([
  'color',
  'size',
  'gender'
])

export const publicVariantOptionsSchema = z.partialRecord(
  publicProductOptionKeySchema,
  z.string().check(z.minLength(1))
)

export type PublicVariantOptions = z.infer<
  typeof publicVariantOptionsSchema
>
