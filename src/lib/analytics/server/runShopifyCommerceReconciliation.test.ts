import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import Module from 'node:module'
import { createRequire } from 'node:module'
import test from 'node:test'
import {
  deterministicPurchaseEventId,
  shopifyPurchaseTransactionId
} from '../purchaseEvent'
import type { CanonicalEvent } from '../canonicalEvent'
import {
  deterministicRefundEventId,
  shopifyRefundRecordId
} from '../refundEvent'
import type { CanonicalEventStore } from './canonicalEventStore'
import type {
  ShopifyCommerceReconciliationOrder,
  ShopifyCommerceReconciliationRefund
} from './shopifyCommerceReconciliationGraphqlSchema'
import {
  SHOPIFY_COMMERCE_RECONCILIATION_JOB_NAME,
  type ShopifyCommerceReconciliationLease
} from './shopifyCommerceReconciliationTypes'
import { createShopifyReconciliationCommerceSourceEvidence } from './shopifyCommerceSourceEvidence'
import { shopifyGraphqlRefundToCanonicalRefund } from './shopifyGraphqlRefundToCanonicalRefund'

const moduleWithLoad = Module as typeof Module & {
  _load: (
    request: string,
    parent: NodeModule | null,
    isMain: boolean
  ) => unknown
}
const originalLoad = moduleWithLoad._load.bind(Module)

moduleWithLoad._load = (request, parent, isMain) => {
  if (request === 'server-only') {
    return {}
  }

  return originalLoad(request, parent, isMain)
}

const require = createRequire(import.meta.url)
const {
  computeShopifyCommerceReconciliationWindow,
  runShopifyCommerceReconciliation
} =
  require('./runShopifyCommerceReconciliation.ts') as typeof import('./runShopifyCommerceReconciliation')
type RunShopifyCommerceReconciliationDependencies =
  import('./runShopifyCommerceReconciliation').RunShopifyCommerceReconciliationDependencies

function money(amount: string, currencyCode = 'NOK') {
  return {
    shopMoney: { amount, currencyCode },
    presentmentMoney: { amount, currencyCode }
  }
}

function emptyConnections() {
  return {
    pageInfo: {
      hasNextPage: false,
      endCursor: null as string | null
    },
    nodes: [] as never[]
  }
}

function lineItem(
  id: string,
  variantId: string,
  amount: string
) {
  return {
    id: `gid://shopify/LineItem/${id}`,
    name: `Item ${id}`,
    title: `Item ${id}`,
    quantity: 1,
    sku: `SKU-${id}`,
    variant: {
      id: `gid://shopify/ProductVariant/${variantId}`,
      legacyResourceId: variantId
    },
    originalUnitPriceSet: money(amount),
    taxLines: [],
    discountAllocations: []
  }
}

function refundNode(
  refundId: string,
  amount: string
): ShopifyCommerceReconciliationRefund {
  return {
    id: `gid://shopify/Refund/${refundId}`,
    legacyResourceId: refundId,
    createdAt: '2026-07-01T11:00:00Z',
    updatedAt: '2026-07-01T11:00:00Z',
    totalRefundedSet: money(amount),
    refundLineItems: {
      pageInfo: { hasNextPage: false, endCursor: null },
      nodes: [
        {
          id: `gid://shopify/RefundLineItem/${refundId}`,
          quantity: 1,
          subtotalSet: money(amount),
          lineItem: {
            id: 'gid://shopify/LineItem/1',
            name: 'Item 1',
            title: 'Item 1',
            sku: 'SKU-1',
            variant: {
              id: 'gid://shopify/ProductVariant/1',
              legacyResourceId: '1'
            },
            originalUnitPriceSet: money(amount)
          }
        }
      ]
    },
    transactions: {
      pageInfo: { hasNextPage: false, endCursor: null },
      nodes: [
        {
          id: `gid://shopify/OrderTransaction/${refundId}`,
          amountSet: money(amount),
          status: 'SUCCESS',
          kind: 'REFUND',
          gateway: 'shopify_payments',
          createdAt: '2026-07-01T11:00:00Z',
          order: { legacyResourceId: '100' }
        }
      ]
    }
  }
}

