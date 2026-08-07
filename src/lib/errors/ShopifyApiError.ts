//Path src/lib/errors.ts
 

import type { ShopifyErrorDetail } from '@types'

export class ShopifyApiError extends Error {
  constructor(
    message: string,
    public readonly details?: ShopifyErrorDetail[],
    public readonly statusCode?: number
  ) {
    super(message)
    this.name = 'ShopifyApiError'
  }
}
