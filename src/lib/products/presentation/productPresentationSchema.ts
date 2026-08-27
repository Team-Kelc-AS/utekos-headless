import { z } from 'zod'

export const publicProductOptionKeySchema = z.enum([
  'color',
  'size',
  'gender'
])

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
    productKey: z.string().regex(/^[a-z0-9-]+$/),
    publicHandle: z.string().regex(/^[a-z0-9-]+$/),
    canonicalPath: z.string().startsWith('/produkter/'),
    storefrontLookupHandle: z.string().regex(/^[a-z0-9-]+$/),
    displayName: z.string().min(1),
    productGroupID: z.string().regex(/^[a-z0-9-]+$/),
    contentKey: z.string().regex(/^[a-z0-9-]+$/),
    description: z.string().min(40),
    publicOptionOrder: z
      .array(publicProductOptionKeySchema)
      .max(3),
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
    audience: z.string().min(1),
    suggestedMinAge: z.literal(13).optional()
  })
  .superRefine((definition, context) => {
    if (
      definition.canonicalPath !==
      `/produkter/${definition.publicHandle}`
    ) {
      context.addIssue({
        code: 'custom',
        path: ['canonicalPath'],
        message:
          'canonicalPath must use the registered publicHandle'
      })
    }

    const optionKeys = definition.options.map(option => option.key)
    const uniqueOptionKeys = new Set(optionKeys)

    if (uniqueOptionKeys.size !== optionKeys.length) {
      context.addIssue({
        code: 'custom',
        path: ['options'],
        message: 'Option keys must be unique'
      })
    }

    if (
      definition.publicOptionOrder.some(
        optionKey => !uniqueOptionKeys.has(optionKey)
      )
    ) {
      context.addIssue({
        code: 'custom',
        path: ['publicOptionOrder'],
        message:
          'Every public option must have a matching option contract'
      })
    }
  })

export type PublicProductOptionKey = z.infer<
  typeof publicProductOptionKeySchema
>

export type ProductPresentationDefinition = z.infer<
  typeof productPresentationDefinitionSchema
>