function order(input: {
  legacyResourceId: string
  displayFinancialStatus: string | null
  refunds?: ShopifyCommerceReconciliationRefund[]
  lineItemsTruncated?: boolean
}): ShopifyCommerceReconciliationOrder {
  return {
    id: `gid://shopify/Order/${input.legacyResourceId}`,
    legacyResourceId: input.legacyResourceId,
    name: `#${input.legacyResourceId}`,
    createdAt: '2026-07-01T10:00:00Z',
    processedAt: '2026-07-01T10:00:00Z',
    updatedAt: '2026-07-01T10:30:00Z',
    displayFinancialStatus: input.displayFinancialStatus,
    currencyCode: 'NOK',
    presentmentCurrencyCode: 'NOK',
    taxesIncluded: false,
    email: null,
    phone: null,
    clientIp: null,
    statusPageUrl: null,
    customAttributes: [],
    totalPriceSet: money('100.00'),
    totalTaxSet: money('0.00'),
    totalShippingPriceSet: money('0.00'),
    discountCodes: [],
    discountApplications: emptyConnections(),
    shippingAddress: null,
    billingAddress: null,
    customer: null,
    customerJourneySummary: null,
    lineItems: {
      pageInfo: {
        hasNextPage: Boolean(input.lineItemsTruncated),
        endCursor: null
      },
      nodes: [
        lineItem(
          input.legacyResourceId,
          input.legacyResourceId,
          '100.00'
        )
      ]
    },
    refunds: input.refunds ?? []
  }
}

function acquiredLease(
  watermark?: Record<string, unknown>
): Extract<
  ShopifyCommerceReconciliationLease,
  { status: 'acquired' }
> {
  return {
    status: 'acquired',
    jobName: SHOPIFY_COMMERCE_RECONCILIATION_JOB_NAME,
    leaseOwner: 'lease-owner-1',
    acquiredAt: '2026-07-01T12:00:00.000Z',
    expiresAt: '2026-07-01T12:15:00.000Z',
    metadata: { ...(watermark ?? {}) }
  }
}

function createStoreTracker() {
  const accepted = new Set<string>()
  const accept: CanonicalEventStore['accept'] = async input => {
    if (accepted.has(input.event.event_id)) {
      return {
        createdDispatchAttempts: [],
        status: 'duplicate'
      }
    }
    accepted.add(input.event.event_id)
    return {
      createdDispatchAttempts: [],
      status: 'inserted'
    }
  }

  return {
    accept,
    accepted
  }
}

function baseDependencies(
  overrides: Partial<RunShopifyCommerceReconciliationDependencies> = {}
) {
  const storeTracker = createStoreTracker()
  const fetchCalls: unknown[] = []
  const releaseCalls: unknown[] = []
  const purchaseAcceptanceInputs: Array<
    Parameters<
      RunShopifyCommerceReconciliationDependencies['acceptPurchase']
    >[0]
  > = []
  const refundAcceptanceInputs: Array<
    Parameters<
      RunShopifyCommerceReconciliationDependencies['acceptRefund']
    >[0]
  > = []

  const dependencies: RunShopifyCommerceReconciliationDependencies =
    {
      claimLease: async () => acquiredLease(),
      releaseLease: async input => {
        releaseCalls.push(input)
        return {
          released: true,
          watermarkAdvanced: Boolean(input.watermark)
        }
      },
      updateLeaseWindow: async () => true,
      fetchOrdersPage: async input => {
        fetchCalls.push(input)
        return { nodes: [], hasNextPage: false, endCursor: null }
      },
      acceptPurchase: async input => {
        purchaseAcceptanceInputs.push(input)
        const result = await storeTracker.accept({
          dispatches: [],
          event: input.payload as CanonicalEvent
        })
        return {
          event_id: (input.payload as { event_id: string })
            .event_id,
          status:
            result.status === 'inserted' ? 'accepted' : 'duplicate'
        }
      },
      acceptRefund: async input => {
        refundAcceptanceInputs.push(input)
        const result = await storeTracker.accept({
          dispatches: [],
          event: input.payload as CanonicalEvent
        })
        return {
          event_id: (input.payload as { event_id: string })
            .event_id,
          status:
            result.status === 'inserted' ? 'accepted' : 'duplicate'
        }
      },
      mapPurchase: orderNode => ({
        schema_version: 1 as const,
        event_name: 'purchase' as const,
        event_id: deterministicPurchaseEventId(
          orderNode.legacyResourceId
        ),
        event_time: orderNode.processedAt ?? orderNode.createdAt,
        source: 'server' as const,
        environment: 'test' as const,
        consent: {
          analytics: 'denied' as const,
          marketing: 'denied' as const,
          preferences: 'denied' as const,
          source: 'cookiebot' as const,
          version: '1'
        },
        custom_data: {
          currency: 'NOK',
          value: 100,
          transaction_id: shopifyPurchaseTransactionId(
            orderNode.legacyResourceId
          ),
          order_name:
            orderNode.name ?? `#${orderNode.legacyResourceId}`,
          items: [
            {
              item_id: '1',
              item_name: 'Item',
              quantity: 1,
              unit_price: 100
            }
          ]
        }
      }),
      mapRefund: ({ refund, order: parentOrder }) => ({
        schema_version: 1 as const,
        event_name: 'refund' as const,
        event_id: deterministicRefundEventId(
          refund.legacyResourceId
        ),
        event_time: refund.createdAt,
        source: 'server' as const,
        environment: 'test' as const,
        consent: {
          analytics: 'denied' as const,
          marketing: 'denied' as const,
          preferences: 'denied' as const,
          source: 'cookiebot' as const,
          version: '1'
        },
        custom_data: {
          currency: 'NOK',
          value: 10,
          transaction_id: shopifyPurchaseTransactionId(
            parentOrder.legacyResourceId
          ),
          refund_id: shopifyRefundRecordId(
            refund.legacyResourceId
          ),
          items: [
            {
              item_id: '1',
              item_name: 'Item',
              quantity: 1,
              unit_price: 10
            }
          ]
        }
      }),
      createSourceEvidence:
        createShopifyReconciliationCommerceSourceEvidence,
      store: { accept: storeTracker.accept },
      now: () => new Date('2026-07-01T12:00:00.000Z'),
      ...overrides
    }

  return {
    dependencies,
    fetchCalls,
    purchaseAcceptanceInputs,
    refundAcceptanceInputs,
    releaseCalls,
    storeTracker
  }
}

