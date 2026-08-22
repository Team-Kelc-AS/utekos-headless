import { z } from 'zod'

import { getResendClient } from '@/lib/email/client'
import {
  abandonedCheckoutRecoveryResendEventTypes,
  recordAbandonedCheckoutRecoveryResendEvent,
  type AbandonedCheckoutRecoveryResendEventType
} from '@/lib/email/abandonedCheckoutRecovery/recordAbandonedCheckoutRecoveryResendEvent'

type VerifiedWebhookPayload = {
  type: string
  created_at: string
  data: {
    email_id: string
  }
}

type Dependencies = {
  getWebhookSecret: () => string | undefined
  verify: (input: {
    payload: string
    headers: {
      id: string
      timestamp: string
      signature: string
    }
    webhookSecret: string
  }) => unknown
  record: (input: {
    resendEventId: string
    resendEmailId: string
    eventType: AbandonedCheckoutRecoveryResendEventType
    occurredAt: string
  }) => Promise<boolean>
}

const defaultDependencies: Dependencies = {
  getWebhookSecret: () => process.env.RESEND_WEBHOOK_SECRET,
  verify: input => getResendClient().webhooks.verify(input),
  record: recordAbandonedCheckoutRecoveryResendEvent
}

const eventSchema = z.strictObject({
  type: z.string(),
  created_at: z.string().datetime({ offset: true }),
  data: z.object({
    email_id: z.string()
      .regex(/^[A-Za-z0-9][A-Za-z0-9_-]{0,254}$/)
  }).passthrough()
}).passthrough()

const acceptedTypes = new Set<string>(
  abandonedCheckoutRecoveryResendEventTypes
)

const noStoreHeaders = {
  'Cache-Control': 'no-store'
} as const

export async function handleResendWebhook(
  request: Request,
  dependencies: Dependencies = defaultDependencies
) {
  const webhookSecret = dependencies.getWebhookSecret()

  if (!webhookSecret) {
    return Response.json(
      { ok: false, error: 'webhook_not_configured' },
      { status: 503, headers: noStoreHeaders }
    )
  }

  const id = request.headers.get('svix-id')
  const timestamp = request.headers.get('svix-timestamp')
  const signature = request.headers.get('svix-signature')

  if (!id || !timestamp || !signature) {
    return Response.json(
      { ok: false, error: 'missing_signature_headers' },
      { status: 400, headers: noStoreHeaders }
    )
  }

  const rawPayload = await request.text()
  let verified: unknown

  try {
    verified = dependencies.verify({
      payload: rawPayload,
      headers: { id, timestamp, signature },
      webhookSecret
    })
  } catch {
    return Response.json(
      { ok: false, error: 'invalid_signature' },
      { status: 401, headers: noStoreHeaders }
    )
  }

  const parsed = eventSchema.safeParse(verified)

  if (!parsed.success) {
    return Response.json(
      { ok: false, error: 'invalid_event' },
      { status: 400, headers: noStoreHeaders }
    )
  }

  if (!acceptedTypes.has(parsed.data.type)) {
    return Response.json(
      { ok: true, ignored: true },
      { headers: noStoreHeaders }
    )
  }

  const event = parsed.data as VerifiedWebhookPayload

  try {
    const recorded = await dependencies.record({
      resendEventId: id,
      resendEmailId: event.data.email_id,
      eventType:
        event.type as AbandonedCheckoutRecoveryResendEventType,
      occurredAt: event.created_at
    })

    return Response.json(
      recorded
        ? { ok: true, recorded: true }
        : { ok: true, ignored: true },
      { headers: noStoreHeaders }
    )
  } catch {
    return Response.json(
      { ok: false, error: 'persist_failed' },
      { status: 500, headers: noStoreHeaders }
    )
  }
}

export function POST(request: Request) {
  return handleResendWebhook(request)
}
