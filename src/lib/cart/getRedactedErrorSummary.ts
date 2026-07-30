import { redactShopifyCartSecrets } from '@/lib/cart/redactShopifyCartSecrets'

export function getRedactedErrorSummary(error: unknown) {
  return {
    errorName:
      error instanceof Error ? error.name : 'UnknownError',
    errorMessage:
      error instanceof Error ?
        redactShopifyCartSecrets(error.message)
      : 'Unknown error'
  }
}
