import 'server-only'

import {
  fetchShopifyCommerceReconciliationOrdersPage,
  type FetchShopifyCommerceReconciliationOrdersPageInput,
  type FetchShopifyCommerceReconciliationOrdersPageResult
} from './fetchShopifyCommerceReconciliationOrders'
import { postgresShopifyOrderSnapshotStore } from './postgresShopifyOrderSnapshotStore'
import type { ShopifyOrderSnapshotStore } from './shopifyOrderSnapshotStore'

const INITIAL_LOOKBACK_MS = 60 * 24 * 60 * 60 * 1000
const OVERLAP_MS = 30 * 60 * 1000
export const SHOPIFY_ORDER_SNAPSHOT_RUNTIME_BUDGET_MS = 45 * 1000

export type ShopifyOrderSnapshotSyncStatus =
  | 'completed'
  | 'runtime_timeout'
  | 'postgres_unavailable'
  | 'shopify_auth'
  | 'shopify_scope'
  | 'shopify_rate_limited'
  | 'shopify_graphql'
  | 'shopify_user_error'
  | 'snapshot_persistence'

export type ShopifyOrderSnapshotSyncSummary = {
  ok: boolean
  status: ShopifyOrderSnapshotSyncStatus
  windowStart: string
  pages: number
  ordersExamined: number
  snapshotsUpserted: number
}

export type RunShopifyOrderSnapshotSyncDependencies = {
  fetchOrdersPage: (
    input: FetchShopifyCommerceReconciliationOrdersPageInput
  ) => Promise<FetchShopifyCommerceReconciliationOrdersPageResult>
  snapshotStore: ShopifyOrderSnapshotStore
  now: () => Date
}

const defaultDependencies: RunShopifyOrderSnapshotSyncDependencies =
  {
    fetchOrdersPage:
      fetchShopifyCommerceReconciliationOrdersPage,
    snapshotStore: postgresShopifyOrderSnapshotStore,
    now: () => new Date()
  }

function classifyShopifyError(
  error: unknown
): ShopifyOrderSnapshotSyncStatus {
  const code =
    (
      typeof error === 'object' &&
      error !== null &&
      'code' in error
    ) ?
      (error as { code?: unknown }).code
    : undefined

  if (
    code === 'shopify_auth' ||
    code === 'shopify_scope' ||
    code === 'shopify_rate_limited' ||
    code === 'shopify_graphql' ||
    code === 'shopify_user_error'
  ) {
    return code
  }

  return 'shopify_graphql'
}

function runtimeBudgetExhausted(
  startedAt: Date,
  now: () => Date
) {
  return (
    now().getTime() - startedAt.getTime() >=
    SHOPIFY_ORDER_SNAPSHOT_RUNTIME_BUDGET_MS
  )
}

function resolveWindowStart(
  now: Date,
  updatedAtShopify: string | null
) {
  if (!updatedAtShopify) {
    return new Date(
      now.getTime() - INITIAL_LOOKBACK_MS
    ).toISOString()
  }

  const cursorMs = Date.parse(updatedAtShopify)
  if (!Number.isFinite(cursorMs) || cursorMs > now.getTime()) {
    throw new Error('snapshot_cursor_invalid')
  }

  return new Date(cursorMs - OVERLAP_MS).toISOString()
}

export async function runShopifyOrderSnapshotSync(
  dependencies: RunShopifyOrderSnapshotSyncDependencies = defaultDependencies
): Promise<ShopifyOrderSnapshotSyncSummary> {
  const startedAt = dependencies.now()
  let windowStart: string

  try {
    const cursor = await dependencies.snapshotStore.readCursor()
    windowStart = resolveWindowStart(
      startedAt,
      cursor.updatedAtShopify
    )
  } catch {
    return {
      ok: false,
      status: 'postgres_unavailable',
      windowStart: new Date(
        startedAt.getTime() - INITIAL_LOOKBACK_MS
      ).toISOString(),
      pages: 0,
      ordersExamined: 0,
      snapshotsUpserted: 0
    }
  }

  const summary: ShopifyOrderSnapshotSyncSummary = {
    ok: true,
    status: 'completed',
    windowStart,
    pages: 0,
    ordersExamined: 0,
    snapshotsUpserted: 0
  }
  let after: string | null = null
  let hasNextPage = true

  while (hasNextPage) {
    if (runtimeBudgetExhausted(startedAt, dependencies.now)) {
      return { ...summary, ok: false, status: 'runtime_timeout' }
    }

    let page: FetchShopifyCommerceReconciliationOrdersPageResult
    try {
      page = await dependencies.fetchOrdersPage({
        after,
        windowStartIso: windowStart
      })
    } catch (error) {
      return {
        ...summary,
        ok: false,
        status: classifyShopifyError(error)
      }
    }

    summary.pages += 1

    for (const order of page.nodes) {
      summary.ordersExamined += 1
      try {
        await dependencies.snapshotStore.upsert({
          order,
          syncedAt: dependencies.now().toISOString()
        })
      } catch {
        return {
          ...summary,
          ok: false,
          status: 'snapshot_persistence'
        }
      }
      summary.snapshotsUpserted += 1

      if (runtimeBudgetExhausted(startedAt, dependencies.now)) {
        return {
          ...summary,
          ok: false,
          status: 'runtime_timeout'
        }
      }
    }

    hasNextPage = page.hasNextPage
    after = page.endCursor
    if (hasNextPage && !after) {
      return { ...summary, ok: false, status: 'shopify_graphql' }
    }
  }

  return summary
}
