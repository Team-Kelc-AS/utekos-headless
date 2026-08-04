import { shopifyCheckoutObservationSchema } from '../shopifyCheckoutObservationContract'
import type { ShopifyCheckoutObservationStore } from './shopifyCheckoutObservationStore'
import type { ShopifyAddPaymentInfoPromotionResult } from './promoteShopifyAddPaymentInfoObservation'

export const MAX_SHOPIFY_CHECKOUT_OBSERVATION_BYTES = 16 * 1_024

const RESPONSE_HEADERS = {
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Expose-Headers':
    'X-Shopify-Checkout-Observation-Result, X-Shopify-Checkout-Canonical-Result',
  'Access-Control-Max-Age': '86400',
  'Cache-Control': 'no-store',
  'Cross-Origin-Resource-Policy': 'cross-origin'
} as const

type HandlerDependencies = {
  enabled: boolean
  promote?: (
    observation: Parameters<
      ShopifyCheckoutObservationStore['persist']
    >[0]
  ) => Promise<ShopifyAddPaymentInfoPromotionResult>
  store: ShopifyCheckoutObservationStore
}

export async function handleShopifyCheckoutObservation(
  request: Request,
  dependencies: HandlerDependencies
) {
  if (!dependencies.enabled) {
    return jsonResponse(
      { accepted: false, reason: 'receiver_disabled' },
      404
    )
  }

  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: RESPONSE_HEADERS
    })
  }

  if (request.method !== 'POST') {
    return jsonResponse(
      { accepted: false, reason: 'method_not_allowed' },
      405
    )
  }

  if (
    !request.headers
      .get('content-type')
      ?.startsWith('application/json')
  ) {
    return jsonResponse(
      { accepted: false, reason: 'invalid_content_type' },
      415
    )
  }

  const contentLength = Number(
    request.headers.get('content-length')
  )
  if (
    Number.isFinite(contentLength) &&
    contentLength > MAX_SHOPIFY_CHECKOUT_OBSERVATION_BYTES
  ) {
    return jsonResponse(
      { accepted: false, reason: 'payload_too_large' },
      413
    )
  }

  let rawBody: string | null
  try {
    rawBody = await readBodyWithinLimit(
      request,
      MAX_SHOPIFY_CHECKOUT_OBSERVATION_BYTES
    )
  } catch {
    return jsonResponse(
      { accepted: false, reason: 'invalid_body' },
      400
    )
  }
  if (rawBody === null) {
    return jsonResponse(
      { accepted: false, reason: 'payload_too_large' },
      413
    )
  }

  let candidate: unknown
  try {
    candidate = JSON.parse(rawBody)
  } catch {
    return jsonResponse(
      { accepted: false, reason: 'invalid_json' },
      400
    )
  }

  const parsed =
    shopifyCheckoutObservationSchema.safeParse(candidate)
  if (!parsed.success) {
    return jsonResponse(
      { accepted: false, reason: 'invalid_observation' },
      400
    )
  }

  let result
  try {
    result = await dependencies.store.persist(parsed.data)
  } catch {
    return jsonResponse(
      { accepted: false, reason: 'storage_unavailable' },
      503
    )
  }

  if (result.status === 'conflict') {
    return jsonResponse(
      { accepted: false, reason: 'idempotency_conflict' },
      409
    )
  }

  let canonicalResult: ShopifyAddPaymentInfoPromotionResult | undefined
  try {
    canonicalResult = await dependencies.promote?.(parsed.data)
  } catch {
    return jsonResponse(
      {
        accepted: false,
        reason: 'canonical_promotion_unavailable'
      },
      503
    )
  }

  return new Response(null, {
    status: 204,
    headers: {
      ...RESPONSE_HEADERS,
      'X-Shopify-Checkout-Observation-Result': result.status,
      ...(canonicalResult ?
        {
          'X-Shopify-Checkout-Canonical-Result':
            canonicalResult.status
        }
      : {})
    }
  })
}

function jsonResponse(body: unknown, status: number) {
  return Response.json(body, {
    status,
    headers: RESPONSE_HEADERS
  })
}

async function readBodyWithinLimit(
  request: Request,
  maxBytes: number
) {
  if (!request.body) {
    return ''
  }

  const reader = request.body.getReader()
  const chunks: Uint8Array[] = []
  let byteLength = 0

  let readResult = await reader.read()
  while (!readResult.done) {
    const { value } = readResult
    byteLength += value.byteLength
    if (byteLength > maxBytes) {
      await reader.cancel()
      return null
    }
    chunks.push(value)
    readResult = await reader.read()
  }

  const body = new Uint8Array(byteLength)
  let offset = 0
  for (const chunk of chunks) {
    body.set(chunk, offset)
    offset += chunk.byteLength
  }

  return new TextDecoder('utf-8', { fatal: true }).decode(body)
}
