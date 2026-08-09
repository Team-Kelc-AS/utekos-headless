const SHOPIFY_ADMIN_API_TOKEN =
  process.env.SHOPIFY_ADMIN_API_TOKEN
const SHOPIFY_STORE_DOMAIN = process.env.SHOPIFY_STORE_DOMAIN
export const SHOPIFY_ADMIN_API_VERSION = '2026-04'

type ShopifyAdminGraphqlError = { message: string }

type ShopifyAdminGraphqlResponse<TData> = {
  data?: TData
  errors?: ShopifyAdminGraphqlError[]
}

export function getShopifyAdminGraphqlUrl(): string {
  if (!SHOPIFY_STORE_DOMAIN) {
    throw new Error('Missing SHOPIFY_STORE_DOMAIN')
  }

  return `https://${SHOPIFY_STORE_DOMAIN}/admin/api/${SHOPIFY_ADMIN_API_VERSION}/graphql.json`
}

export async function shopifyAdminGraphql<TData>(
  query: string,
  variables?: Record<string, unknown>
): Promise<TData> {
  if (!SHOPIFY_ADMIN_API_TOKEN || !SHOPIFY_STORE_DOMAIN) {
    throw new Error(
      'Shopify Admin API credentials are not configured'
    )
  }

  const response = await fetch(getShopifyAdminGraphqlUrl(), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Access-Token': SHOPIFY_ADMIN_API_TOKEN
    },
    body: JSON.stringify({ query, variables }),
    cache: 'no-store'
  })

  if (!response.ok) {
    const text = await response.text()
    throw new Error(
      `Shopify Admin API error (${response.status}): ${text}`
    )
  }

  const json =
    (await response.json()) as ShopifyAdminGraphqlResponse<TData>

  if (json.errors?.length) {
    throw new Error(
      `Shopify GraphQL errors: ${JSON.stringify(json.errors)}`
    )
  }

  if (!json.data) {
    throw new Error(
      'Shopify Admin API returned an empty data payload'
    )
  }

  return json.data
}
