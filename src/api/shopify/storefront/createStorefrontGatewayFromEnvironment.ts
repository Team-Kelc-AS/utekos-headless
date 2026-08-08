import {
  SHOPIFY_STOREFRONT_API_VERSION,
  type ShopifyStorefrontEnvironment
} from '@/db/config/shopify.config'
import { createHydrogenStorefrontGateway } from './createHydrogenStorefrontGateway'
import type { StorefrontGateway } from './StorefrontGatewayContract'

function normalizeStoreDomain(value: string | undefined): string {
  const normalized = value
    ?.trim()
    .replace(/^https?:\/\//, '')
    .replace(/\/.*$/, '')

  if (!normalized) {
    throw new Error('SHOPIFY_STORE_DOMAIN is not defined')
  }

  return normalized
}

export function createStorefrontGatewayFromEnvironment(
  environment: ShopifyStorefrontEnvironment
): StorefrontGateway {
  return createHydrogenStorefrontGateway({
    storeDomain: normalizeStoreDomain(
      environment.SHOPIFY_STORE_DOMAIN
    ),
    storefrontApiVersion: SHOPIFY_STOREFRONT_API_VERSION,
    ...(environment.SHOPIFY_STOREFRONT_ACCESS_TOKEN ?
      {
        publicStorefrontToken:
          environment.SHOPIFY_STOREFRONT_ACCESS_TOKEN
      }
    : {}),
    ...(environment.SHOPIFY_STOREFRONT_PRIVATE_ACCESS_TOKEN ?
      {
        privateStorefrontToken:
          environment.SHOPIFY_STOREFRONT_PRIVATE_ACCESS_TOKEN
      }
    : {})
  })
}
