import { z } from 'zod'

const moneySchema = z
  .object({
    amount: z.string(),
    currencyCode: z.string().length(3)
  })
  .strict()

const imageSchema = z
  .object({
    id: z.string(),
    url: z.string().url(),
    altText: z.string(),
    width: z.number(),
    height: z.number()
  })
  .strict()

const cartLineSchema = z
  .object({
    id: z.string(),
    quantity: z.number().int().nonnegative(),
    cost: z
      .object({
        totalAmount: moneySchema
      })
      .strict(),
    merchandise: z
      .object({
        id: z.string(),
        title: z.string(),
        availableForSale: z.boolean(),
        price: moneySchema,
        image: imageSchema.nullable(),
        compareAtPrice: moneySchema.nullable(),
        selectedOptions: z.array(
          z
            .object({
              name: z.string(),
              value: z.string()
            })
            .strict()
        ),
        product: z
          .object({
            id: z.string(),
            title: z.string(),
            handle: z.string(),
            featuredImage: imageSchema
          })
          .passthrough()
      })
      .passthrough()
  })
  .strict()

const cartSchema = z
  .object({
    id: z.string(),
    checkoutUrl: z.string().url(),
    totalQuantity: z.number().int().nonnegative(),
    cost: z
      .object({
        totalAmount: moneySchema,
        subtotalAmount: moneySchema
      })
      .strict(),
    lines: z.array(cartLineSchema)
  })
  .strict()

export const cartActionsResultSchema = z
  .object({
    success: z.boolean(),
    message: z.string(),
    cart: cartSchema.nullable().optional(),
    error: z.string().nullable().optional()
  })
  .strict()
