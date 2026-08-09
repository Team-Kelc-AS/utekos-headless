import { Resend, type WebhookEventPayload } from 'resend'

type PersistResendEvent = (input: {
  resendEventId: string
  event: WebhookEventPayload
}) => Promise<'ignored' | 'persisted'>

export const maxDuration = 10

export type ResendWebhookDependencies = {
  getWebhookSecret: () => string | undefined
  verify: (input: {
    payload: string
    headers: { id: string; timestamp: string; signature: string }
    webhookSecret: string
  }) => WebhookEventPayload
  persist: PersistResendEvent
}

const webhookVerifier = new Resend('re_webhook_verification_only')

const defaultDependencies: ResendWebhookDependencies = {
  getWebhookSecret: () => process.env.RESEND_WEBHOOK_SECRET,
  verify: input => webhookVerifier.webhooks.verify(input),
  persist: async input => {
    const { persistAbandonedCheckoutRecoveryResendEvent } =
      await import(
        '@/lib/email/abandonedCheckoutRecovery/persistAbandonedCheckoutRecoveryResendEvent'
      )
    return persistAbandonedCheckoutRecoveryResendEvent(input)
  }
}

function requireHeader(request: Request, name: string): string {
  const value = request.headers.get(name)

  if (!value) {
    throw new Error('resend_webhook_header_missing')
  }

  return value
}

export async function handleResendWebhook(
  request: Request,
  dependencies: ResendWebhookDependencies = defaultDependencies
) {
  const webhookSecret = dependencies.getWebhookSecret()

  if (!webhookSecret) {
    return Response.json(
      { ok: false },
      { status: 503, headers: { 'Cache-Control': 'no-store' } }
    )
  }

  try {
    const payload = await request.text()
    const resendEventId = requireHeader(request, 'svix-id')
    const event = dependencies.verify({
      payload,
      headers: {
        id: resendEventId,
        timestamp: requireHeader(request, 'svix-timestamp'),
        signature: requireHeader(request, 'svix-signature')
      },
      webhookSecret
    })
    const result = await dependencies.persist({
      resendEventId,
      event
    })

    return Response.json(
      { ok: true, result },
      { headers: { 'Cache-Control': 'no-store' } }
    )
  } catch {
    return Response.json(
      { ok: false },
      { status: 400, headers: { 'Cache-Control': 'no-store' } }
    )
  }
}

export function POST(request: Request) {
  return handleResendWebhook(request)
}
