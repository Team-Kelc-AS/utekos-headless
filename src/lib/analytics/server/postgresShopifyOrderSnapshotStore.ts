import 'server-only'

import postgres from 'postgres'
import { getPostgresClient } from '@/lib/db/getPostgresClient'
import type { ShopifyCommerceReconciliationMoneyBag } from './shopifyCommerceReconciliationGraphqlSchema'
import type {
  ShopifyOrderSnapshotStore,
  UpsertShopifyOrderSnapshotInput
} from './shopifyOrderSnapshotStore'

type SqlClient = ReturnType<typeof getPostgresClient>

type SnapshotCursorRow = {
  updatedAtShopify: Date | string | null
}

function getSql(): NonNullable<SqlClient> {
  const sql = getPostgresClient()
  if (!sql) {
    throw new Error('postgres_unavailable')
  }
  return sql
}

function getShopDomain() {
  const value = process.env.STORE_DOMAIN?.trim().toLowerCase()
  if (!value) throw new Error('shopify_store_domain_missing')

  return value.replace(/^https?:\/\//u, '').replace(/\/.*$/u, '')
}

function moneyAmount(
  money: ShopifyCommerceReconciliationMoneyBag | undefined
) {
  if (!money) return null
  const amount = Number(money.shopMoney.amount)
  if (!Number.isFinite(amount)) {
    throw new Error('shopify_snapshot_money_invalid')
  }
  return amount
}

export function buildShopifyOrderSnapshotRecord(
  input: UpsertShopifyOrderSnapshotInput,
  shopDomain = getShopDomain()
) {
  const { order, syncedAt } = input
  const displayAddress = order.displayAddress ?? {
    zip: order.shippingAddress?.zip ?? order.billingAddress?.zip,
    provinceCode:
      order.shippingAddress?.provinceCode ??
      order.billingAddress?.provinceCode,
    countryCodeV2:
      order.shippingAddress?.countryCodeV2 ??
      order.billingAddress?.countryCodeV2
  }

  // rawPayload is deliberately minimized. Direct contact fields from the
  // reconciliation query must not become a second customer-data warehouse.
  const rawPayload = {
    id: order.id,
    legacyResourceId: order.legacyResourceId,
    name: order.name,
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,
    processedAt: order.processedAt,
    closedAt: order.closedAt,
    cancelledAt: order.cancelledAt,
    displayFinancialStatus: order.displayFinancialStatus,
    displayFulfillmentStatus: order.displayFulfillmentStatus,
    currencyCode: order.currencyCode,
    customAttributes: order.customAttributes,
    customerJourneySummary: order.customerJourneySummary
  }

  return {
    shopDomain,
    shopifyOrderId: order.id,
    legacyResourceId: order.legacyResourceId,
    orderName: order.name ?? null,
    createdAtShopify: order.createdAt,
    updatedAtShopify: order.updatedAt,
    processedAtShopify: order.processedAt ?? null,
    closedAtShopify: order.closedAt ?? null,
    cancelledAtShopify: order.cancelledAt ?? null,
    financialStatus: order.displayFinancialStatus ?? null,
    fulfillmentStatus: order.displayFulfillmentStatus ?? null,
    customerAcceptsMarketing:
      order.customerAcceptsMarketing ?? null,
    customerLocale: order.customerLocale ?? null,
    currencyCode: order.currencyCode,
    totalPriceAmount: moneyAmount(order.totalPriceSet),
    subtotalPriceAmount: moneyAmount(order.subtotalPriceSet),
    totalTaxAmount: moneyAmount(order.totalTaxSet),
    totalShippingAmount: moneyAmount(
      order.totalShippingPriceSet
    ),
    totalRefundedAmount: moneyAmount(order.totalRefundedSet),
    displayAddress,
    customAttributes: order.customAttributes,
    customerJourneySummary: order.customerJourneySummary ?? {},
    rawPayload,
    syncedAt
  }
}

export function createPostgresShopifyOrderSnapshotStore(
  dependencies: {
    getDatabase?: () => NonNullable<SqlClient>
    getDomain?: () => string
  } = {}
): ShopifyOrderSnapshotStore {
  const database = dependencies.getDatabase ?? getSql
  const domain = dependencies.getDomain ?? getShopDomain

  return {
    readCursor: async () => {
      const sql = database()
      const rows = await sql<SnapshotCursorRow[]>`
        select max(updated_at_shopify) as "updatedAtShopify"
        from commerce.shopify_order_snapshots
        where shop_domain = ${domain()}
      `
      const value = rows[0]?.updatedAtShopify ?? null
      return {
        updatedAtShopify:
          value instanceof Date ? value.toISOString() : value
      }
    },
    upsert: async input => {
      const sql = database()
      const row = buildShopifyOrderSnapshotRecord(
        input,
        domain()
      )

      await sql`
        insert into commerce.shopify_order_snapshots (
          shop_domain,
          shopify_order_id,
          legacy_resource_id,
          order_name,
          created_at_shopify,
          updated_at_shopify,
          processed_at_shopify,
          closed_at_shopify,
          cancelled_at_shopify,
          financial_status,
          fulfillment_status,
          customer_accepts_marketing,
          customer_locale,
          currency_code,
          total_price_amount,
          subtotal_price_amount,
          total_tax_amount,
          total_shipping_amount,
          total_refunded_amount,
          display_address,
          custom_attributes,
          customer_journey_summary,
          raw_payload,
          source_request_id,
          synced_at,
          updated_at
        ) values (
          ${row.shopDomain},
          ${row.shopifyOrderId},
          ${row.legacyResourceId},
          ${row.orderName},
          ${row.createdAtShopify},
          ${row.updatedAtShopify},
          ${row.processedAtShopify},
          ${row.closedAtShopify},
          ${row.cancelledAtShopify},
          ${row.financialStatus},
          ${row.fulfillmentStatus},
          ${row.customerAcceptsMarketing},
          ${row.customerLocale},
          ${row.currencyCode},
          ${row.totalPriceAmount},
          ${row.subtotalPriceAmount},
          ${row.totalTaxAmount},
          ${row.totalShippingAmount},
          ${row.totalRefundedAmount},
          ${sql.json(row.displayAddress as postgres.JSONValue)},
          ${sql.json(row.customAttributes as postgres.JSONValue)},
          ${sql.json(row.customerJourneySummary as postgres.JSONValue)},
          ${sql.json(row.rawPayload as postgres.JSONValue)},
          null,
          ${row.syncedAt},
          now()
        )
        on conflict (shop_domain, shopify_order_id) do update set
          legacy_resource_id = excluded.legacy_resource_id,
          order_name = excluded.order_name,
          created_at_shopify = excluded.created_at_shopify,
          updated_at_shopify = excluded.updated_at_shopify,
          processed_at_shopify = excluded.processed_at_shopify,
          closed_at_shopify = excluded.closed_at_shopify,
          cancelled_at_shopify = excluded.cancelled_at_shopify,
          financial_status = excluded.financial_status,
          fulfillment_status = excluded.fulfillment_status,
          customer_accepts_marketing = excluded.customer_accepts_marketing,
          customer_locale = excluded.customer_locale,
          currency_code = excluded.currency_code,
          total_price_amount = excluded.total_price_amount,
          subtotal_price_amount = excluded.subtotal_price_amount,
          total_tax_amount = excluded.total_tax_amount,
          total_shipping_amount = excluded.total_shipping_amount,
          total_refunded_amount = excluded.total_refunded_amount,
          display_address = excluded.display_address,
          custom_attributes = excluded.custom_attributes,
          customer_journey_summary = excluded.customer_journey_summary,
          raw_payload = excluded.raw_payload,
          synced_at = excluded.synced_at,
          updated_at = excluded.updated_at
      `
    }
  }
}

export const postgresShopifyOrderSnapshotStore =
  createPostgresShopifyOrderSnapshotStore()
