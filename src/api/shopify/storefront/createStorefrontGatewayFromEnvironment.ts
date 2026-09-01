import {
  STOREFRONT_API_VERSION,
  type ShopifyStorefrontEnvironment
} from '@/db/config/shopify.config'
import {
  createHydrogenStorefrontGateway,
  type HydrogenStorefrontGatewayConfig
} from './createHydrogenStorefrontGateway'
import type { StorefrontGateway } from './StorefrontGatewayContract'

function normalizeStoreDomain(value: string | undefined): string {
  const normalized = value
    ?.trim()
    .replace(/^https?:\/\//, '')
    .replace(/\/.*$/, '')

  if (!normalized) {
    throw new Error('STORE_DOMAIN is not defined')
  }

  return normalized
}

export function buildStorefrontGatewayConfigFromEnvironment(
  environment: ShopifyStorefrontEnvironment
): HydrogenStorefrontGatewayConfig {
  const storeDomain = environment.STORE_DOMAIN
  const storefrontAccessToken =
    environment.NEXT_PUBLIC_STOREFRONT_ACCESS_TOKEN?.trim()
  const privateStorefrontAccessToken =
    environment.STOREFRONT_PRIVATE_ACCESS_TOKEN?.trim()

  return {
    storeDomain: normalizeStoreDomain(storeDomain),
    storefrontApiVersion: STOREFRONT_API_VERSION,
    ...(storefrontAccessToken ?
      {
        publicStorefrontToken: storefrontAccessToken
      }
    : {}),
    ...(privateStorefrontAccessToken ?
      {
        privateStorefrontToken: privateStorefrontAccessToken
      }
    : {})
  }
}

export function createStorefrontGatewayFromEnvironment(
  environment: ShopifyStorefrontEnvironment
): StorefrontGateway {
  return createHydrogenStorefrontGateway(
    buildStorefrontGatewayConfigFromEnvironment(environment)
  )
}
