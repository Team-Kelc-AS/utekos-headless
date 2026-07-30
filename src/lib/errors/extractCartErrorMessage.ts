// Path: src/lib/errors/extractCartErrorMessage.ts

import { extractErrorMessage } from './extractErrorMessage'
import { ShopifyApiError } from '@/lib/errors/ShopifyApiError'

export const extractCartErrorMessage = (
  thrown: unknown
): string => {
  if (thrown instanceof ShopifyApiError) {
    return 'En feil oppstod ved kommunikasjon med Shopify.'
  }

  const baseMessage = extractErrorMessage(thrown)
  if (baseMessage === 'En uventet feil oppstod') {
    return 'En uventet feil oppstod under behandling av handlekurven'
  }

  return baseMessage
}
