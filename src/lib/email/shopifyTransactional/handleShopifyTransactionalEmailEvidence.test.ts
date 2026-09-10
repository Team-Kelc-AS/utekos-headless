import assert from 'node:assert/strict'
import test from 'node:test'

import {
  handleShopifyTransactionalEmailEvidence
} from './handleShopifyTransactionalEmailEvidence'
import type {
  ShopifyTransactionalEmailSettings
} from './getShopifyTransactionalEmailSettings'

const evidence = {
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
} as const

function post(body: unknown, token = 'oidc-token') {
  return new Request(
    'https://utekos.no/api/internal/shopify/transactional-email-evidence',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    }
  )
}

function settings(
  overrides: Partial<ShopifyTransactionalEmailSettings> = {}
): ShopifyTransactionalEmailSettings {
  return {
    activationAt: null,
    canaryEmail: null,
    mode: 'disabled',
    notificationTypes: [],
    shopDomain: null,
    ...overrides
  }
}

test('requires Vercel OIDC and rejects malformed evidence', async () => {
  const dependencies = {
    verifyCaller: async () => false,
    getSettings: () => settings()
  }

  assert.equal(
    (await handleShopifyTransactionalEmailEvidence(
      post(evidence, 'wrong'),
      dependencies
    )).status,
    401
  )

  assert.equal(
    (await handleShopifyTransactionalEmailEvidence(
      post({ ...evidence, shopifyOrderId: 'not-a-gid' }),
      { ...dependencies, verifyCaller: async () => true }
    )).status,
    400
  )
})

test('is inert by default and before the activation boundary', async () => {
  const startWorkflow = async () => {
    throw new Error('must not start')
  }

  assert.equal(
    (await handleShopifyTransactionalEmailEvidence(
      post(evidence),
      {
        verifyCaller: async () => true,
        getSettings: () => settings(),
        startWorkflow
      }
    )).status,
    204
  )

  assert.equal(
    (await handleShopifyTransactionalEmailEvidence(
      post(evidence),
      {
        verifyCaller: async () => true,
        getSettings: () => settings({
          activationAt: '2026-09-10T09:00:00.000Z',
          mode: 'canary',
          canaryEmail: 'canary@utekos.no',
          notificationTypes: ['order_confirmation'],
          shopDomain: 'erling-7921.myshopify.com'
        }),
        startWorkflow
      }
    )).status,
    204
  )
})

test('starts only a PII-free workflow after explicit activation', async () => {
  const inputs: unknown[] = []
  const response = await handleShopifyTransactionalEmailEvidence(
    post(evidence),
    {
      verifyCaller: async () => true,
      getSettings: () => settings({
        activationAt: '2026-09-10T08:00:00.000Z',
        mode: 'canary',
        canaryEmail: 'canary@utekos.no',
        notificationTypes: ['order_confirmation'],
        shopDomain: 'erling-7921.myshopify.com'
      }),
      startWorkflow: async input => {
        inputs.push(input)
        return { runId: 'wrun_test' }
      }
    }
  )

  assert.equal(response.status, 204)
  assert.deepEqual(inputs, [evidence])
  assert.equal(JSON.stringify(inputs).includes('@'), false)
})

test('does not start a workflow for a notification outside the allowlist', async () => {
  const response = await handleShopifyTransactionalEmailEvidence(
    post(evidence),
    {
      verifyCaller: async () => true,
      getSettings: () => settings({
        activationAt: '2026-09-10T08:00:00.000Z',
        mode: 'live',
        notificationTypes: ['shipment_delivered'],
        shopDomain: 'erling-7921.myshopify.com'
      }),
      startWorkflow: async () => {
        throw new Error('must not start')
      }
    }
  )

  assert.equal(response.status, 204)
})
