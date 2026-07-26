import { isValidationErrorLike } from 'zod-validation-error'
import { isShopifyErrorResponse } from '@/lib/errors/isShopifyErrorResponse'
import { MissingCartIdError } from '@/lib/errors/MissingCartIdError'
import { ShopifyApiError } from '@/lib/errors/ShopifyApiError'
import { extractCartErrorMessage } from './extractCartErrorMessage'
import { formatShopifyErrorResponse } from './formatShopifyErrorResponse'
import {
  CartErrorCode,
  type CartErrorCodeType
} from '@/constants/CartErrorCode'
import type { CartActionsResult } from 'types/cart'

export function mapThrownErrorToActionResult(
  thrown: unknown
): CartActionsResult {
  if (isShopifyErrorResponse(thrown)) {
    return formatShopifyErrorResponse(thrown)
  }

  let errorCode: CartErrorCodeType
  if (isValidationErrorLike(thrown)) {
    errorCode = CartErrorCode.VALIDATION_ERROR
  } else if (thrown instanceof MissingCartIdError) {
    errorCode = CartErrorCode.MISSING_CART_ID
  } else if (thrown instanceof ShopifyApiError) {
    errorCode = CartErrorCode.API_ERROR
  } else {
    errorCode = CartErrorCode.UNEXPECTED_SERVER_ERROR
  }

  const message = extractCartErrorMessage(thrown)

  return {
    success: false,
    message,
    error: errorCode
  }
}
