import postgres from 'postgres'
import { shopifyAdminGraphql } from '../../src/lib/shopify/shopifyAdminGraphql'
import {
  canonicalPurchaseSchema,
  deterministicPurchaseEventId,
  type CanonicalPurchase
} from '../../src/lib/analytics/purchaseEvent'
import { parseOrderConsentFromNoteAttributes } from '../../src/lib/analytics/checkoutConsentSnapshot'
import {
  SHOPIFY_COMMERCE_RECONCILIATION_QUERY,
  shopifyCommerceReconciliationOrdersPageSchema,
  type ShopifyCommerceReconciliationOrder
} from '../../src/lib/analytics/server/shopifyCommerceReconciliationGraphqlSchema'
import { SHOPIFY_COMMERCE_RECONCILIATION_PAGE_SIZE } from '../../src/lib/analytics/server/shopifyCommerceReconciliationTypes'
import { shopifyGraphqlOrderToCanonicalPurchase } from '../../src/lib/analytics/server/shopifyGraphqlOrderToCanonicalPurchase'
import { dispatchCanonicalPurchaseToMeta } from '../../src/lib/analytics/server/dispatchCanonicalPurchaseToMeta'
import { mapCanonicalPurchaseToMeta } from '../../src/lib/analytics/server/mapCanonicalPurchaseToMeta'
import {
  readMetaConversionsApiConfig,
  sendMetaServerEvent
} from '../../src/lib/analytics/server/sendMetaServerEvent'
import { resolvePostgresConnectionUrl } from '../../src/lib/db/resolvePostgresConnectionUrl'

const OWNER_AUTHORIZATION =
  'kristoffer-2026-09-21-meta-purchase-7d'
const PAID_STATUSES = new Set([
  'PAID',
  'PARTIALLY_PAID',
  'PARTIALLY_REFUNDED',
  'REFUNDED'
])
const META_EVENT_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000
const SAFETY_MARGIN_MS = 10 * 60 * 1000

const operatorGrantedConsent = {
  analytics: 'granted',
  marketing: 'granted',
  preferences: 'granted',
  source: 'operator_policy',
  version: '1'
} as const

function withOperatorGrantedConsent(
  order: ShopifyCommerceReconciliationOrder
): ShopifyCommerceReconciliationOrder {
  return {
    ...order,
    customAttributes: [
      ...order.customAttributes.filter(
        attribute => attribute.key !== 'utekos_consent'
      ),
      {
        key: 'utekos_consent',
        value: JSON.stringify(operatorGrantedConsent)
      }
    ]
  }
}

function recordedConsent(
  order: ShopifyCommerceReconciliationOrder
) {
  return parseOrderConsentFromNoteAttributes(
    order.customAttributes
      .filter(
        (
          attribute
        ): attribute is { key: string; value: string } =>
          typeof attribute.value === 'string'
      )
      .map(attribute => ({
        name: attribute.key,
        value: attribute.value
      }))
  )
}

function mergeLedgerDeviceInfo(
  mapped: CanonicalPurchase,
  ledger: CanonicalPurchase | null
): CanonicalPurchase {
  const mappedUa = mapped.event_device_info?.user_agent
  const ledgerUa = ledger?.event_device_info?.user_agent
  const eventDeviceInfo = {
    ...ledger?.event_device_info,
    ...mapped.event_device_info,
    ...(mappedUa ? { user_agent: mappedUa }
    : ledgerUa ? { user_agent: ledgerUa }
    : {})
  }

  return canonicalPurchaseSchema.parse({
    ...mapped,
    consent: operatorGrantedConsent,
    ...(Object.keys(eventDeviceInfo).length > 0 ?
      { event_device_info: eventDeviceInfo }
    : {}),
    ...(mapped.client_ip_address ?
      { client_ip_address: mapped.client_ip_address }
    : ledger?.client_ip_address ?
      { client_ip_address: ledger.client_ip_address }
    : {})
  })
}

async function fetchPaidOrders(windowStartIso: string) {
  const nodes: ShopifyCommerceReconciliationOrder[] = []
  let after: string | null = null
  let hasNextPage = true
  const query = `processed_at:>=${windowStartIso}`

  while (hasNextPage) {
    const raw =
      await shopifyAdminGraphql<unknown>(
        SHOPIFY_COMMERCE_RECONCILIATION_QUERY,
        {
          after,
          first: SHOPIFY_COMMERCE_RECONCILIATION_PAGE_SIZE,
          query
        }
      )
    const parsed =
      shopifyCommerceReconciliationOrdersPageSchema.safeParse(
        raw
      )
    if (!parsed.success) {
      throw new Error(
        `Shopify order page failed schema validation: ${parsed.error.message}`
      )
    }
    nodes.push(...parsed.data.orders.nodes)
    hasNextPage = parsed.data.orders.pageInfo.hasNextPage
    after = parsed.data.orders.pageInfo.endCursor
  }

  return nodes.filter(order =>
    PAID_STATUSES.has(order.displayFinancialStatus)
  )
}

