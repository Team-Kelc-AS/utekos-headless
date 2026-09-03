import type { ShopifyCommerceReconciliationOrder } from './shopifyCommerceReconciliationGraphqlSchema'

export type ShopifyOrderSnapshotCursor = {
  updatedAtShopify: string | null
}

export type UpsertShopifyOrderSnapshotInput = {
  order: ShopifyCommerceReconciliationOrder
  syncedAt: string
}

export type ShopifyOrderSnapshotStore = {
  readCursor: () => Promise<ShopifyOrderSnapshotCursor>
  upsert: (
    input: UpsertShopifyOrderSnapshotInput
  ) => Promise<void>
}
