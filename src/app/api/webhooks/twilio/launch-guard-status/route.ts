import { Buffer } from 'node:buffer'
import { z } from 'zod'
import { postgresIntegrationHealthStore } from '@/lib/observability/launchGuard/postgresIntegrationHealthStore'
import {
  resolveTwilioCallbackUrl,
  verifyTwilioFormSignature
} from '@/lib/observability/launchGuard/twilioLaunchGuardSms'

const MAX_CALLBACK_BYTES = 10_000
const noStoreHeaders = { 'Cache-Control': 'no-store' } as const

const callbackSchema = z.object({
  deliveryId: z.string().uuid(),
  messageSid: z.string().regex(/^SM[0-9a-fA-F]{32}$/u),
  messageStatus: z.enum([
    'accepted',
    'scheduled',
    'queued',
    'sending',
    'sent',
    'delivered',
    'undelivered',
    'failed',
    'canceled',
    'read'
  ]),
  errorCode: z.string().regex(/^[0-9]{1,10}$/u).optional()
})

type Dependencies = {
  getAuthToken: () => string | undefined
  getCallbackOrigin: () => string | undefined
  now: () => Date
  updateDelivery: typeof postgresIntegrationHealthStore.updateTwilioDelivery
}

const defaultDependencies: Dependencies = {
  getAuthToken: () => process.env.TWILIO_ALERT_AUTH_TOKEN,
  getCallbackOrigin: () =>
    process.env.TWILIO_ALERT_STATUS_CALLBACK_ORIGIN,
  now: () => new Date(),
  updateDelivery: input =>
    postgresIntegrationHealthStore.updateTwilioDelivery(input)
}

function mappedStatus(
  status: z.infer<typeof callbackSchema>['messageStatus']
) {
  if (status === 'delivered' || status === 'read') {
    return 'delivered' as const
  }
  if (
    status === 'undelivered' ||
    status === 'failed' ||
    status === 'canceled'
  ) {
    return 'failed' as const
  }
  return 'sent' as const
}

export async function handleTwilioLaunchGuardStatus(
  request: Request,
  dependencies: Dependencies = defaultDependencies
) {
  const authToken = dependencies.getAuthToken()?.trim()
  const callbackOrigin = dependencies.getCallbackOrigin()?.trim()
  if (!authToken || !callbackOrigin) {
    return Response.json(
      { ok: false, error: 'callback_not_configured' },
      { status: 503, headers: noStoreHeaders }
    )
  }

  const contentLength = Number(
    request.headers.get('content-length') ?? '0'
  )
  if (
    Number.isFinite(contentLength) &&
    contentLength > MAX_CALLBACK_BYTES
  ) {
    return Response.json(
      { ok: false, error: 'payload_too_large' },
      { status: 413, headers: noStoreHeaders }
    )
  }

  const body = await request.text()
  if (Buffer.byteLength(body, 'utf8') > MAX_CALLBACK_BYTES) {
    return Response.json(
      { ok: false, error: 'payload_too_large' },
      { status: 413, headers: noStoreHeaders }
    )
  }

  const form = new URLSearchParams(body)
  const signature = request.headers.get('x-twilio-signature') ?? ''
  let publicUrl: string
  try {
    publicUrl = resolveTwilioCallbackUrl({
      callbackOrigin,
      requestUrl: request.url
    })
  } catch {
    return Response.json(
      { ok: false, error: 'callback_configuration_invalid' },
      { status: 503, headers: noStoreHeaders }
    )
  }

  if (
    !signature ||
    !verifyTwilioFormSignature({
      authToken,
      form,
      signature,
      url: publicUrl
    })
  ) {
    return Response.json(
      { ok: false },
      { status: 401, headers: noStoreHeaders }
    )
  }

  const parsed = callbackSchema.safeParse({
    deliveryId: new URL(request.url).searchParams.get('delivery_id'),
    errorCode: form.get('ErrorCode') || undefined,
    messageSid: form.get('MessageSid'),
    messageStatus: form.get('MessageStatus')
  })
  if (!parsed.success) {
    return Response.json(
      { ok: false, error: 'invalid_callback' },
      { status: 400, headers: noStoreHeaders }
    )
  }

  const status = mappedStatus(parsed.data.messageStatus)
  const updated = await dependencies.updateDelivery({
    deliveryId: parsed.data.deliveryId,
    ...(status === 'failed' ?
      {
        failureCode:
          parsed.data.errorCode ?
            `twilio_error_${parsed.data.errorCode}`
          : `twilio_${parsed.data.messageStatus}`
      }
    : {}),
    messageSid: parsed.data.messageSid,
    now: dependencies.now(),
    status
  })

  if (!updated) {
    return Response.json(
      { ok: false, error: 'delivery_not_found' },
      { status: 404, headers: noStoreHeaders }
    )
  }

  return new Response(null, {
    status: 204,
    headers: noStoreHeaders
  })
}

export function POST(request: Request) {
  return handleTwilioLaunchGuardStatus(request)
}
