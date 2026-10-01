import { getRedactedErrorSummary } from '@/lib/cart/getRedactedErrorSummary'

/**
 * Logs a cart-related error with a properly serialized error summary.
 * Using console.error with an object as a second argument results in
 * '[object Object]' in log messages; JSON.stringify ensures the error
 * details are readable.
 */
export function logCartError(message: string, error: unknown): void {
  console.error(
    message,
    JSON.stringify(getRedactedErrorSummary(error))
  )
}
