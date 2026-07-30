// Path: src/lib/errors/formatShopifyErrorResponse.ts

import { CartErrorCode } from '@/constants/CartErrorCode'
import type { ResponseErrors } from '@shopify/graphql-client'
import type { CartActionsResult } from 'types/cart/CartActions'
import { redactShopifyCartSecrets } from '@/lib/cart/redactShopifyCartSecrets'

export function formatShopifyErrorResponse(
  errors: ResponseErrors
): CartActionsResult {
  console.error(
    'Shopify API Errors:',
    redactShopifyCartSecrets(JSON.stringify(errors))
  )

  return {
    success: false,
    message: 'En feil oppstod ved kommunikasjon med Shopify.',
    error: CartErrorCode.API_ERROR
  }
}
