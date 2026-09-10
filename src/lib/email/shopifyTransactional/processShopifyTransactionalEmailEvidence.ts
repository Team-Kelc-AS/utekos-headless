import 'server-only'

import {
  deliverShopifyTransactionalEmail
} from './deliverShopifyTransactionalEmail'
import {
  fetchShopifyTransactionalEmailOrder
} from './fetchShopifyTransactionalEmailOrder'
import {
  getShopifyTransactionalEmailIdempotencyKey
} from './getShopifyTransactionalEmailIdempotencyKey'
import {
  getShopifyTransactionalEmailSettings,
  type ShopifyTransactionalEmailSettings
} from './getShopifyTransactionalEmailSettings'
import {
  hasShopifyTransactionalEmailDelivery,
  recordShopifyTransactionalEmailDelivery
} from './shopifyTransactionalEmailDeliveryAudit'
import type {
  ShopifyTransactionalEmailEvidence
} from './shopifyTransactionalEmailEvidenceContract'

type Dependencies = {
  deliver?: typeof deliverShopifyTransactionalEmail
  fetchOrder?: typeof fetchShopifyTransactionalEmailOrder
  getSettings?: () => ShopifyTransactionalEmailSettings
  hasDelivery?: typeof hasShopifyTransactionalEmailDelivery
  recordDelivery?: typeof recordShopifyTransactionalEmailDelivery
  now?: () => Date
}

function isAllowedStatusPageUrl(
  value: string,
  shopDomain: string
) {
  const url = new URL(value)
  return url.protocol === 'https:'
    && url.username === ''
    && url.password === ''
    && [
      'utekos.no',
      'www.utekos.no',
      'kasse.utekos.no',
      shopDomain
    ].includes(url.hostname)
}

export async function processShopifyTransactionalEmailEvidence(
  evidence: ShopifyTransactionalEmailEvidence,
  dependencies: Dependencies = {}
): Promise<
  | { status: 'already_sent' | 'sent' }
  | {
      status: 'suppressed'
      reason:
        | 'before_activation'
        | 'cancelled'
        | 'canary_mismatch'
        | 'disabled'
        | 'invalid_recipient'
        | 'invalid_status_page_url'
        | 'notification_type_disabled'
        | 'shop_mismatch'
    }
> {
  const settings = (
    dependencies.getSettings
    ?? getShopifyTransactionalEmailSettings
  )()

  if (settings.mode === 'disabled') {
    return { status: 'suppressed', reason: 'disabled' }
  }

  if (!settings.notificationTypes.includes(
    evidence.notificationType
  )) {
    return {
      status: 'suppressed',
      reason: 'notification_type_disabled'
    }
  }

  if (
    !settings.activationAt
    || !settings.shopDomain
  ) {
    throw new Error(
      'shopify_transactional_email_settings_incomplete'
    )
  }

  if (evidence.shopDomain !== settings.shopDomain) {
    return { status: 'suppressed', reason: 'shop_mismatch' }
  }

  if (
    Date.parse(evidence.occurredAt)
    < Date.parse(settings.activationAt)
  ) {
    return { status: 'suppressed', reason: 'before_activation' }
  }

  const idempotencyKey =
    getShopifyTransactionalEmailIdempotencyKey(evidence)
  const hasDelivery = dependencies.hasDelivery
    ?? hasShopifyTransactionalEmailDelivery

  if (await hasDelivery(idempotencyKey)) {
    return { status: 'already_sent' }
  }

  const order = await (
    dependencies.fetchOrder
    ?? fetchShopifyTransactionalEmailOrder
  )(evidence.shopifyOrderId)

  if (!order) {
    throw new Error(
      'shopify_transactional_email_order_missing'
    )
  }

  if (order.cancelledAt) {
    return { status: 'suppressed', reason: 'cancelled' }
  }

  if (!order.canNotifyCustomer || !order.email) {
    return { status: 'suppressed', reason: 'invalid_recipient' }
  }

  if (
    settings.mode === 'canary'
    && order.email !== settings.canaryEmail
  ) {
    return { status: 'suppressed', reason: 'canary_mismatch' }
  }

  if (!isAllowedStatusPageUrl(
    order.statusPageUrl,
    settings.shopDomain
  )) {
    return {
      status: 'suppressed',
      reason: 'invalid_status_page_url'
    }
  }

  const delivery = await (
    dependencies.deliver
    ?? deliverShopifyTransactionalEmail
  )({
    notificationType: evidence.notificationType,
    order,
    idempotencyKey
  })

  if (!delivery.ok) {
    throw new Error(
      `shopify_transactional_email_delivery_failed:${delivery.reason}`
    )
  }

  await (
    dependencies.recordDelivery
    ?? recordShopifyTransactionalEmailDelivery
  )({
    idempotencyKey,
    notificationType: evidence.notificationType,
    shopifyOrderId: evidence.shopifyOrderId,
    shopifyFulfillmentId: evidence.shopifyFulfillmentId,
    resendEmailId: delivery.id,
    sentAt: (dependencies.now ?? (() => new Date()))()
  })

  return { status: 'sent' }
}
