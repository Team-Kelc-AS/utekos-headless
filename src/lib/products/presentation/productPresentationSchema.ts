import { z } from 'zod'

import { publicProductOptionKeySchema } from '../publicVariantOptionsSchema'
export { publicProductOptionKeySchema } from '../publicVariantOptionsSchema'

const publicProductOptionSchema = z.strictObject({
  key: publicProductOptionKeySchema,
  publicName: z.string().min(1),
  publicParam: z.string().regex(/^[a-z0-9-]+$/),
  shopifyNames: z.array(z.string().min(1)).min(1),
  valueMap: z.record(z.string().min(1), z.string().min(1)),
  defaultPublicValue: z.string().min(1).optional()
})

const productMediaPresentationSchema = z.strictObject({
  defaultAlt: z.string().min(1),
  variantAltPrefix: z.string().min(1)
})

export const productPresentationDefinitionSchema = z
  .strictObject({
    publicHandle: z.string().regex(/^[a-z0-9-]+$/),
    displayName: z.string().min(1),
    description: z.string().min(40),
    options: z.array(publicProductOptionSchema).max(3),
    hiddenOptionValues: z
      .partialRecord(
        publicProductOptionKeySchema,
        z.array(z.string().min(1))
      )
      .default({}),
    media: productMediaPresentationSchema,
    category: z.string().min(1),
    material: z.string().min(1),
    audience: z.string().min(1)
  })
  .superRefine((definition, context) => {
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

export type PublicProductOptionKey = z.infer<
  typeof publicProductOptionKeySchema
>

export type ProductPresentationDefinition = z.infer<
  typeof productPresentationDefinitionSchema
>
