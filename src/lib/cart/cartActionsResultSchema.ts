import * as z from '@/lib/validation/zodMini'
import { CART_CHECKOUT_PATH } from '@/lib/cart/cartCheckoutPath'
import { shopifyPublicCartIdSchema } from '@/lib/cart/shopifyPublicCartIdSchema'

const moneySchema = z.strictObject({
  amount: z.string(),
  currencyCode: z.string().check(z.length(3))
})

const imageSchema = z.strictObject({
  id: z.string(),
  url: z.string().check(z.url()),
  altText: z.string(),
  width: z.number(),
  height: z.number()
})

const cartLineSchema = z.strictObject({
  id: z.string(),
  quantity: z.number().check(z.int(), z.gte(0)),
  cost: z.strictObject({ totalAmount: moneySchema }),
  merchandise: z.looseObject({
    id: z.string(),
    title: z.string(),
    availableForSale: z.boolean(),
    price: moneySchema,
    image: z.nullable(imageSchema),
    compareAtPrice: z.nullable(moneySchema),
    selectedOptions: z.array(
      z.strictObject({ name: z.string(), value: z.string() })
    ),
    product: z.strictObject({
      id: z.string(),
      title: z.string(),
      handle: z.string(),
      vendor: z.string(),
      productType: z.string()
    })
  })
})

const cartSchema = z.strictObject({
  id: shopifyPublicCartIdSchema,
  checkoutUrl: z.literal(CART_CHECKOUT_PATH),
  totalQuantity: z.number().check(z.int(), z.gte(0)),
  cost: z.strictObject({
    totalAmount: moneySchema,
    subtotalAmount: moneySchema
  }),
  lines: z.array(cartLineSchema)
})

export const cartActionsResultSchema = z.strictObject({
  success: z.boolean(),
  message: z.string(),
  cart: z.optional(z.nullable(cartSchema)),
  error: z.optional(z.nullable(z.string()))
})
