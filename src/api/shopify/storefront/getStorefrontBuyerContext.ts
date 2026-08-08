import 'server-only'

import { headers } from 'next/headers'
import { createStorefrontBuyerContext } from './createStorefrontBuyerContext'
import type { StorefrontBuyerContext } from './StorefrontGatewayContract'

export async function getStorefrontBuyerContext(): Promise<StorefrontBuyerContext> {
  return createStorefrontBuyerContext(await headers())
}
