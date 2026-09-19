import { $ZodError } from 'zod/v4/core'
import 'server-only'

import { acceptCanonicalRefund } from '@/lib/analytics/server/acceptCanonicalRefund'
import { postgresCanonicalEventStore } from '@/lib/analytics/server/postgresCanonicalPageViewStore'
import { createShopifyWebhookCommerceSourceEvidence } from '@/lib/analytics/server/shopifyCommerceSourceEvidence'
import { shopifyRefundToCanonicalRefund } from '@/lib/analytics/server/shopifyRefundToCanonicalRefund'
import type { ShopifyRefundWebhook } from '@/lib/analytics/server/shopifyRefundWebhookPayload'
import { verifyShopifyWebhook } from '@/lib/shopify/verifyShopifyWebhook'

const NO_STORE_HEADERS = {
  'Cache-Control': 'no-store, max-age=0',
  'Content-Type': 'application/json; charset=utf-8'
}

type ShopifyRefundsCreateWebhookDependencies = {
  acceptRefund?: typeof acceptCanonicalRefund
  createSourceEvidence?: typeof createShopifyWebhookCommerceSourceEvidence
  mapRefund?: typeof shopifyRefundToCanonicalRefund
  now?: () => Date
  verifyWebhook?: typeof verifyShopifyWebhook
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

export async function handleShopifyRefundsCreateWebhook(
  request: Request,
  dependencies: ShopifyRefundsCreateWebhookDependencies = {}
) {
  const verifyWebhook =
    dependencies.verifyWebhook ?? verifyShopifyWebhook
  const mapRefund =
    dependencies.mapRefund ?? shopifyRefundToCanonicalRefund
  const acceptRefund =
    dependencies.acceptRefund ?? acceptCanonicalRefund
  const createSourceEvidence =
    dependencies.createSourceEvidence ??
    createShopifyWebhookCommerceSourceEvidence
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

  let refundPayload: unknown

  try {
    refundPayload = JSON.parse(rawBody)
  } catch {
    return jsonResponse({ error: 'invalid_json' }, 400)
  }

  try {
    const canonicalRefund = mapRefund(
      refundPayload as ShopifyRefundWebhook
    )
    const sourceEvidence = createSourceEvidence({
      event: canonicalRefund,
      headers: request.headers,
      observedAt: now()
    })
    const result = await acceptRefund({
      payload: canonicalRefund,
      requestContext: {},
      sourceEvidence,
      store: postgresCanonicalEventStore
    })

    return jsonResponse(
      { event_id: result.event_id, status: result.status },
      result.status === 'accepted' ? 202 : 200
    )
  } catch (error) {
    if (error instanceof $ZodError) {
      return jsonResponse({ error: 'invalid_event' }, 400)
    }

    console.error('[refunds-create-webhook] failed', error)
    return jsonResponse({ error: 'internal_error' }, 500)
  }
}