test('computeShopifyCommerceReconciliationWindow uses 24h without watermark', () => {
  const window = computeShopifyCommerceReconciliationWindow({
    runStartedAt: new Date('2026-07-01T12:00:00.000Z'),
    watermark: {}
  })

  assert.equal(window.ok, true)
  if (window.ok) {
    assert.equal(window.windowEnd, '2026-07-01T12:00:00.000Z')
    assert.equal(window.windowStart, '2026-06-30T12:00:00.000Z')
  }
})

test('computeShopifyCommerceReconciliationWindow overlaps 30m and caps at 24h', () => {
  const window = computeShopifyCommerceReconciliationWindow({
    runStartedAt: new Date('2026-07-01T12:00:00.000Z'),
    watermark: {
      lastSuccessfulWindowEnd: '2026-07-01T11:50:00.000Z'
    }
  })

  assert.equal(window.ok, true)
  if (window.ok) {
    assert.equal(window.windowStart, '2026-07-01T11:20:00.000Z')
  }
})

test('computeShopifyCommerceReconciliationWindow fails closed on corrupt watermark', () => {
  const window = computeShopifyCommerceReconciliationWindow({
    runStartedAt: new Date('2026-07-01T12:00:00.000Z'),
    watermark: { lastSuccessfulWindowEnd: 'not-a-date' }
  })

  assert.deepEqual(window, {
    ok: false,
    reason: 'invalid_reconciliation_watermark'
  })
})

test('computeShopifyCommerceReconciliationWindow fails closed on non-string watermark', () => {
  const window = computeShopifyCommerceReconciliationWindow({
    runStartedAt: new Date('2026-07-01T12:00:00.000Z'),
    watermark: { lastSuccessfulWindowEnd: 123 }
  })

  assert.deepEqual(window, {
    ok: false,
    reason: 'invalid_reconciliation_watermark'
  })
})

test('computeShopifyCommerceReconciliationWindow rejects parseable non-ISO watermark', () => {
  const window = computeShopifyCommerceReconciliationWindow({
    runStartedAt: new Date('2026-07-02T12:00:00.000Z'),
    watermark: { lastSuccessfulWindowEnd: '07/01/2026' }
  })

  assert.deepEqual(window, {
    ok: false,
    reason: 'invalid_reconciliation_watermark'
  })
})

test('computeShopifyCommerceReconciliationWindow rejects a future watermark', () => {
  const window = computeShopifyCommerceReconciliationWindow({
    runStartedAt: new Date('2026-07-02T12:00:00.000Z'),
    watermark: {
      lastSuccessfulWindowEnd: '2026-07-02T12:00:00.001Z'
    }
  })

  assert.deepEqual(window, {
    ok: false,
    reason: 'invalid_reconciliation_watermark'
  })
})

test('computeShopifyCommerceReconciliationWindow stops on a historical gap beyond 24h', () => {
  const window = computeShopifyCommerceReconciliationWindow({
    runStartedAt: new Date('2026-07-02T12:00:00.000Z'),
    watermark: {
      lastSuccessfulWindowEnd: '2026-07-01T11:59:59.999Z'
    }
  })

  assert.deepEqual(window, {
    ok: false,
    reason: 'stop_historical_gap_requires_ce_2_6'
  })
})

test('historical gap stop does not fetch or advance the watermark', async () => {
  const { dependencies, fetchCalls, releaseCalls } =
    baseDependencies({
      claimLease: async () =>
        acquiredLease({
          lastSuccessfulWindowEnd: '2026-06-30T11:59:59.999Z'
        })
    })

  const summary = await runShopifyCommerceReconciliation(
    { runMode: 'accept' },
    dependencies
  )

  assert.equal(summary.ok, false)
  assert.equal(
    summary.status,
    'stop_historical_gap_requires_ce_2_6'
  )
  assert.equal(
    summary.failures[0]?.reason,
    'STOP_HISTORICAL_GAP_REQUIRES_CE_2_6'
  )
  assert.equal(fetchCalls.length, 0)
  assert.equal(
    (releaseCalls[0] as { watermark?: unknown }).watermark,
    undefined
  )
})

