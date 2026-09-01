export class ShopifyStorefrontHttpError extends Error {
  readonly status: number
  readonly requestId: string | null

  constructor(status: number, requestId: string | null = null) {
    super(`Shopify Storefront API returned HTTP ${status}.`)
    this.name = 'ShopifyStorefrontHttpError'
    this.status = status
    this.requestId = requestId
  }
}

export function isShopifyStorefrontHttpError(
  error: unknown
): error is ShopifyStorefrontHttpError {
  if (error instanceof ShopifyStorefrontHttpError) return true
  if (!(error instanceof Error)) return false

  const candidate = error as Error & { status?: unknown }

  return (
    candidate.name === 'ShopifyStorefrontHttpError' &&
    typeof candidate.status === 'number'
  )
}
