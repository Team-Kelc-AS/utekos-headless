import assert from 'node:assert/strict'
import test from 'node:test'

import type {
  ShopifyTransactionalEmailOrder
} from './fetchShopifyTransactionalEmailOrder'
import type {
  ShopifyTransactionalEmailSettings
} from './getShopifyTransactionalEmailSettings'
import {
  processShopifyTransactionalEmailEvidence
} from './processShopifyTransactionalEmailEvidence'
import type {
  ShopifyTransactionalEmailEvidence
} from './shopifyTransactionalEmailEvidenceContract'

const evidence: ShopifyTransactionalEmailEvidence = {
  contract: 'utekos.shopify.transactional_email_evidence',
  schemaVersion: 1,
  source: 'shopify_app_webhook',
  verificationStatus: 'shopify_hmac_verified',
  webhookId: '6d438f6d-f687-4ebc-a268-664112f710e1',
  eventName: 'orders/create',
  notificationType: 'order_confirmation',
  occurredAt: '2026-09-10T08:30:00.000Z',
  shopifyOrderId: 'gid://shopify/Order/6252199051413',
  shopifyFulfillmentId: null,
  shopDomain: 'erling-7921.myshopify.com'
}

const order: ShopifyTransactionalEmailOrder = {
  id: 'gid://shopify/Order/6252199051413',
  legacyResourceId: '6252199051413',
  name: '#1042',
  createdAt: '2026-09-10T08:30:00.000Z',
  cancelledAt: null,
  email: 'canary@utekos.no',
  canNotifyCustomer: true,
  statusPageUrl:
    'https://kasse.utekos.no/orders/status/opaque-token',
  currentTotalPriceSet: {
    presentmentMoney: {
      amount: '990.00',
      currencyCode: 'NOK'
    }
  },
  lineItems: {
    nodes: [
      {
        id: 'gid://shopify/LineItem/14584740544661',
        title: 'Comfyrobe',
        name: 'Comfyrobe - XL',
        quantity: 1,
        variantTitle: 'XL',
        image: null,
        originalUnitPriceSet: {
          presentmentMoney: {
            amount: '990.00',
            currencyCode: 'NOK'
          }
        },
        discountedTotalSet: {
          presentmentMoney: {
            amount: '990.00',
            currencyCode: 'NOK'
          }
        }
      }
    ],
    pageInfo: { hasNextPage: false, endCursor: null }
  }
}

function settings(
  overrides: Partial<ShopifyTransactionalEmailSettings> = {}
): ShopifyTransactionalEmailSettings {
  return {
    activationAt: '2026-09-10T08:00:00.000Z',
    canaryEmail: 'canary@utekos.no',
    mode: 'canary',
    notificationTypes: ['order_confirmation'],
    shopDomain: 'erling-7921.myshopify.com',
    ...overrides
  }
}

test('sends once with a deterministic order idempotency key', async () => {
  const deliveries: unknown[] = []
  const audits: unknown[] = []
  const result = await processShopifyTransactionalEmailEvidence(
    evidence,
    {
      getSettings: () => settings(),
      hasDelivery: async () => false,
      fetchOrder: async () => order,
      deliver: async input => {
        deliveries.push(input)
        return { ok: true, id: 'resend-order-1' }
      },
      recordDelivery: async input => {
        audits.push(input)
      },
      now: () => new Date('2026-09-10T08:31:00.000Z')
    }
  )

  assert.deepEqual(result, { status: 'sent' })
  assert.equal(
    (deliveries[0] as { idempotencyKey: string }).idempotencyKey,
    'shopify-transactional/v1/order_confirmation/6252199051413'
  )
  assert.deepEqual(audits, [
    {
      idempotencyKey:
        'shopify-transactional/v1/order_confirmation/6252199051413',
      notificationType: 'order_confirmation',
      shopifyOrderId: 'gid://shopify/Order/6252199051413',
      shopifyFulfillmentId: null,
      resendEmailId: 'resend-order-1',
      sentAt: new Date('2026-09-10T08:31:00.000Z')
    }
  ])
})

test('does not refetch or resend an audited delivery', async () => {
  const result = await processShopifyTransactionalEmailEvidence(
    evidence,
    {
      getSettings: () => settings(),
      hasDelivery: async () => true,
      fetchOrder: async () => {
        throw new Error('must not fetch')
      },
      deliver: async () => {
        throw new Error('must not send')
      }
    }
  )

  assert.deepEqual(result, { status: 'already_sent' })
})

test('suppresses notification types outside the explicit allowlist', async () => {
  const result = await processShopifyTransactionalEmailEvidence(
    evidence,
    {
      getSettings: () => settings({
        mode: 'live',
        notificationTypes: ['shipment_delivered']
      }),
      hasDelivery: async () => {
        throw new Error('must not query delivery audit')
      },
      fetchOrder: async () => {
        throw new Error('must not fetch')
      },
      deliver: async () => {
        throw new Error('must not send')
      }
    }
  )

  assert.deepEqual(result, {
    status: 'suppressed',
    reason: 'notification_type_disabled'
  })
})

test('canary mode suppresses every other recipient', async () => {
  const result = await processShopifyTransactionalEmailEvidence(
    evidence,
    {
      getSettings: () => settings({
        canaryEmail: 'another@utekos.no'
      }),
      hasDelivery: async () => false,
      fetchOrder: async () => order,
      deliver: async () => {
        throw new Error('must not send')
      }
    }
  )

  assert.deepEqual(result, {
    status: 'suppressed',
    reason: 'canary_mismatch'
  })
})

test('fails closed on cancelled orders and foreign status links', async () => {
  const baseDependencies = {
    getSettings: () => settings(),
    hasDelivery: async () => false,
    deliver: async () => {
      throw new Error('must not send')
    }
  }

  assert.deepEqual(
    await processShopifyTransactionalEmailEvidence(evidence, {
      ...baseDependencies,
      fetchOrder: async () => ({
        ...order,
        cancelledAt: '2026-09-10T08:32:00.000Z'
      })
    }),
    { status: 'suppressed', reason: 'cancelled' }
  )

  assert.deepEqual(
    await processShopifyTransactionalEmailEvidence(evidence, {
      ...baseDependencies,
      fetchOrder: async () => ({
        ...order,
        statusPageUrl: 'https://example.com/phishing'
      })
    }),
    {
      status: 'suppressed',
      reason: 'invalid_status_page_url'
    }
  )
})