test('invalid lease watermark metadata fails closed without fetching', async () => {
  const { dependencies, fetchCalls, releaseCalls } =
    baseDependencies({
      claimLease: async () =>
        acquiredLease({ lastSuccessfulWindowEnd: 123 })
    })

  const summary = await runShopifyCommerceReconciliation(
    { runMode: 'accept' },
    dependencies
  )

  assert.equal(
    summary.status,
    'invalid_reconciliation_watermark'
  )
  assert.equal(fetchCalls.length, 0)
  assert.equal(
    (releaseCalls[0] as { watermark?: unknown }).watermark,
    undefined
  )
})

test('records the computed overlap window after acquiring the lease', async () => {
  const claimInputs: unknown[] = []
  const windowUpdates: unknown[] = []
  const { dependencies } = baseDependencies({
    claimLease: async input => {
      claimInputs.push(input)
      return acquiredLease({
        lastSuccessfulWindowEnd: '2026-07-01T11:50:00.000Z'
      })
    },
    updateLeaseWindow: async input => {
      windowUpdates.push(input)
      return true
    }
  } as Partial<RunShopifyCommerceReconciliationDependencies>)

  const summary = await runShopifyCommerceReconciliation(
    { runMode: 'dry-run' },
    dependencies
  )

  assert.equal(summary.status, 'completed')
  assert.deepEqual(claimInputs, [
    {
      activeRunStartedAt: '2026-07-01T12:00:00.000Z',
      runMode: 'dry-run'
    }
  ])
  assert.deepEqual(windowUpdates, [
    {
      activeWindowEnd: '2026-07-01T12:00:00.000Z',
      activeWindowStart: '2026-07-01T11:20:00.000Z',
      lease: acquiredLease({
        lastSuccessfulWindowEnd: '2026-07-01T11:50:00.000Z'
      })
    }
  ])
})

test('runtime budget exhaustion stops before fetching and does not advance watermark', async () => {
  let nowCall = 0
  const runStartedAtMs = Date.parse('2026-07-01T12:00:00.000Z')
  const { dependencies, fetchCalls, releaseCalls } =
    baseDependencies({
      now: () =>
        new Date(runStartedAtMs + (nowCall++ === 0 ? 0 : 45_000))
    })

  const summary = await runShopifyCommerceReconciliation(
    { runMode: 'accept' },
    dependencies
  )

  assert.equal(summary.ok, false)
  assert.equal(summary.status, 'runtime_timeout')
  assert.equal(summary.watermarkAdvanced, false)
  assert.equal(fetchCalls.length, 0)
  assert.equal(
    (releaseCalls[0] as { watermark?: unknown }).watermark,
    undefined
  )
})

test('runner defaults to dry-run inspection without canonical acceptance', async () => {
  const paid = order({
    legacyResourceId: '99',
    displayFinancialStatus: 'PAID',
    refunds: [refundNode('899', '10.00')]
  })
  const { dependencies, releaseCalls } = baseDependencies({
    fetchOrdersPage: async () => ({
      nodes: [paid],
      hasNextPage: false,
      endCursor: null
    }),
    acceptPurchase: async () => {
      throw new Error('dry-run must not accept purchase')
    },
    acceptRefund: async () => {
      throw new Error('dry-run must not accept refund')
    },
    createSourceEvidence: () => {
      throw new Error('dry-run must not create source evidence')
    }
  })

  const summary = await runShopifyCommerceReconciliation(
    {},
    dependencies
  )

  assert.equal(summary.status, 'completed')
  assert.equal(summary.purchaseCandidates, 1)
  assert.equal(summary.refundCandidates, 1)
  assert.equal(summary.purchasesAccepted, 0)
  assert.equal(summary.refundsAccepted, 0)
  assert.equal(summary.watermarkAdvanced, false)
  assert.equal(
    (releaseCalls[0] as { watermark?: unknown }).watermark,
    undefined
  )
})

test('orders pagination advances only after a page is fully processed', async () => {
  const pageInputs: Array<{ after: string | null }> = []
  const { dependencies } = baseDependencies({
    fetchOrdersPage: async input => {
      pageInputs.push({ after: input.after })
      return input.after === null ?
          {
            nodes: [
              order({
                legacyResourceId: '501',
                displayFinancialStatus: 'PENDING'
              })
            ],
            hasNextPage: true,
            endCursor: 'cursor-1'
          }
        : {
            nodes: [
              order({
                legacyResourceId: '502',
                displayFinancialStatus: 'PENDING'
              })
            ],
            hasNextPage: false,
            endCursor: null
          }
    }
  })

  const summary = await runShopifyCommerceReconciliation(
    { runMode: 'accept' },
    dependencies
  )

  assert.equal(summary.status, 'completed')
  assert.equal(summary.pages, 2)
  assert.equal(summary.ordersExamined, 2)
  assert.deepEqual(pageInputs, [
    { after: null },
    { after: 'cursor-1' }
  ])
})

