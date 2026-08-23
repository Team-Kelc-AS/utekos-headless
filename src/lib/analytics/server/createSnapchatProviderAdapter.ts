import type { z } from 'zod'
import type { CanonicalEvent } from '../canonicalEvent'
import { dispatchCanonicalEventToSnapchat } from './dispatchCanonicalEventToSnapchat'
import type {
  ProviderAdapter,
  ProviderAdapterKey
} from './providerAdapter'
import {
  SnapchatConversionsApiConfigError,
  SnapchatConversionsApiHttpError,
  SnapchatConversionsApiSkipError,
  type SnapchatSendResult
} from './sendSnapchatServerEvent'

export type SnapchatDispatchReceipt = {
  eventId: string
  eventName: string
  provider: 'snapchat'
  result: Extract<SnapchatSendResult, { status: 'sent' }>
}

const RETRYABLE_NETWORK_CODES = new Set([
  'ECONNRESET',
  'ECONNREFUSED',
  'ECONNABORTED',
  'EAI_AGAIN',
  'EHOSTUNREACH',
  'ENETUNREACH',
  'ENOTFOUND',
  'ETIMEDOUT',
  'UND_ERR_BODY_TIMEOUT',
  'UND_ERR_CONNECT_TIMEOUT',
  'UND_ERR_HEADERS_TIMEOUT',
  'UND_ERR_SOCKET'
])

function asRecord(value: unknown) {
  return typeof value === 'object' && value !== null ?
      (value as Record<string, unknown>)
    : undefined
}

function stringProperty(
  value: Record<string, unknown> | undefined,
  property: string
) {
  const candidate = value?.[property]
  return typeof candidate === 'string' ? candidate : undefined
}

function numericProperty(
  value: Record<string, unknown> | undefined,
  property: string
) {
  const candidate = value?.[property]
  return typeof candidate === 'number' ? candidate : undefined
}

function redactSnapchatSecrets(message: string) {
  const accessToken =
    process.env.SNAPCHAT_CONVERSIONS_API_ACCESS_TOKEN?.trim()

  return message
    .replace(
      /([?&]access_token=)[^&\s]+/gi,
      '$1[REDACTED_SECRET]'
    )
    .replaceAll(
      accessToken || '[NO_SNAPCHAT_TOKEN]',
      '[REDACTED_SECRET]'
    )
}

function isRetryableSnapchatError(error: unknown) {
  if (
    error instanceof SnapchatConversionsApiConfigError ||
    error instanceof SnapchatConversionsApiSkipError
  ) {
    return false
  }

  if (error instanceof SnapchatConversionsApiHttpError) {
    return (
      error.status === 408 ||
      error.status === 429 ||
      error.status >= 500
    )
  }

  const current = asRecord(error)
  const cause = asRecord(current?.cause)
  const networkCode =
    stringProperty(current, 'code') ??
    stringProperty(cause, 'code')
  const status = numericProperty(current, 'status')

  if (networkCode && RETRYABLE_NETWORK_CODES.has(networkCode)) {
    return true
  }

  if (
    stringProperty(current, 'name') === 'TypeError' &&
    /fetch failed/i.test(
      stringProperty(current, 'message') ?? ''
    )
  ) {
    return true
  }

  return (
    status === 408 ||
    status === 429 ||
    (status !== undefined && status >= 500)
  )
}

function summarizeSnapchatError(error: unknown) {
  if (
    error instanceof SnapchatConversionsApiConfigError ||
    error instanceof SnapchatConversionsApiSkipError
  ) {
    return redactSnapchatSecrets(error.message).slice(0, 1000)
  }

  if (error instanceof SnapchatConversionsApiHttpError) {
    return redactSnapchatSecrets(
      `${error.name}: HTTP ${error.status} ${error.message}`
    )
      .replaceAll(/\s+/g, ' ')
      .slice(0, 1000)
  }

  const current = asRecord(error)
  const name = stringProperty(current, 'name') ?? 'Error'
  const message =
    stringProperty(current, 'message') ??
    'Unknown Snapchat Conversions API error'

  return redactSnapchatSecrets(`${name}: ${message}`)
    .replaceAll(/\s+/g, ' ')
    .slice(0, 1000)
}

export function createSnapchatProviderAdapter<
  E extends CanonicalEvent
>(input: {
  eventName: E['event_name']
  key: ProviderAdapterKey
  schema: z.ZodType<E>
}): ProviderAdapter<E, SnapchatDispatchReceipt> {
  return {
    deadLetterReasons: {
      attemptsExhausted: 'snapchat_attempts_exhausted',
      invalidPayload: 'invalid_canonical_payload',
      permanentError: 'snapchat_permanent_error'
    },
    dispatch: async event => {
      const result =
        await dispatchCanonicalEventToSnapchat(event)

      if (result.status === 'disabled') {
        throw new SnapchatConversionsApiConfigError('disabled')
      }

      if (result.status === 'skipped') {
        throw new SnapchatConversionsApiSkipError(result.reason)
      }

      return {
        eventId: event.event_id,
        eventName: input.eventName,
        provider: 'snapchat',
        result
      }
    },
    eventName: input.eventName,
    isRetryable: isRetryableSnapchatError,
    key: input.key,
    projectReceipt: receipt => ({
      httpStatus: receipt.result.httpStatus,
      requestId: receipt.result.response.requestId ?? null,
      response: {
        acceptance: receipt.result.acceptance,
        response: receipt.result.response
      },
      validationResult: { acceptance: 'accepted_unverified' }
    }),
    provider: 'snapchat',
    retryPolicy: {
      delaysMs: [
        60_000,
        5 * 60_000,
        30 * 60_000,
        2 * 60 * 60_000
      ],
      maxAttempts: 5,
      positiveJitterRatio: 0
    },
    schema: input.schema,
    summarizeError: summarizeSnapchatError
  }
}
