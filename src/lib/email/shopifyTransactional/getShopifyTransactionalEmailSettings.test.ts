import assert from 'node:assert/strict'
import test from 'node:test'

import {
  getShopifyTransactionalEmailSettings
} from './getShopifyTransactionalEmailSettings'

test('defaults to a disabled fail-closed mode', () => {
  assert.deepEqual(getShopifyTransactionalEmailSettings({}), {
    activationAt: null,
    canaryEmail: null,
    mode: 'disabled',
    notificationTypes: [],
    shopDomain: null
  })
})

test('requires activation, shop identity and recipient in canary mode', () => {
  assert.deepEqual(
    getShopifyTransactionalEmailSettings({
      SHOPIFY_TRANSACTIONAL_EMAILS_MODE: 'canary',
      SHOPIFY_TRANSACTIONAL_EMAILS_ACTIVATION_AT:
        '2026-09-10T10:00:00+02:00',
      SHOPIFY_TRANSACTIONAL_EMAILS_CANARY_EMAIL:
        ' CANARY@UTEKOS.NO ',
      SHOPIFY_TRANSACTIONAL_EMAILS_NOTIFICATION_TYPES:
        'order_confirmation, shipment_delivered',
      STORE_DOMAIN: 'erling-7921.myshopify.com'
    }),
    {
      activationAt: '2026-09-10T08:00:00.000Z',
      canaryEmail: 'canary@utekos.no',
      mode: 'canary',
      notificationTypes: [
        'order_confirmation',
        'shipment_delivered'
      ],
      shopDomain: 'erling-7921.myshopify.com'
    }
  )

  assert.throws(
    () => getShopifyTransactionalEmailSettings({
      SHOPIFY_TRANSACTIONAL_EMAILS_MODE: 'canary',
      SHOPIFY_TRANSACTIONAL_EMAILS_ACTIVATION_AT:
        '2026-09-10T08:00:00Z',
      SHOPIFY_TRANSACTIONAL_EMAILS_NOTIFICATION_TYPES:
        'order_confirmation',
      STORE_DOMAIN: 'erling-7921.myshopify.com'
    }),
    /canary_email_missing/u
  )
})

test('requires an explicit valid unique notification allowlist', () => {
  const base = {
    SHOPIFY_TRANSACTIONAL_EMAILS_MODE: 'live',
    SHOPIFY_TRANSACTIONAL_EMAILS_ACTIVATION_AT:
      '2026-09-10T08:00:00Z',
    STORE_DOMAIN: 'erling-7921.myshopify.com'
  }

  assert.throws(
    () => getShopifyTransactionalEmailSettings(base),
    /notification_types_invalid/u
  )

  assert.throws(
    () => getShopifyTransactionalEmailSettings({
      ...base,
      SHOPIFY_TRANSACTIONAL_EMAILS_NOTIFICATION_TYPES:
        'order_confirmation,order_confirmation'
    }),
    /notification_types_invalid/u
  )

  assert.throws(
    () => getShopifyTransactionalEmailSettings({
      ...base,
      SHOPIFY_TRANSACTIONAL_EMAILS_NOTIFICATION_TYPES:
        'order_confirmation,unknown_notification'
    }),
    /notification_types_invalid/u
  )
})

test('keeps native order and shipping confirmations out of live mode', () => {
  const base = {
    SHOPIFY_TRANSACTIONAL_EMAILS_MODE: 'live',
    SHOPIFY_TRANSACTIONAL_EMAILS_ACTIVATION_AT:
      '2026-09-10T08:00:00Z',
    STORE_DOMAIN: 'erling-7921.myshopify.com'
  }

  for (const notificationType of [
    'order_confirmation',
    'shipping_confirmation'
  ]) {
    assert.throws(
      () => getShopifyTransactionalEmailSettings({
        ...base,
        SHOPIFY_TRANSACTIONAL_EMAILS_NOTIFICATION_TYPES:
          notificationType
      }),
      /live_notification_types_unsupported/u
    )
  }

  assert.deepEqual(
    getShopifyTransactionalEmailSettings({
      ...base,
      SHOPIFY_TRANSACTIONAL_EMAILS_NOTIFICATION_TYPES:
        'shipment_out_for_delivery,shipment_delivered'
    }).notificationTypes,
    [
      'shipment_out_for_delivery',
      'shipment_delivered'
    ]
  )
})
