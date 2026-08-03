import { z } from 'zod'

export const CHECKOUT_METHOD_HEADER =
  'X-Utekos-Checkout-Method'

export const checkoutMethodSchema = z.enum([
  'shopify_checkout',
  'klarna_express'
])

export type CheckoutMethod = z.infer<
  typeof checkoutMethodSchema
>

export function readCheckoutMethod(headers: Headers): CheckoutMethod {
  const parsed = checkoutMethodSchema.safeParse(
    headers.get(CHECKOUT_METHOD_HEADER)
  )

  return parsed.success ? parsed.data : 'shopify_checkout'
}
