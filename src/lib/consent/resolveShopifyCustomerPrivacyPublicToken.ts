import { resolveStorefrontGatewayTokens } from '@/api/shopify/storefront/resolveStorefrontGatewayTokens'

type ShopifyCustomerPrivacyEnvironment = Readonly<
  Record<string, string | undefined>
>

export function resolveShopifyCustomerPrivacyPublicToken(
  environment: ShopifyCustomerPrivacyEnvironment = process.env
): string | undefined {
  return resolveStorefrontGatewayTokens(environment)
    .publicStorefrontToken
}
