import 'server-only'

import { ZodError } from 'zod'
import { acceptCanonicalRemoveFromCart } from '@/lib/analytics/server/acceptCanonicalRemoveFromCart'
import { createShopifyCartWebhookSourceEvidence } from '@/lib/analytics/server/createShopifyCartWebhookSourceEvidence'
import {
  diffShopifyCartSnapshots,
  removalsFromCartDiff
} from '@/lib/analytics/server/diffShopifyCartSnapshots'
import { postgresCanonicalEventStore } from '@/lib/analytics/server/postgresCanonicalPageViewStore'
import {
  buildShopifyCartSnapshot,
  cartTokenFromWebhook,
  redisShopifyCartSnapshotStore,
  type ShopifyCartSnapshotStore
} from '@/lib/analytics/server/shopifyCartSnapshotStore'
import { shopifyCartRemovalToCanonicalRemoveFromCart } from '@/lib/analytics/server/shopifyCartRemovalToCanonicalRemoveFromCart'
import {
  shopifyCartsUpdateWebhookSchema,
  SHOPIFY_CARTS_UPDATE_TOPIC
} from '@/lib/analytics/server/shopifyCartsUpdateWebhookPayload'
import { verifyShopifyWebhook } from '@/lib/shopify/verifyShopifyWebhook'

const NO_STORE_HEADERS = {
  'Cache-Control': 'no-store, max-age=0',
  'Content-Type': 'application/json; charset=utf-8'
}

type ShopifyCartsUpdateWebhookDependencies = {
  acceptRemoveFromCart?: typeof acceptCanonicalRemoveFromCart
  createSourceEvidence?: typeof createShopifyCartWebhookSourceEvidence
  now?: () => Date
  snapshotStore?: ShopifyCartSnapshotStore
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

export async function handleShopifyCartsUpdateRemoveFromCartWebhook(
  request: Request,
  dependencies: ShopifyCartsUpdateWebhookDependencies = {}
) {
  const verifyWebhook =
    dependencies.verifyWebhook ?? verifyShopifyWebhook
  const snapshotStore =
    dependencies.snapshotStore ?? redisShopifyCartSnapshotStore
  const acceptRemoveFromCart =
    dependencies.acceptRemoveFromCart ??
    acceptCanonicalRemoveFromCart
  const createSourceEvidence =
    dependencies.createSourceEvidence ??
    createShopifyCartWebhookSourceEvidence
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

  const topic = request.headers.get('x-shopify-topic')
  if (topic && topic !== SHOPIFY_CARTS_UPDATE_TOPIC) {
    return jsonResponse({ error: 'unexpected_topic' }, 400)
  }

  let payloadJson: unknown

  try {
    payloadJson = JSON.parse(rawBody)
  } catch {
    return jsonResponse({ error: 'invalid_json' }, 400)
  }

  try {
    const payload = shopifyCartsUpdateWebhookSchema.parse(payloadJson)
    const observedAt = now()
    const currentSnapshot = buildShopifyCartSnapshot(
      payload,
      observedAt
    )
    const cartToken = cartTokenFromWebhook(payload)
    const priorSnapshot = await snapshotStore.get(cartToken)

    if (!priorSnapshot) {
      await snapshotStore.set(currentSnapshot)
      return jsonResponse(
        {
          status: 'prior_cart_missing',
          cart_token: cartToken,
          snapshot_stored: true,
          removals: []
        },
        200
      )
    }

    const deltas = diffShopifyCartSnapshots({
      prior: priorSnapshot,
      current: currentSnapshot
    })
    const removals = removalsFromCartDiff(deltas)
    const results: Array<{
      event_id: string
      status: 'accepted' | 'duplicate' | 'rejected'
      reason?: string
      variant_id: string
      quantity_removed: number
    }> = []

    for (const removal of removals) {
      const canonical = await shopifyCartRemovalToCanonicalRemoveFromCart({
        cartToken,
        priorLine: removal.prior_line,
        quantityRemoved: removal.quantity_removed,
        updatedAt: payload.updated_at
      })
      const sourceEvidence = createSourceEvidence({
        cartToken,
        eventId: canonical.event_id,
        headers: request.headers,
        observedAt
      })
      const accepted = await acceptRemoveFromCart({
        payload: canonical,
        requestContext: {},
        sourceEvidence,
        store: postgresCanonicalEventStore
      })

      if (accepted.status === 'rejected') {
        results.push({
          event_id: canonical.event_id,
          status: 'rejected',
          reason: accepted.reason,
          variant_id: removal.prior_line.variant_id,
          quantity_removed: removal.quantity_removed
        })
        continue
      }

      results.push({
        event_id: accepted.event_id,
        status: accepted.status,
        variant_id: removal.prior_line.variant_id,
        quantity_removed: removal.quantity_removed
      })
    }

    await snapshotStore.set(currentSnapshot)

    const status =
      removals.length === 0 ? 'noop'
      : results.some(result => result.status === 'accepted') ?
        'accepted'
      : results.every(result => result.status === 'duplicate') ?
        'duplicate'
      : 'processed'

    return jsonResponse(
      {
        status,
        cart_token: cartToken,
        snapshot_stored: true,
        removals: results
      },
      status === 'accepted' ? 202 : 200
    )
  } catch (error) {
    if (error instanceof ZodError) {
      return jsonResponse({ error: 'invalid_event' }, 400)
    }

    console.error('[carts-update-remove-from-cart] failed', error)
    return jsonResponse({ error: 'internal_error' }, 500)
  }
}
