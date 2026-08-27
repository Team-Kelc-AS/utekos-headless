import type { ShopifyStorefrontEnvironment } from '@/db/config/shopify.config'

export type StorefrontGatewayTokens = Readonly<{
  publicStorefrontToken?: string
  privateStorefrontToken?: string
}>

function firstConfiguredValue(
  ...values: Array<string | undefined>
): string | undefined {
  for (const value of values) {
    const normalized = value?.trim()
    if (normalized) return normalized
  }

  return undefined
}

function isShopifyAdminApiAccessToken(value: string): boolean {
  return value.startsWith('shpat_')
}

function firstConfiguredPrivateStorefrontToken(
  ...values: Array<string | undefined>
): string | undefined {
  for (const value of values) {
    const normalized = value?.trim()
    if (!normalized) continue
    if (isShopifyAdminApiAccessToken(normalized)) continue
    return normalized
  }

  return undefined
}

export function resolveStorefrontGatewayTokens(
  environment: ShopifyStorefrontEnvironment
): StorefrontGatewayTokens {
  const publicStorefrontToken = firstConfiguredValue(
    environment.STOREFRONT_API_ACCESS_TOKEN,
    environment.VERCEL_SHOPIFY_STOREFRONT_ACCESS_TOKEN,
    environment.NEXT_PUBLIC_STOREFRONT_ACCESS_TOKEN
  )
  const privateStorefrontToken = firstConfiguredPrivateStorefrontToken(
    environment.PRIVATE_STOREFRONT_ACCESS_TOKEN,
    environment.STOREFRONT_API_PRIVATE_ACCESS_TOKEN,
    environment.PRIVATE_STOREFRONT_API_TOKEN
  )

  return {
    ...(publicStorefrontToken ? { publicStorefrontToken } : {}),
    ...(privateStorefrontToken ? { privateStorefrontToken } : {})
  }
}
