import { protectShopifyCheckoutRecoveryEvidenceEmail } from './protectShopifyCheckoutRecoveryEvidenceEmail'
import { shopifyCheckoutRecoveryWebhookEvidenceSchema } from './shopifyCheckoutRecoveryEvidenceContract'
import type { ShopifyCheckoutRecoveryWebhookEvidenceStore } from './shopifyCheckoutRecoveryWebhookEvidenceStore'

const MAX_BODY_BYTES = 8 * 1024
const FINGERPRINT_PATTERN = /^[a-f0-9]{64}$/u

type Dependencies = {
  verifyCaller: (request: Request) => Promise<boolean>
  protectEmail?: (email: string) => string
  store: ShopifyCheckoutRecoveryWebhookEvidenceStore
}

function jsonResponse(body: unknown, status: number) {
  return Response.json(body, {
    status,
    headers: { 'Cache-Control': 'no-store' }
  })
}

export async function handleShopifyCheckoutRecoveryWebhookEvidence(
  request: Request,
  dependencies: Dependencies
) {
  if (!(await dependencies.verifyCaller(request))) {
    return jsonResponse({ accepted: false }, 401)
  }

  if (request.method !== 'POST') {
    return jsonResponse({ accepted: false }, 405)
  }

  if (
    !request.headers
      .get('content-type')
      ?.startsWith('application/json')
  ) {
    return jsonResponse({ accepted: false }, 415)
  }

  let rawBody: string

  try {
    rawBody = await request.text()
  } catch {
    return jsonResponse({ accepted: false }, 400)
  }

  if (new TextEncoder().encode(rawBody).byteLength > MAX_BODY_BYTES) {
    return jsonResponse({ accepted: false }, 413)
  }

  let candidate: unknown

  try {
    candidate = JSON.parse(rawBody)
  } catch {
    return jsonResponse({ accepted: false }, 400)
  }

  const parsed =
    shopifyCheckoutRecoveryWebhookEvidenceSchema.safeParse(candidate)

  if (!parsed.success) {
    return jsonResponse({ accepted: false }, 400)
  }

  const protectEmail =
    dependencies.protectEmail
    ?? protectShopifyCheckoutRecoveryEvidenceEmail
  let recipientFingerprint: string

  try {
    recipientFingerprint = protectEmail(parsed.data.email)
  } catch {
    return jsonResponse({ accepted: false }, 503)
  }

  if (!FINGERPRINT_PATTERN.test(recipientFingerprint)) {
    return jsonResponse({ accepted: false }, 503)
  }

  const { email: _, ...evidenceWithoutEmail } = parsed.data
  let result

  try {
    result = await dependencies.store.persist({
      ...evidenceWithoutEmail,
      recipientFingerprint
    })
  } catch {
    return jsonResponse({ accepted: false }, 503)
  }

  if (result.status === 'conflict') {
    return jsonResponse({ accepted: false }, 409)
  }

  return new Response(null, {
    status: 204,
    headers: { 'Cache-Control': 'no-store' }
  })
}
