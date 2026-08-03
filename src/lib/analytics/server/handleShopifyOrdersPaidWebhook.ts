import 'server-only'

import { ZodError } from 'zod'
import { acceptCanonicalPurchase } from '@/lib/analytics/server/acceptCanonicalPurchase'
import { getVerifiedShopifyCustomerContext } from '@/lib/analytics/server/getVerifiedShopifyCustomerContext'
import { postgresCanonicalEventStore } from '@/lib/analytics/server/postgresCanonicalPageViewStore'
import { createShopifyWebhookCommerceSourceEvidence } from '@/lib/analytics/server/shopifyCommerceSourceEvidence'
import { shopifyOrderToCanonicalPurchase } from '@/lib/analytics/server/shopifyOrderToCanonicalPurchase'
import { sendPurchaseNotification } from '@/lib/email/sendPurchaseNotification'
import { verifyShopifyWebhook } from '@/lib/shopify/verifyShopifyWebhook'
import { logToAppLogs } from '@/lib/utils/logToAppLogs'
import type { OrderPaid } from 'types/commerce/order/OrderPaid'

const NO_STORE_HEADERS = {
  'Cache-Control': 'no-store, max-age=0',
  'Content-Type': 'application/json; charset=utf-8'
}

type ShopifyOrdersPaidWebhookDependencies = {
  acceptPurchase?: typeof acceptCanonicalPurchase
  createSourceEvidence?: typeof createShopifyWebhookCommerceSourceEvidence
  mapOrder?: typeof shopifyOrderToCanonicalPurchase
  notifyPurchase?: typeof sendPurchaseNotification
  now?: () => Date
  verifyWebhook?: typeof verifyShopifyWebhook
  writeLog?: typeof logToAppLogs
}

function jsonResponse(
  body: Record<string, unknown>,
  status: number
) {
  return Response.json(body, {
    headers: NO_STORE_HEADERS,
    status
  })
}

export async function handleShopifyOrdersPaidWebhook(
  request: Request,
  dependencies: ShopifyOrdersPaidWebhookDependencies = {}
) {
  const verifyWebhook =
    dependencies.verifyWebhook ?? verifyShopifyWebhook
  const mapOrder =
    dependencies.mapOrder ?? shopifyOrderToCanonicalPurchase
  const acceptPurchase =
    dependencies.acceptPurchase ?? acceptCanonicalPurchase
  const createSourceEvidence =
    dependencies.createSourceEvidence ??
    createShopifyWebhookCommerceSourceEvidence
  const notifyPurchase =
    dependencies.notifyPurchase ?? sendPurchaseNotification
  const writeLog = dependencies.writeLog ?? logToAppLogs
  const now = dependencies.now ?? (() => new Date())

  const hmac = request.headers.get('x-shopify-hmac-sha256') ?? ''
  let rawBody: string

  try {
    rawBody = await request.text()
  } catch {
    return jsonResponse({ error: 'failed_to_read_body' }, 400)
  }

  if (!verifyWebhook(rawBody, hmac)) {
    return jsonResponse(
      { error: 'invalid_webhook_signature' },
      401
    )
  }

  let orderPayload: unknown

  try {
    orderPayload = JSON.parse(rawBody)
  } catch {
    return jsonResponse({ error: 'invalid_json' }, 400)
  }

  try {
    const canonicalPurchase = mapOrder(orderPayload as OrderPaid)
    const sourceEvidence = createSourceEvidence({
      event: canonicalPurchase,
      headers: request.headers,
      observedAt: now()
    })
    const result = await acceptPurchase({
      payload: canonicalPurchase,
      requestContext: getVerifiedShopifyCustomerContext(
        canonicalPurchase
      ),
      sourceEvidence,
      store: postgresCanonicalEventStore
    })
    let notification

    try {
      notification = await notifyPurchase(canonicalPurchase)
    } catch {
      await writeLog({
        event: 'commerce.purchase_notification_failed',
        level: 'ERROR',
        data: {
          eventId: canonicalPurchase.event_id,
          reasonCode: 'configuration'
        },
        context: {
          requestPath: '/api/shopify/webhooks/orders-paid'
        }
      })
      return jsonResponse(
        { error: 'purchase_notification_failed' },
        500
      )
    }

    if (!notification.ok) {
      await writeLog({
        event: 'commerce.purchase_notification_failed',
        level: 'ERROR',
        data: {
          eventId: canonicalPurchase.event_id,
          reasonCode: notification.reason
        },
        context: {
          requestPath: '/api/shopify/webhooks/orders-paid'
        }
      })
      return jsonResponse(
        { error: 'purchase_notification_failed' },
        500
      )
    }

    await writeLog({
      event: 'commerce.purchase_notification_sent',
      level: 'INFO',
      data: {
        delivery: notification.delivery,
        eventId: canonicalPurchase.event_id
      },
      context: {
        requestPath: '/api/shopify/webhooks/orders-paid'
      }
    })

    return jsonResponse(
      { event_id: result.event_id, status: result.status },
      result.status === 'accepted' ? 202 : 200
    )
  } catch (error) {
    if (error instanceof ZodError) {
      return jsonResponse({ error: 'invalid_event' }, 400)
    }

    console.error('[orders-paid-webhook] failed', error)
    return jsonResponse({ error: 'internal_error' }, 500)
  }
}
