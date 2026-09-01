import { ShopifyCatalogGraphQLError } from './ShopifyCatalogGraphQLError'
import { isShopifyStorefrontHttpError } from '@/api/shopify/request/ShopifyStorefrontHttpError'

export function isRetryableShopifyCatalogError(
  error: unknown
): boolean {
  if (isShopifyStorefrontHttpError(error)) {
    return (
      error.status === 408 ||
      error.status === 429 ||
      error.status >= 500
    )
  }

  if (error instanceof ShopifyCatalogGraphQLError) {
    return (
      error.graphqlErrorCode === 'THROTTLED' ||
      error.graphqlErrorCode === 'INTERNAL_SERVER_ERROR'
    )
  }

  if (error instanceof DOMException) {
    return (
      error.name === 'TimeoutError' ||
      error.name === 'AbortError'
    )
  }

  if (!(error instanceof Error)) {
    return false
  }

  if (
    error.name === 'TimeoutError' ||
    error.name === 'AbortError'
  ) {
    return true
  }

  if (error.name === 'TypeError') {
    return /fetch failed|network|ECONNRESET|ETIMEDOUT|ENOTFOUND/i.test(
      error.message
    )
  }

  return /aborted due to timeout/i.test(error.message)
}