async function main() {
  const authorization = process.env.UTEKOS_CE26_OWNER_AUTHORIZATION
  const execute = process.argv.includes('--execute')

  if (authorization !== OWNER_AUTHORIZATION) {
    throw new Error(
      'Refusing CE-2.6 Meta purchase replay without matching owner authorization'
    )
  }

  const now = Date.now()
  const windowStart = new Date(
    now - META_EVENT_MAX_AGE_MS + SAFETY_MARGIN_MS
  ).toISOString()
  const connectionUrl = resolvePostgresConnectionUrl(process.env)
  if (!connectionUrl) {
    throw new Error('Missing tracking database connection string')
  }

  const sql = postgres(connectionUrl, {
    max: 1,
    prepare: false,
    connection: { application_name: 'utekos-ce26-meta-replay' }
  })

  try {
    const orders = await fetchPaidOrders(windowStart)
    const eventIds = orders.map(order =>
      deterministicPurchaseEventId(String(order.legacyResourceId))
    )
    const ledgerRows =
      eventIds.length === 0 ?
        []
      : await sql<
          {
            event_id: string
            payload: CanonicalPurchase
            meta_status: string | null
          }[]
        >`
          select
            e.event_id,
            e.payload,
            a.status as meta_status
          from marketing.event_ledger e
          left join ops.provider_dispatch_attempts a
            on a.event_id = e.event_id
            and a.provider = 'meta'
            and a.event_name = 'purchase'
          where e.event_name = 'purchase'
            and e.event_id in ${sql(eventIds)}
        `
    const ledgerByEventId = new Map(
      ledgerRows.map(row => [row.event_id, row])
    )

    const summary = {
      shopifyPaid: orders.length,
      alreadyOnMeta: 0,
      tooOld: 0,
      missingUserAgent: 0,
      sent: 0,
      dryRun: 0,
      failed: 0
    }

    for (const order of orders) {
      const eventId = deterministicPurchaseEventId(
        String(order.legacyResourceId)
      )
      const ledgerRow = ledgerByEventId.get(eventId)
      const originalConsent = recordedConsent(order)
      const alreadyOnMeta =
        ledgerRow?.meta_status === 'succeeded' ||
        ledgerRow?.meta_status === 'accepted_unverified'
      const mapped = shopifyGraphqlOrderToCanonicalPurchase(
        withOperatorGrantedConsent(order)
      )
      const event = mergeLedgerDeviceInfo(
        mapped,
        ledgerRow?.payload ?? null
      )
      const eventTimeMs = Date.parse(event.event_time)
      const ageMs = now - eventTimeMs
      const tooOld = ageMs >= META_EVENT_MAX_AGE_MS - SAFETY_MARGIN_MS
      const hasUserAgent = Boolean(
        event.event_device_info?.user_agent
      )

      const row = {
        order: order.name,
        eventId,
        financialStatus: order.displayFinancialStatus,
        recordedMarketing: originalConsent.marketing,
        metaStatus: ledgerRow?.meta_status ?? 'missing',
        eventTime: event.event_time,
        hasFbp: Boolean(event.browser_id?.fbp),
        hasFbc: Boolean(event.browser_id?.fbc),
        hasUserAgent
      }

      if (alreadyOnMeta) {
        summary.alreadyOnMeta += 1
        console.log(JSON.stringify({ action: 'skip_already_on_meta', ...row }))
        continue
      }
      if (tooOld) {
        summary.tooOld += 1
        console.log(JSON.stringify({ action: 'skip_too_old', ...row }))
        continue
      }
      if (!hasUserAgent) {
        summary.missingUserAgent += 1
        console.log(
          JSON.stringify({ action: 'skip_missing_user_agent', ...row })
        )
        continue
      }

      if (!execute) {
        summary.dryRun += 1
        console.log(JSON.stringify({ action: 'would_send', ...row }))
        continue
      }

      try {
        const receipt = await dispatchCanonicalPurchaseToMeta(
          event,
          {
            mapEvent: mapCanonicalPurchaseToMeta,
            readConfig: () => {
              const config = readMetaConversionsApiConfig()
              return {
                accessToken: config.accessToken,
                pixelId: config.pixelId,
                ...(config.appSecret ?
                  { appSecret: config.appSecret }
                : {})
              }
            },
            sendEvent: sendMetaServerEvent
          }
        )
        summary.sent += 1
        console.log(
          JSON.stringify({
            action: 'sent',
            ...row,
            eventsReceived: receipt.result.eventsReceived,
            fbTraceId: receipt.result.fbTraceId ?? null,
            httpStatus: receipt.result.httpStatus ?? null
          })
        )
      } catch (error) {
        summary.failed += 1
        console.error(
          JSON.stringify({
            action: 'failed',
            ...row,
            error:
              error instanceof Error ? error.message : String(error)
          })
        )
      }
    }

    console.log(JSON.stringify({ summary, windowStart, execute }))
    if (summary.failed > 0) process.exitCode = 1
  } finally {
    await sql.end({ timeout: 5 })
  }
}

await main()