test('red gate 1: repeated window accepts then duplicates with same event ids', async () => {
  const paid = order({
    legacyResourceId: '100',
    displayFinancialStatus: 'PAID',
    refunds: [refundNode('900', '10.00')]
  })
  const { dependencies, storeTracker } = baseDependencies({
    fetchOrdersPage: async () => ({
      nodes: [paid],
      hasNextPage: false,
      endCursor: null
    })
  })

  const first = await runShopifyCommerceReconciliation(
    { runMode: 'accept' },
    dependencies
  )
  const second = await runShopifyCommerceReconciliation(
    { runMode: 'accept' },
    dependencies
  )

  assert.equal(first.status, 'completed')
  assert.equal(first.purchasesAccepted, 1)
  assert.equal(first.refundsAccepted, 1)
  assert.equal(second.purchasesDuplicate, 1)
  assert.equal(second.refundsDuplicate, 1)
  assert.equal(second.purchasesAccepted, 0)
  assert.equal(second.refundsAccepted, 0)
  assert.equal(
    [...storeTracker.accepted].sort().join(','),
    [
      deterministicPurchaseEventId('100'),
      deterministicRefundEventId('900')
    ]
      .sort()
      .join(',')
  )
})

test('itemless reconciliation refund accepts once then remains duplicate-safe', async () => {
  const itemlessRefund = refundNode('904', '15.00')
  itemlessRefund.refundLineItems.nodes = []
  itemlessRefund.transactions.nodes[0]!.status = 'PENDING'
  const paid = order({
    legacyResourceId: '104',
    displayFinancialStatus: 'PAID',
    refunds: [itemlessRefund]
  })
  const { dependencies, refundAcceptanceInputs } =
    baseDependencies({
      fetchOrdersPage: async () => ({
        nodes: [paid],
        hasNextPage: false,
        endCursor: null
      }),
      mapRefund: shopifyGraphqlRefundToCanonicalRefund
    })

  const first = await runShopifyCommerceReconciliation(
    { runMode: 'accept' },
    dependencies
  )
  const second = await runShopifyCommerceReconciliation(
    { runMode: 'accept' },
    dependencies
  )

  assert.equal(first.refundsAccepted, 1)
  assert.equal(second.refundsDuplicate, 1)
  assert.equal(refundAcceptanceInputs.length, 2)
  assert.deepEqual(
    (
      refundAcceptanceInputs[0]?.payload as {
        custom_data: { items: unknown[]; value: number }
      }
    ).custom_data,
    {
      currency: 'NOK',
      value: 15,
      transaction_id: shopifyPurchaseTransactionId('104'),
      refund_id: shopifyRefundRecordId('904'),
      items: []
    }
  )
})

test('accept mode passes provider-neutral reconciliation evidence for purchases and refunds', async () => {
  const paid = order({
    legacyResourceId: '100',
    displayFinancialStatus: 'PAID',
    refunds: [refundNode('900', '10.00')]
  })
  const {
    dependencies,
    purchaseAcceptanceInputs,
    refundAcceptanceInputs
  } = baseDependencies({
    fetchOrdersPage: async () => ({
      nodes: [paid],
      hasNextPage: false,
      endCursor: null
    })
  })

  const summary = await runShopifyCommerceReconciliation(
    { runMode: 'accept' },
    dependencies
  )

  assert.equal(summary.status, 'completed')
  assert.deepEqual(purchaseAcceptanceInputs[0]?.sourceEvidence, {
    canonical_event_id: deterministicPurchaseEventId('100'),
    source_system: 'shopify',
    source_method: 'reconciliation',
    source_object_type: 'order',
    source_object_id: '100',
    source_topic: 'orders/paid',
    source_delivery_id: null,
    source_event_id: null,
    source_api_version: '2026-04',
    source_triggered_at: '2026-07-01T10:00:00.000Z',
    source_observed_at: '2026-07-01T12:00:00.000Z'
  })
  assert.deepEqual(refundAcceptanceInputs[0]?.sourceEvidence, {
    canonical_event_id: deterministicRefundEventId('900'),
    source_system: 'shopify',
    source_method: 'reconciliation',
    source_object_type: 'refund',
    source_object_id: '900',
    source_topic: 'refunds/create',
    source_delivery_id: null,
    source_event_id: null,
    source_api_version: '2026-04',
    source_triggered_at: '2026-07-01T11:00:00.000Z',
    source_observed_at: '2026-07-01T12:00:00.000Z'
  })
})

