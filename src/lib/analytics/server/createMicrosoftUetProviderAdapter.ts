import type { z } from 'zod'
import type { CanonicalEvent } from '../canonicalEvent'
import type {
  ProviderAdapter,
  ProviderAdapterKey
} from './providerAdapter'
import {
  MicrosoftUetCapiConfigError,
  MicrosoftUetCapiHttpError
} from './sendMicrosoftUetCapiPurchase'

type MicrosoftUetCapiDispatchReceipt = {
  eventId: string
  eventName: string
  provider: 'microsoft_uet'
  result: {
    eventId: string
    eventName: string
    eventsReceived: number | null
    requestId: string | null
    responseCode: string | null
    responseMessage: string | null
    status: number
    tagId: string
    validationErrors: ReadonlyArray<unknown>
    validationWarnings: ReadonlyArray<unknown>
  }
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

function isRetryableMicrosoftUetError(error: unknown) {
  if (error instanceof MicrosoftUetCapiConfigError) {
    return false
  }

  if (error instanceof MicrosoftUetCapiHttpError) {
    return (
      error.status === 408
      || error.status === 409
      || error.status === 425
      || error.status === 429
      || error.status >= 500
    )
  }

  const current = asRecord(error)
  const cause = asRecord(current?.cause)
  const networkCode =
    stringProperty(current, 'code') ?? stringProperty(cause, 'code')
  const status = numericProperty(current, 'status')

  if (networkCode && RETRYABLE_NETWORK_CODES.has(networkCode)) {
    return true
  }

  return (
    status === 408
    || status === 409
    || status === 425
    || status === 429
    || (status !== undefined && status >= 500)
  )
}

function summarizeMicrosoftUetError(error: unknown) {
  if (error instanceof MicrosoftUetCapiConfigError) {
    return error.message.slice(0, 1000)
  }

  if (error instanceof MicrosoftUetCapiHttpError) {
    return `${error.name}: HTTP ${error.status} ${error.message}`
      .replaceAll(/\s+/g, ' ')
      .slice(0, 1000)
  }

  const current = asRecord(error)
  const name = stringProperty(current, 'name') ?? 'Error'
  const message =
    stringProperty(current, 'message')
    ?? 'Unknown Microsoft UET CAPI error'

  return `${name}: ${message}`.replaceAll(/\s+/g, ' ').slice(0, 1000)
}

export function createMicrosoftUetProviderAdapter<
  E extends CanonicalEvent,
  R extends MicrosoftUetCapiDispatchReceipt
>(input: {
  dispatch: (event: E) => Promise<R>
  eventName: E['event_name']
  key: ProviderAdapterKey
  schema: z.ZodType<E>
}): ProviderAdapter<E, R> {
  return {
    deadLetterReasons: {
      attemptsExhausted: 'microsoft_uet_attempts_exhausted',
      invalidPayload: 'invalid_canonical_payload',
      permanentError: 'microsoft_uet_permanent_error'
    },
    dispatch: input.dispatch,
    eventName: input.eventName,
    isRetryable: isRetryableMicrosoftUetError,
    key: input.key,
    projectReceipt: receipt => ({
      httpStatus: receipt.result.status,
      requestId: receipt.result.requestId,
      response: receipt.result,
      validationResult: {
        events_received: receipt.result.eventsReceived,
        http_status: receipt.result.status,
        tag_id: receipt.result.tagId,
        validation_error_count:
          receipt.result.validationErrors.length,
        validation_warning_count:
          receipt.result.validationWarnings.length
      }
    }),
    provider: 'microsoft_uet',
    retryPolicy: {
      delaysMs: [60_000, 5 * 60_000, 30 * 60_000, 2 * 60 * 60_000],
      maxAttempts: 5,
      positiveJitterRatio: 0
    },
    schema: input.schema,
    summarizeError: summarizeMicrosoftUetError
  }
}
