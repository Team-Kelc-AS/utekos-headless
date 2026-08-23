import { shopifyCheckoutRecoveryEvidenceSchema } from './shopifyCheckoutRecoveryEvidenceContract'
import { protectShopifyCheckoutRecoveryEvidenceEmail } from './protectShopifyCheckoutRecoveryEvidenceEmail'
import type { ShopifyCheckoutRecoveryEvidenceStore } from './shopifyCheckoutRecoveryEvidenceStore'

const MAX_BODY_BYTES = 8 * 1024
const FINGERPRINT_PATTERN = /^[a-f0-9]{64}$/u

const RESPONSE_HEADERS = {
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Max-Age': '86400',
  'Cache-Control': 'no-store',
  'Cross-Origin-Resource-Policy': 'cross-origin'
} as const

type Dependencies = {
  enabled: boolean
  protectEmail?: (email: string) => string
  store: ShopifyCheckoutRecoveryEvidenceStore
}

function jsonResponse(body: unknown, status: number) {
  return Response.json(body, {
    status,
    headers: RESPONSE_HEADERS
  })
}

export async function handleShopifyCheckoutRecoveryEvidence(
  request: Request,
  dependencies: Dependencies
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
    Number.isFinite(contentLength)
    && contentLength > MAX_BODY_BYTES
  ) {
    return jsonResponse(
      { accepted: false, reason: 'payload_too_large' },
      413
    )
  }

  let rawBody: string

  try {
    rawBody = await request.text()
  } catch {
    return jsonResponse(
      { accepted: false, reason: 'invalid_body' },
      400
    )
  }

  if (new TextEncoder().encode(rawBody).byteLength > MAX_BODY_BYTES) {
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
    shopifyCheckoutRecoveryEvidenceSchema.safeParse(candidate)

  if (!parsed.success) {
    return jsonResponse(
      { accepted: false, reason: 'invalid_evidence' },
      400
    )
  }

  const protectEmail =
    dependencies.protectEmail
    ?? protectShopifyCheckoutRecoveryEvidenceEmail

  let recipientFingerprint: string

  try {
    recipientFingerprint = protectEmail(parsed.data.email)
  } catch {
    return jsonResponse(
      { accepted: false, reason: 'protection_unavailable' },
      503
    )
  }

  if (!FINGERPRINT_PATTERN.test(recipientFingerprint)) {
    return jsonResponse(
      { accepted: false, reason: 'protection_unavailable' },
      503
    )
  }

  const { email: _, ...evidenceWithoutEmail } = parsed.data

  let result

  try {
    result = await dependencies.store.persist({
      ...evidenceWithoutEmail,
      recipientFingerprint
    })
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

  return new Response(null, {
    status: 204,
    headers: RESPONSE_HEADERS
  })
}