test('red gate 2: overlapping window creates no new semantic events', async () => {
  const paid = order({
    legacyResourceId: '200',
    displayFinancialStatus: 'PAID'
  })
  const { dependencies, storeTracker } = baseDependencies({
    claimLease: async () =>
      acquiredLease({
        lastSuccessfulWindowEnd: '2026-07-01T11:50:00.000Z'
      }),
    fetchOrdersPage: async () => ({
      nodes: [paid],
      hasNextPage: false,
      endCursor: null
    })
  })

  await runShopifyCommerceReconciliation(
    { runMode: 'accept' },
    dependencies
  )
  const before = storeTracker.accepted.size
  const overlap = await runShopifyCommerceReconciliation(
    { runMode: 'accept' },
    dependencies
  )

  assert.equal(overlap.purchasesAccepted, 0)
  assert.equal(overlap.purchasesDuplicate, 1)
  assert.equal(storeTracker.accepted.size, before)
})

test('red gate 3: mixed page returns exact counts', async () => {
  const alreadyAcceptedPurchaseId =
    deterministicPurchaseEventId('301')
  const alreadyAcceptedRefundId =
    deterministicRefundEventId('901')
  const { dependencies, storeTracker } = baseDependencies({
    fetchOrdersPage: async () => ({
      nodes: [
        order({
          legacyResourceId: '300',
          displayFinancialStatus: 'PAID'
        }),
        order({
          legacyResourceId: '301',
          displayFinancialStatus: 'PAID',
          refunds: [
            refundNode('902', '5.00'),
            refundNode('901', '5.00')
          ]
        }),
        order({
          legacyResourceId: '302',
          displayFinancialStatus: 'PENDING'
        })
      ],
      hasNextPage: false,
      endCursor: null
    })
  })

  storeTracker.accepted.add(alreadyAcceptedPurchaseId)
  storeTracker.accepted.add(alreadyAcceptedRefundId)

  const summary = await runShopifyCommerceReconciliation(
    { runMode: 'accept' },
    dependencies
  )

  assert.equal(summary.status, 'completed')
  assert.equal(summary.ordersExamined, 3)
  assert.equal(summary.purchaseCandidates, 2)
  assert.equal(summary.purchasesAccepted, 1)
  assert.equal(summary.purchasesDuplicate, 1)
  assert.equal(summary.refundCandidates, 2)
  assert.equal(summary.refundsAccepted, 1)
  assert.equal(summary.refundsDuplicate, 1)
  assert.equal(summary.watermarkAdvanced, true)
})

test('red gate 4: lease overlap returns lease_blocked without Shopify fetch', async () => {
  const { dependencies, fetchCalls } = baseDependencies({
    claimLease: async () => ({
      status: 'blocked',
      jobName: SHOPIFY_COMMERCE_RECONCILIATION_JOB_NAME,
      leaseOwner: 'other',
      acquiredAt: '2026-07-01T12:00:00.000Z',
      expiresAt: '2026-07-01T12:15:00.000Z'
    })
  })

  const summary = await runShopifyCommerceReconciliation(
    { runMode: 'accept' },
    dependencies
  )

  assert.equal(summary.status, 'lease_blocked')
  assert.equal(summary.ok, true)
  assert.equal(summary.watermarkAdvanced, false)
  assert.equal(fetchCalls.length, 0)
})

test('red gate 5: partial failure does not complete or advance watermark', async () => {
  const { dependencies, releaseCalls } = baseDependencies({
    fetchOrdersPage: async () => ({
      nodes: [
        order({
          legacyResourceId: '400',
          displayFinancialStatus: 'PAID',
          lineItemsTruncated: true
        })
      ],
      hasNextPage: false,
      endCursor: null
    })
  })

  const summary = await runShopifyCommerceReconciliation(
    { runMode: 'accept' },
    dependencies
  )

  assert.equal(summary.status, 'partial_page_failure')
  assert.equal(summary.ok, false)
  assert.equal(summary.watermarkAdvanced, false)
  assert.equal(
    (releaseCalls[0] as { watermark?: unknown }).watermark,
    undefined
  )
  assert.equal(
    summary.failures[0]?.reason,
    'order_line_items_truncated'
  )
})

