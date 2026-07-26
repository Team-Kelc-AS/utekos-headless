import { z } from 'zod'
import type {
  StorefrontProductOptions,
  StorefrontProductOptionsVariables
} from '@/api/shopify/types/storefrontProductOptions'

const selectedOptionSchema = z.object({
  name: z.string().min(1),
  value: z.string().min(1)
})

const storefrontProductOptionsVariablesSchema = z.object({
  handle: z.string().min(1),
  selectedOptions: z.array(selectedOptionSchema)
})

const productOptionVariantSchema = z.object({
  id: z.string().min(1),
  availableForSale: z.boolean(),
  product: z.object({ handle: z.string().min(1) }),
  selectedOptions: z.array(selectedOptionSchema).min(1)
})

const storefrontProductOptionsSchema = z.object({
  handle: z.string().min(1),
  encodedVariantExistence: z.string(),
  encodedVariantAvailability: z.string(),
  options: z.array(
    z.object({
      name: z.string().min(1),
      optionValues: z.array(
        z.object({
          name: z.string().min(1),
          firstSelectableVariant:
            productOptionVariantSchema.nullable()
        })
      )
    })
  ),
  selectedOrFirstAvailableVariant: productOptionVariantSchema,
  adjacentVariants: z.array(productOptionVariantSchema)
})

export function parseStorefrontProductOptions(
  input: unknown
): StorefrontProductOptions {
  const result = storefrontProductOptionsSchema.safeParse(input)

  if (!result.success) {
    throw new Error('Invalid Shopify product-options response')
  }

  return result.data
}

export function parseStorefrontProductOptionsVariables(
  input: unknown
): StorefrontProductOptionsVariables {
  const result =
    storefrontProductOptionsVariablesSchema.safeParse(input)

  if (!result.success) {
    throw new Error('Invalid Shopify product-options variables')
  }

  return result.data
}
