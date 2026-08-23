import type { z } from 'zod'
import type { CanonicalEvent } from '../canonicalEvent'
import { dispatchCanonicalEventToPinterest } from './dispatchCanonicalEventToPinterest'
import type {
  ProviderAdapter,
  ProviderAdapterKey
} from './providerAdapter'
import {
  PinterestConversionsApiConfigError,
  PinterestConversionsApiHttpError,
  PinterestConversionsApiSkipError,
  type PinterestSendResult
} from './sendPinterestServerEvent'

export type PinterestDispatchReceipt = {
  eventId: string
  eventName: string
  provider: 'pinterest'
  result: Extract<PinterestSendResult, { status: 'sent' }>
}

const RETRYABLE_NETWORK_CODES = new Set([
  'ECONNRESET',
  'ECONNREFUSED',
  'EAI_AGAIN',
  'ENETUNREACH',
  'ETIMEDOUT'
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

function isRetryablePinterestError(error: unknown) {
  if (error instanceof PinterestConversionsApiConfigError) {
    return false
  }

  if (error instanceof PinterestConversionsApiSkipError) {
    return false
  }

  if (error instanceof PinterestConversionsApiHttpError) {
    return (
      error.status === 408 ||
      error.status === 409 ||
      error.status === 425 ||
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

  return (
    status === 408 ||
    status === 409 ||
    status === 425 ||
    status === 429 ||
    (status !== undefined && status >= 500)
  )
}

function summarizePinterestError(error: unknown) {
  if (error instanceof PinterestConversionsApiConfigError) {
    return error.message.slice(0, 1000)
  }

  if (error instanceof PinterestConversionsApiSkipError) {
    return error.message.slice(0, 1000)
  }

  if (error instanceof PinterestConversionsApiHttpError) {
    return `${error.name}: HTTP ${error.status} ${error.message}`
      .replaceAll(/\s+/g, ' ')
      .slice(0, 1000)
  }

  const current = asRecord(error)
  const name = stringProperty(current, 'name') ?? 'Error'
  const message =
    stringProperty(current, 'message') ??
    'Unknown Pinterest Conversions API error'

  return `${name}: ${message}`.replaceAll(/\s+/g, ' ').slice(0, 1000)
}

export function createPinterestProviderAdapter<
  E extends CanonicalEvent
>(input: {
  eventName: E['event_name']
  key: ProviderAdapterKey
  schema: z.ZodType<E>
}): ProviderAdapter<E, PinterestDispatchReceipt> {
  return {
    deadLetterReasons: {
      attemptsExhausted: 'pinterest_attempts_exhausted',
      invalidPayload: 'invalid_canonical_payload',
      permanentError: 'pinterest_permanent_error'
    },
    dispatch: async event => {
      const result = await dispatchCanonicalEventToPinterest(event)

      if (result.status === 'disabled') {
        throw new PinterestConversionsApiConfigError('disabled')
      }

      if (result.status === 'skipped') {
        throw new PinterestConversionsApiSkipError(result.reason)
      }

      return {
        eventId: event.event_id,
        eventName: input.eventName,
        provider: 'pinterest',
        result
      }
    },
    eventName: input.eventName,
    isRetryable: isRetryablePinterestError,
    key: input.key,
    projectReceipt: receipt => ({
      httpStatus: receipt.result.httpStatus,
      requestId: null,
      response: receipt.result,
      validationResult: {
        events_processed:
          receipt.result.response.num_events_processed ?? null,
        events_received:
          receipt.result.response.num_events_received ?? null
      }
    }),
    provider: 'pinterest',
    retryPolicy: {
      delaysMs: [60_000, 5 * 60_000, 30 * 60_000, 2 * 60 * 60_000],
      maxAttempts: 5,
      positiveJitterRatio: 0
    },
    schema: input.schema,
    summarizeError: summarizePinterestError
  }
}
