import 'server-only'

import { shopifyAdminGraphql } from '@/lib/shopify/shopifyAdminGraphql'
import {
  SHOPIFY_COMMERCE_RECONCILIATION_QUERY,
  shopifyCommerceReconciliationOrdersPageSchema,
  type ShopifyCommerceReconciliationOrder,
  type ShopifyCommerceReconciliationOrdersPage
} from './shopifyCommerceReconciliationGraphqlSchema'
import { SHOPIFY_COMMERCE_RECONCILIATION_PAGE_SIZE } from './shopifyCommerceReconciliationTypes'

export type FetchShopifyCommerceReconciliationOrdersPageInput = {
  after: string | null
  windowStartIso: string
}

export type FetchShopifyCommerceReconciliationOrdersPageResult =
  {
    endCursor: string | null
    hasNextPage: boolean
    nodes: ShopifyCommerceReconciliationOrder[]
  }

export type ShopifyCommerceReconciliationGraphqlClient = <TData>(
  query: string,
  variables?: Record<string, unknown>
) => Promise<TData>

function classifyShopifyAdminRequestError(error: unknown): never {
  const message =
    error instanceof Error ? error.message : String(error)

  if (
    /ACCESS_DENIED|access denied|insufficient/i.test(message)
  ) {
    throw Object.assign(new Error('shopify_scope'), {
      cause: error,
      code: 'shopify_scope' as const
    })
  }

  if (
    message.includes('credentials are not configured') ||
    message.includes('Missing SHOPIFY_') ||
    /\(401\)/.test(message) ||
    /\(403\)/.test(message)
  ) {
    throw Object.assign(new Error('shopify_auth'), {
      cause: error,
      code: 'shopify_auth' as const
    })
  }

  if (/\(429\)|THROTTLED|rate.?limit/i.test(message)) {
    throw Object.assign(new Error('shopify_rate_limited'), {
      cause: error,
      code: 'shopify_rate_limited' as const
    })
  }

  if (/user.?error/i.test(message)) {
    throw Object.assign(new Error('shopify_user_error'), {
      cause: error,
      code: 'shopify_user_error' as const
    })
  }

  throw Object.assign(new Error('shopify_graphql'), {
    cause: error,
    code: 'shopify_graphql' as const
  })
}

export async function fetchShopifyCommerceReconciliationOrdersPage(
  input: FetchShopifyCommerceReconciliationOrdersPageInput,
  graphql: ShopifyCommerceReconciliationGraphqlClient = shopifyAdminGraphql
): Promise<FetchShopifyCommerceReconciliationOrdersPageResult> {
  const query = `updated_at:>=${input.windowStartIso}`

  let raw: unknown

  try {
    raw = await graphql<ShopifyCommerceReconciliationOrdersPage>(
      SHOPIFY_COMMERCE_RECONCILIATION_QUERY,
      {
        after: input.after,
        first: SHOPIFY_COMMERCE_RECONCILIATION_PAGE_SIZE,
        query
      }
    )
  } catch (error) {
    classifyShopifyAdminRequestError(error)
  }

  const parsed =
    shopifyCommerceReconciliationOrdersPageSchema.safeParse(raw)

  if (!parsed.success) {
    throw Object.assign(new Error('shopify_graphql'), {
      cause: parsed.error,
      code: 'shopify_graphql' as const
    })
  }

  return {
    endCursor: parsed.data.orders.pageInfo.endCursor,
    hasNextPage: parsed.data.orders.pageInfo.hasNextPage,
    nodes: parsed.data.orders.nodes
  }
}