test('all nested truncation signals fail the page without watermark advancement', async () => {
  const discountApplicationsTruncated = order({
    legacyResourceId: '410',
    displayFinancialStatus: 'PAID'
  })
  discountApplicationsTruncated.discountApplications.pageInfo.hasNextPage = true

  const refundsAmbiguous = order({
    legacyResourceId: '411',
    displayFinancialStatus: 'PENDING',
    refunds: Array.from({ length: 250 }, (_, index) =>
      refundNode(String(1_000 + index), '1.00')
    )
  })

  const refundLineItemsTruncated = order({
    legacyResourceId: '412',
    displayFinancialStatus: 'PENDING',
    refunds: [refundNode('912', '10.00')]
  })
  refundLineItemsTruncated.refunds[0]!.refundLineItems.pageInfo.hasNextPage = true

  const refundTransactionsTruncated = order({
    legacyResourceId: '413',
    displayFinancialStatus: 'PENDING',
    refunds: [refundNode('913', '10.00')]
  })
  refundTransactionsTruncated.refunds[0]!.transactions.pageInfo.hasNextPage = true

  const cases = [
    {
      node: discountApplicationsTruncated,
      reason: 'order_discount_applications_truncated'
    },
    {
      node: refundsAmbiguous,
      reason: 'order_refunds_truncation_ambiguous'
    },
    {
      node: refundLineItemsTruncated,
      reason: 'refund_line_items_truncated'
    },
    {
      node: refundTransactionsTruncated,
      reason: 'refund_transactions_truncated'
    }
  ]

  for (const testCase of cases) {
    const { dependencies, releaseCalls } = baseDependencies({
      fetchOrdersPage: async () => ({
        nodes: [testCase.node],
        hasNextPage: false,
        endCursor: null
      })
    })

    const summary = await runShopifyCommerceReconciliation(
      { runMode: 'accept' },
      dependencies
    )

    assert.equal(summary.status, 'partial_page_failure')
    assert.equal(summary.failures[0]?.reason, testCase.reason)
    assert.equal(summary.watermarkAdvanced, false)
    assert.equal(
      (releaseCalls[0] as { watermark?: unknown }).watermark,
      undefined
    )
  }
})

test('active-window metadata failure releases the lease without fetching', async () => {
  const { dependencies, fetchCalls, releaseCalls } =
    baseDependencies({ updateLeaseWindow: async () => false })

  const summary = await runShopifyCommerceReconciliation(
    { runMode: 'accept' },
    dependencies
  )

  assert.equal(summary.status, 'postgres_unavailable')
  assert.equal(
    summary.failures[0]?.reason,
    'active_window_metadata_update_failed'
  )
  assert.equal(fetchCalls.length, 0)
  assert.equal(
    (releaseCalls[0] as { watermark?: unknown }).watermark,
    undefined
  )
})

test('early failure summaries survive a lease release exception', async () => {
  const { dependencies } = baseDependencies({
    updateLeaseWindow: async () => false,
    releaseLease: async () => {
      throw new Error('sensitive_database_error')
    }
  })

  const summary = await runShopifyCommerceReconciliation(
    { runMode: 'accept' },
    dependencies
  )

  assert.equal(summary.status, 'postgres_unavailable')
  assert.equal(
    summary.failures[0]?.reason,
    'active_window_metadata_update_failed'
  )
  assert.equal(
    JSON.stringify(summary).includes('sensitive_database_error'),
    false
  )
})

test('purchase mapping failures use a fixed PII-free reason', async () => {
  const { dependencies } = baseDependencies({
    fetchOrdersPage: async () => ({
      nodes: [
        order({
          legacyResourceId: '450',
          displayFinancialStatus: 'PAID'
        })
      ],
      hasNextPage: false,
      endCursor: null
    }),
    mapPurchase: () => {
      throw new Error('sensitive_customer_error')
    }
  })

  const summary = await runShopifyCommerceReconciliation(
    { runMode: 'accept' },
    dependencies
  )

  assert.equal(summary.status, 'mapping_invalid')
  assert.equal(
    summary.failures[0]?.reason,
    'purchase_mapping_invalid'
  )
  assert.equal(
    JSON.stringify(summary).includes('sensitive_customer_error'),
    false
  )
})

test('refund mapping failures use a fixed PII-free reason', async () => {
  const { dependencies } = baseDependencies({
    fetchOrdersPage: async () => ({
      nodes: [
        order({
          legacyResourceId: '451',
          displayFinancialStatus: 'PENDING',
          refunds: [refundNode('951', '10.00')]
        })
      ],
      hasNextPage: false,
      endCursor: null
    }),
    mapRefund: () => {
      throw new Error('sensitive_customer_error')
    }
  })

  const summary = await runShopifyCommerceReconciliation(
    { runMode: 'accept' },
    dependencies
  )

  assert.equal(summary.status, 'mapping_invalid')
  assert.equal(
    summary.failures[0]?.reason,
    'refund_mapping_invalid'
  )
  assert.equal(
    JSON.stringify(summary).includes('sensitive_customer_error'),
    false
  )
})

