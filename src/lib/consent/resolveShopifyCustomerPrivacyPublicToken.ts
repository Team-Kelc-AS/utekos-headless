type ShopifyCustomerPrivacyEnvironment = Readonly<
  Record<string, string | undefined>
>

export function resolveShopifyCustomerPrivacyPublicToken(
  environment: ShopifyCustomerPrivacyEnvironment = process.env
): string | undefined {
  const token =
    environment.STOREFRONT_API_ACCESS_TOKEN?.trim() ||
    environment.VERCEL_SHOPIFY_STOREFRONT_ACCESS_TOKEN?.trim()

  return token || undefined
}
