import * as z from '@/lib/validation/zodMini'
import type {
  StorefrontProductOptions,
  StorefrontProductOptionsVariables
} from '@/api/shopify/types/storefrontProductOptions'

const selectedOptionSchema = z.object({
  name: z.string().check(z.minLength(1)),
  value: z.string().check(z.minLength(1))
})

const storefrontProductOptionsVariablesSchema = z.object({
  handle: z.string().check(z.minLength(1)),
  selectedOptions: z.array(selectedOptionSchema)
})

const moneySchema = z.object({
  amount: z.string().check(z.regex(/^\d+(?:\.\d+)?$/)),
  currencyCode: z.literal('NOK')
})

const productOptionVariantSchema = z.object({
  id: z.string().check(z.minLength(1)),
  availableForSale: z.boolean(),
  product: z.object({
    handle: z.string().check(z.minLength(1))
  }),
  selectedOptions: z
    .array(selectedOptionSchema)
    .check(z.minLength(1)),
  title: z.string().check(z.minLength(1)),
  barcode: z.nullable(z.string()),
  currentlyNotInStock: z.boolean(),
  taxable: z.boolean(),
  quantityAvailable: z.nullable(z.number()),
  sku: z.nullable(z.string()),
  price: moneySchema,
  compareAtPrice: z.nullable(moneySchema)
})

const storefrontProductOptionsSchema = z.object({
  id: z.string().check(z.minLength(1)),
  title: z.string().check(z.minLength(1)),
  handle: z.string().check(z.minLength(1)),
  productType: z.string(),
  vendor: z.string(),
  collections: z.object({
    nodes: z.array(
      z.object({
        id: z.string().check(z.minLength(1)),
        title: z.string()
      })
    )
  }),
  encodedVariantExistence: z.string(),
  encodedVariantAvailability: z.string(),
  options: z.array(
    z.object({
      name: z.string().check(z.minLength(1)),
      optionValues: z.array(
        z.object({
          name: z.string().check(z.minLength(1)),
          firstSelectableVariant: z.nullable(
            productOptionVariantSchema
          )
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
