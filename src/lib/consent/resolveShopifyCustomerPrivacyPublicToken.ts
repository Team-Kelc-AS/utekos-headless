type ShopifyCustomerPrivacyEnvironment = Readonly<
  Record<string, string | undefined>
>

export function resolveShopifyCustomerPrivacyPublicToken(
  environment: ShopifyCustomerPrivacyEnvironment = process.env
): string | undefined {
  const token =
    environment.VERCEL_SHOPIFY_STOREFRONT_ACCESS_TOKEN?.trim()

  return token || undefined
}
