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

function firstConfiguredValue(
  ...values: Array<string | undefined>
): string | undefined {
  for (const value of values) {
    const normalized = value?.trim()
    if (normalized) return normalized
  }

  return undefined
}

export function buildStorefrontGatewayConfigFromEnvironment(
  environment: ShopifyStorefrontEnvironment
): HydrogenStorefrontGatewayConfig {
  const storeDomain = firstConfiguredValue(
    environment.VERCEL_SHOPIFY_STORE_DOMAIN,
    environment.STORE_DOMAIN
  )
  const storefrontAccessToken = firstConfiguredValue(
    environment.VERCEL_SHOPIFY_STOREFRONT_ACCESS_TOKEN,
    environment.STOREFRONT_API_ACCESS_TOKEN
  )

  return {
    storeDomain: normalizeStoreDomain(storeDomain),
    storefrontApiVersion: STOREFRONT_API_VERSION,
    ...(storefrontAccessToken ?
      {
        publicStorefrontToken: storefrontAccessToken
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
