import { start } from 'workflow/api'

import {
  shopifyTransactionalEmailWorkflow
} from '@/workflows/shopifyTransactionalEmail'

import {
  getShopifyTransactionalEmailSettings,
  type ShopifyTransactionalEmailSettings
} from './getShopifyTransactionalEmailSettings'
import {
  shopifyTransactionalEmailEvidenceSchema,
  type ShopifyTransactionalEmailEvidence
} from './shopifyTransactionalEmailEvidenceContract'

const MAX_BODY_BYTES = 16 * 1024

type Dependencies = {
  getSettings?: () => ShopifyTransactionalEmailSettings
  startWorkflow?: (
    evidence: ShopifyTransactionalEmailEvidence
  ) => Promise<{ runId: string }>
  verifyCaller: (request: Request) => Promise<boolean>
}

function jsonResponse(body: unknown, status: number) {
  return Response.json(body, {
    status,
    headers: { 'Cache-Control': 'no-store' }
  })
}

export async function handleShopifyTransactionalEmailEvidence(
  request: Request,
  dependencies: Dependencies
) {
  if (!(await dependencies.verifyCaller(request))) {
    return jsonResponse({ accepted: false }, 401)
  }

  if (request.method !== 'POST') {
    return jsonResponse({ accepted: false }, 405)
  }

  if (!request.headers.get('content-type')
    ?.startsWith('application/json')) {
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

  const parsed = shopifyTransactionalEmailEvidenceSchema.safeParse(
    candidate
  )

  if (!parsed.success) {
    return jsonResponse({ accepted: false }, 400)
  }

  let settings: ShopifyTransactionalEmailSettings

  try {
    settings = (
      dependencies.getSettings
      ?? getShopifyTransactionalEmailSettings
    )()
  } catch {
    return jsonResponse(
      { accepted: false, error: 'invalid_activation_gate' },
      503
    )
  }

  if (settings.mode === 'disabled') {
    return new Response(null, {
      status: 204,
      headers: { 'Cache-Control': 'no-store' }
    })
  }

  if (!settings.notificationTypes.includes(
    parsed.data.notificationType
  )) {
    return new Response(null, {
      status: 204,
      headers: { 'Cache-Control': 'no-store' }
    })
  }

  if (
    !settings.activationAt
    || Date.parse(parsed.data.occurredAt)
      < Date.parse(settings.activationAt)
  ) {
    return new Response(null, {
      status: 204,
      headers: { 'Cache-Control': 'no-store' }
    })
  }

  const startWorkflow = dependencies.startWorkflow
    ?? (async evidence => {
      const run = await start(
        shopifyTransactionalEmailWorkflow,
        [evidence]
      )
      return { runId: run.runId }
    })

  try {
    await startWorkflow(parsed.data)
  } catch {
    return jsonResponse(
      { accepted: false, error: 'workflow_start_failed' },
      503
    )
  }

  return new Response(null, {
    status: 204,
    headers: { 'Cache-Control': 'no-store' }
  })
}
