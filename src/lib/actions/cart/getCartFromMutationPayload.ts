import type {
  StorefrontCart,
  StorefrontCartUserError,
  StorefrontCartWarning
} from '@/api/shopify/types/storefrontApi'
import { ShopifyApiError } from '@/lib/errors/ShopifyApiError'

type CartMutationPayload = {
  cart: StorefrontCart | null
  userErrors: StorefrontCartUserError[]
  warnings: StorefrontCartWarning[]
}

export function getCartFromMutationPayload(
  operation: string,
  payload: CartMutationPayload
): StorefrontCart {
  if (payload.userErrors.length > 0) {
    throw new ShopifyApiError(
      payload.userErrors[0]?.message ?? `${operation} ble avvist av Shopify.`,
      payload.userErrors.map(error => ({
        message: error.message,
        extensions: {
          code: error.code,
          field: error.field
        }
      }))
    )
  }

  if (payload.warnings.length > 0) {
    console.warn(`Shopify cart warnings from ${operation}:`, payload.warnings)
  }

  if (!payload.cart) {
    throw new ShopifyApiError(`${operation} returnerte ingen handlekurv.`)
  }

  return payload.cart
}