test('canonical acceptance failures have fixed purchase and refund reasons', async () => {
  const paidOrder = order({
    legacyResourceId: '452',
    displayFinancialStatus: 'PAID'
  })
  const purchaseDependencies = baseDependencies({
    fetchOrdersPage: async () => ({
      nodes: [paidOrder],
      hasNextPage: false,
      endCursor: null
    }),
    acceptPurchase: async () => {
      throw new Error('sensitive_database_error')
    }
  }).dependencies

  const purchaseSummary = await runShopifyCommerceReconciliation(
    { runMode: 'accept' },
    purchaseDependencies
  )

  assert.equal(purchaseSummary.status, 'canonical_acceptance')
  assert.equal(
    purchaseSummary.failures[0]?.reason,
    'purchase_canonical_acceptance_failed'
  )
  assert.equal(
    JSON.stringify(purchaseSummary).includes(
      'sensitive_database_error'
    ),
    false
  )

  const refundedOrder = order({
    legacyResourceId: '453',
    displayFinancialStatus: 'PENDING',
    refunds: [refundNode('953', '10.00')]
  })
  const refundDependencies = baseDependencies({
    fetchOrdersPage: async () => ({
      nodes: [refundedOrder],
      hasNextPage: false,
      endCursor: null
    }),
    acceptRefund: async () => {
      throw new Error('sensitive_database_error')
    }
  }).dependencies

  const refundSummary = await runShopifyCommerceReconciliation(
    { runMode: 'accept' },
    refundDependencies
  )

  assert.equal(refundSummary.status, 'canonical_acceptance')
  assert.equal(
    refundSummary.failures[0]?.reason,
    'refund_canonical_acceptance_failed'
  )
  assert.equal(
    JSON.stringify(refundSummary).includes(
      'sensitive_database_error'
    ),
    false
  )
})

test('completed acceptance fails visibly when watermark release is unconfirmed', async () => {
  const { dependencies } = baseDependencies({
    releaseLease: async () => ({
      released: false,
      watermarkAdvanced: false
    })
  })

  const summary = await runShopifyCommerceReconciliation(
    { runMode: 'accept' },
    dependencies
  )

  assert.equal(summary.ok, false)
  assert.equal(summary.status, 'postgres_unavailable')
  assert.equal(summary.watermarkAdvanced, false)
  assert.equal(
    summary.failures[0]?.reason,
    'watermark_release_unconfirmed'
  )
})

test('completed dry-run fails visibly when lease release is unconfirmed', async () => {
  const { dependencies } = baseDependencies({
    releaseLease: async () => ({
      released: false,
      watermarkAdvanced: false
    })
  })

  const summary = await runShopifyCommerceReconciliation(
    { runMode: 'dry-run' },
    dependencies
  )

  assert.equal(summary.ok, false)
  assert.equal(summary.status, 'postgres_unavailable')
  assert.equal(
    summary.failures[0]?.reason,
    'lease_release_unconfirmed'
  )
})

test('lease release exceptions become a PII-free postgres failure summary', async () => {
  const { dependencies } = baseDependencies({
    releaseLease: async () => {
      throw new Error('sensitive_database_error')
    }
  })

  const summary = await runShopifyCommerceReconciliation(
    { runMode: 'accept' },
    dependencies
  )

  assert.equal(summary.ok, false)
  assert.equal(summary.status, 'postgres_unavailable')
  assert.equal(summary.watermarkAdvanced, false)
  assert.equal(
    summary.failures[0]?.reason,
    'watermark_release_unconfirmed'
  )
  assert.equal(
    JSON.stringify(summary).includes('sensitive_database_error'),
    false
  )
})

test('red gate 6: implementation does not import provider dispatch helpers', async () => {
  const fs = await import('node:fs/promises')
  const path = await import('node:path')
  const root = process.cwd()
  const files = [
    'src/lib/analytics/server/fetchShopifyCommerceReconciliationOrders.ts',
    'src/lib/analytics/server/shopifyGraphqlOrderToCanonicalPurchase.ts',
    'src/lib/analytics/server/shopifyGraphqlRefundToCanonicalRefund.ts',
    'src/lib/analytics/server/mapShopifyGraphqlOrderPurchasePricing.ts',
    'src/lib/analytics/server/runShopifyCommerceReconciliation.ts',
    'src/lib/analytics/server/claimShopifyCommerceReconciliationLease.ts',
    'src/lib/analytics/server/releaseShopifyCommerceReconciliationLease.ts',
    'src/app/api/cron/shopify-commerce-reconciliation/route.ts'
  ].map(file => path.join(root, file))

  const pattern =
    /runRegisteredProviderOutboxBatch|dispatchCanonical|send.*Meta|send.*Google|send.*Microsoft|marketing\.event_ledger|ops\.provider_dispatch_attempts/

  for (const file of files) {
    const content = await fs.readFile(file, 'utf8')
    assert.equal(
      pattern.test(content),
      false,
      `unexpected provider dispatch import in ${file}`
    )
  }
})

test('hashing helper used for failure resource ids stays PII-free length', () => {
  const hash = createHash('sha256')
    .update('order-1')
    .digest('hex')
    .slice(0, 16)
  assert.equal(hash.length, 16)
})
