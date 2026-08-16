import { ShopifyCatalogGraphQLError } from './ShopifyCatalogGraphQLError'

export function isRetryableShopifyCatalogError(error: unknown): boolean {
  if (error instanceof ShopifyCatalogGraphQLError) {
    return false
  }

  if (error instanceof DOMException) {
    return error.name === 'TimeoutError' || error.name === 'AbortError'
  }

  if (!(error instanceof Error)) {
    return false
  }

  if (error.name === 'TimeoutError' || error.name === 'AbortError') {
    return true
  }

  if (error.name === 'TypeError') {
    return /fetch failed|network|ECONNRESET|ETIMEDOUT|ENOTFOUND/i.test(
      error.message
    )
  }

  return /aborted due to timeout/i.test(error.message)
}
