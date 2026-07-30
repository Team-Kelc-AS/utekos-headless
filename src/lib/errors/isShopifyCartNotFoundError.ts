import { z } from 'zod'

import { ShopifyApiError } from '@/lib/errors/ShopifyApiError'

const cartErrorExtensionsSchema = z.object({
  code: z.string().optional(),
  field: z.array(z.string()).optional()
})

const CART_NOT_FOUND_MESSAGES = new Set([
  'den angitte handlekurven finnes ikke.',
  'the specified cart does not exist.'
])

export function isShopifyCartNotFoundError(
  error: unknown
): error is ShopifyApiError {
  if (!(error instanceof ShopifyApiError)) {
    return false
  }

  const messages = [
    error.message,
    ...(error.details?.map(detail => detail.message) ?? [])
  ]

  if (
    messages.some(message =>
      CART_NOT_FOUND_MESSAGES.has(message.trim().toLowerCase())
    )
  ) {
    return true
  }

  return (
    error.details?.some(detail => {
      const parsed = cartErrorExtensionsSchema.safeParse(
        detail.extensions
      )

      return (
        parsed.success &&
        parsed.data.code === 'INVALID' &&
        parsed.data.field?.some(
          field => field.toLowerCase() === 'cartid'
        ) === true
      )
    }) ?? false
  )
}
