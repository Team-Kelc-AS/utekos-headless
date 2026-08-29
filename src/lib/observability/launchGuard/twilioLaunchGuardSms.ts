import 'server-only'

import { Buffer } from 'node:buffer'
import { createHmac, timingSafeEqual } from 'node:crypto'
import { z } from 'zod'

type Environment = Readonly<Record<string, string | undefined>>
type FetchLike = (
  input: string | URL | Request,
  init?: RequestInit
) => Promise<Response>

const TWILIO_API_ORIGIN = 'https://api.twilio.com'
const TWILIO_TIMEOUT_MS = 8_000

const twilioMessageResponseSchema = z.object({
  sid: z.string().regex(/^SM[0-9a-fA-F]{32}$/u)
})

type TwilioSmsMessage = Readonly<{
  deliveryId: string
  integration: string
  kind: 'incident' | 'recovery' | 'test'
  severity: 'critical' | 'high' | 'medium' | 'low'
  summaryCode: string
  surface: string
}>

function nonEmpty(value: string | undefined) {
  const normalized = value?.trim()
  return normalized || undefined
}

function readConfig(environment: Environment) {
  const accountSid = nonEmpty(
    environment.TWILIO_ALERT_ACCOUNT_SID
  )
  const authToken = nonEmpty(
    environment.TWILIO_ALERT_AUTH_TOKEN
  )
  const messagingServiceSid = nonEmpty(
    environment.TWILIO_ALERT_MESSAGING_SERVICE_SID
  )
  const from = nonEmpty(environment.TWILIO_ALERT_FROM_E164)
  const to = nonEmpty(environment.TWILIO_ALERT_TO_E164)
  const callbackOrigin = nonEmpty(
    environment.TWILIO_ALERT_STATUS_CALLBACK_ORIGIN
  )

  if (
    !accountSid ||
    !/^AC[0-9a-fA-F]{32}$/u.test(accountSid) ||
    !authToken ||
    (!messagingServiceSid && !from) ||
    (messagingServiceSid &&
      !/^MG[0-9a-fA-F]{32}$/u.test(messagingServiceSid)) ||
    (from && !/^\+[1-9][0-9]{7,14}$/u.test(from)) ||
    !to ||
    !/^\+[1-9][0-9]{7,14}$/u.test(to) ||
    !callbackOrigin
  ) {
    return null
  }

  const origin = new URL(callbackOrigin)
  if (origin.protocol !== 'https:') return null
  origin.pathname = '/'
  origin.search = ''
  origin.hash = ''

  return {
    accountSid,
    authToken,
    callbackOrigin: origin,
    from,
    messagingServiceSid,
    to
  }
}

function safeCode(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9:_-]/gu, '_')
    .slice(0, 80)
}

function smsBody(message: TwilioSmsMessage) {
  if (message.kind === 'test') {
    return 'Utekos launch guard: kontrollert SMS-test. Ingen kundedata.'
  }

  const state =
    message.kind === 'recovery' ? 'GJENOPPRETTET' : 'HENDELSE'

  return [
    'Utekos launch guard',
    state,
    safeCode(message.severity),
    `${safeCode(message.integration)}/${safeCode(message.surface)}`,
    safeCode(message.summaryCode)
  ].join(': ')
}

export async function sendTwilioLaunchGuardSms(input: {
  environment: Environment
  fetch: FetchLike
  message: TwilioSmsMessage
}) {
  const config = readConfig(input.environment)
  const enabled =
    input.message.kind === 'test' ?
      input.environment.LAUNCH_GUARD_SMS_TEST_ENABLED === 'true'
    : input.environment.LAUNCH_GUARD_SMS_ENABLED === 'true'

  if (!enabled) {
    return { status: 'suppressed' as const, code: 'sms_not_enabled' }
  }
  if (!config) {
    return {
      status: 'suppressed' as const,
      code: 'sms_configuration_invalid'
    }
  }

  const callback = new URL(
    '/api/webhooks/twilio/launch-guard-status',
    config.callbackOrigin
  )
  callback.searchParams.set('delivery_id', input.message.deliveryId)
  const form = new URLSearchParams({
    Body: smsBody(input.message),
    StatusCallback: callback.toString(),
    To: config.to
  })
  if (config.messagingServiceSid) {
    form.set('MessagingServiceSid', config.messagingServiceSid)
  } else if (config.from) {
    form.set('From', config.from)
  }

  try {
    const response = await input.fetch(
      new URL(
        `/2010-04-01/Accounts/${config.accountSid}/Messages.json`,
        TWILIO_API_ORIGIN
      ),
      {
        body: form,
        cache: 'no-store',
        headers: {
          Accept: 'application/json',
          Authorization: `Basic ${Buffer.from(
            `${config.accountSid}:${config.authToken}`
          ).toString('base64')}`,
          'Content-Type':
            'application/x-www-form-urlencoded;charset=UTF-8'
        },
        method: 'POST',
        signal: AbortSignal.timeout(TWILIO_TIMEOUT_MS)
      }
    )

    if (!response.ok) {
      return {
        status: 'failed' as const,
        code: `twilio_http_${response.status}`
      }
    }

    const result = twilioMessageResponseSchema.parse(
      await response.json()
    )
    return {
      status: 'sent' as const,
      providerReceiptId: result.sid
    }
  } catch {
    return { status: 'failed' as const, code: 'twilio_request_failed' }
  }
}

export function verifyTwilioFormSignature(input: {
  authToken: string
  form: URLSearchParams
  signature: string
  url: string
}) {
  let payload = input.url
  const names = [...new Set(input.form.keys())].sort()
  for (const name of names) {
    for (const value of input.form.getAll(name).sort()) {
      payload += `${name}${value}`
    }
  }
  const expected = createHmac('sha1', input.authToken)
    .update(payload)
    .digest('base64')
  const actualBuffer = Buffer.from(input.signature)
  const expectedBuffer = Buffer.from(expected)

  return (
    actualBuffer.length === expectedBuffer.length &&
    timingSafeEqual(actualBuffer, expectedBuffer)
  )
}

export function resolveTwilioCallbackUrl(input: {
  callbackOrigin: string
  requestUrl: string
}) {
  const configuredOrigin = new URL(input.callbackOrigin)
  if (configuredOrigin.protocol !== 'https:') {
    throw new Error('twilio_callback_origin_must_use_https')
  }
  const received = new URL(input.requestUrl)
  configuredOrigin.pathname = received.pathname
  configuredOrigin.search = received.search
  configuredOrigin.hash = ''
  return configuredOrigin.toString()
}
