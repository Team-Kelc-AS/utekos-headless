import { isIP } from 'node:net'
import { ipAddress } from '@vercel/functions'
import type { StorefrontBuyerContext } from './StorefrontGatewayContract'

type ResolveIpAddress = (
  requestHeaders: Headers
) => string | undefined

export function createStorefrontBuyerContext(
  requestHeaders: Headers,
  resolveIpAddress: ResolveIpAddress = ipAddress
): StorefrontBuyerContext {
  const candidate = resolveIpAddress(requestHeaders)?.trim()

  return {
    buyerIp:
      candidate && isIP(candidate) !== 0 ? candidate : null
  }
}
