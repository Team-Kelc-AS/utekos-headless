export const SHOPIFY_ADMIN_THROTTLE_RETRY_DELAY_MS = 1_000

export class ShopifyAdminThrottleError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ShopifyAdminThrottleError'
  }
}

type ShopifyGraphqlError = { extensions?: { code?: unknown } }

export function hasShopifyAdminGraphqlErrorCode(
  errors: unknown,
  code: string
) {
  return (
    Array.isArray(errors) &&
    errors.some(error => {
      if (!error || typeof error !== 'object') {
        return false
      }

      const graphqlError = error as ShopifyGraphqlError

      return graphqlError.extensions?.code === code
    })
  )
}

type RetryShopifyAdminThrottleOptions = {
  onRetry?: (error: ShopifyAdminThrottleError) => void
  sleep?: (milliseconds: number) => Promise<void>
}

function sleep(milliseconds: number) {
  return new Promise<void>(resolve => {
    setTimeout(resolve, milliseconds)
  })
}

/**
 * Shopify recommends a minimum one-second backoff after a rate-limit error.
 * Keep this bounded to one retry so a feed request cannot retry indefinitely.
 */
export async function retryShopifyAdminThrottle<T>(
  operation: () => Promise<T>,
  options: RetryShopifyAdminThrottleOptions = {}
): Promise<T> {
  try {
    return await operation()
  } catch (error) {
    if (!(error instanceof ShopifyAdminThrottleError)) {
      throw error
    }

    options.onRetry?.(error)
    await (options.sleep ?? sleep)(
      SHOPIFY_ADMIN_THROTTLE_RETRY_DELAY_MS
    )

    return operation()
  }
}
