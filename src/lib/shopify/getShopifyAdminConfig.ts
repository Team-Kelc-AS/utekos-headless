const SHOPIFY_ADMIN_API_VERSION = '2026-04'

type ShopifyAdminEnvironment = Readonly<
  Record<string, string | undefined>
>

type ShopifyAdminConfig = {
  accessToken: string
  graphqlUrl: string
}

export function getShopifyAdminConfig(
  env: ShopifyAdminEnvironment = process.env
): ShopifyAdminConfig {
  const accessToken = env.SHOPIFY_ADMIN_API_TOKEN?.trim()
  const storeDomain = env.SHOPIFY_STORE_DOMAIN?.trim()

  if (!accessToken || !storeDomain) {
    throw new Error('Missing Shopify Admin API credentials')
  }

  return {
    accessToken,
    graphqlUrl: `https://${storeDomain}/admin/api/${SHOPIFY_ADMIN_API_VERSION}/graphql.json`
  }
}
