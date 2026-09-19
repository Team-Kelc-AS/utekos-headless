import * as z from '@/lib/validation/zodMini'

import { publicProductOptionKeySchema } from '../publicVariantOptionsSchema'
export { publicProductOptionKeySchema } from '../publicVariantOptionsSchema'

const publicProductOptionSchema = z.strictObject({
  key: publicProductOptionKeySchema,
  publicName: z.string().check(z.minLength(1)),
  publicParam: z.string().check(z.regex(/^[a-z0-9-]+$/)),
  shopifyNames: z
    .array(z.string().check(z.minLength(1)))
    .check(z.minLength(1)),
  valueMap: z.record(
    z.string().check(z.minLength(1)),
    z.string().check(z.minLength(1))
  ),
  defaultPublicValue: z.optional(
    z.string().check(z.minLength(1))
  )
})

const productMediaPresentationSchema = z.strictObject({
  defaultAlt: z.string().check(z.minLength(1)),
  variantAltPrefix: z.string().check(z.minLength(1))
})

export const productPresentationDefinitionSchema = z
  .strictObject({
    publicHandle: z.string().check(z.regex(/^[a-z0-9-]+$/)),
    displayName: z.string().check(z.minLength(1)),
    description: z.string().check(z.minLength(40)),
    options: z
      .array(publicProductOptionSchema)
      .check(z.maxLength(3)),
    hiddenOptionValues: z._default(
      z.partialRecord(
        publicProductOptionKeySchema,
        z.array(z.string().check(z.minLength(1)))
      ),
      {}
    ),
    media: productMediaPresentationSchema,
    category: z.string().check(z.minLength(1)),
    material: z.string().check(z.minLength(1)),
    audience: z.string().check(z.minLength(1))
  })
  .check(
    z.superRefine((definition, context) => {
      const optionKeys = definition.options.map(
        option => option.key
      )
      const uniqueOptionKeys = new Set(optionKeys)

      if (uniqueOptionKeys.size !== optionKeys.length) {
        context.addIssue({
          code: 'custom',
          path: ['options'],
          message: 'Option keys must be unique'
        })
      }
    })
  )

export type PublicProductOptionKey = z.infer<
  typeof publicProductOptionKeySchema
>

export type ProductPresentationDefinition = z.infer<
  typeof productPresentationDefinitionSchema
>
