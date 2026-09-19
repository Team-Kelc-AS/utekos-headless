import type * as z from 'zod/v4/core'
import type { CanonicalEvent } from '../canonicalEvent'
import type {
  ProviderAdapter,
  ProviderAdapterKey
} from './providerAdapter'
import type { GoogleDataManagerSendResult } from './sendGoogleDataManagerEvent'

const RETRYABLE_GRPC_CODES = new Set([1, 4, 8, 10, 13, 14, 16])
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

function serializeGoogleErrorDetails(
  error: Record<string, unknown> | undefined
) {
  const reason = stringProperty(error, 'reason')
  const domain = stringProperty(error, 'domain')
  const errorInfoMetadata = asRecord(error?.errorInfoMetadata)
  const statusDetails = error?.statusDetails

  if (
    !reason &&
    !domain &&
    !errorInfoMetadata &&
    statusDetails === undefined
  ) {
    return ''
  }

  try {
    return ` details=${JSON.stringify({
      ...(reason ? { reason } : {}),
      ...(domain ? { domain } : {}),
      ...(errorInfoMetadata ? { errorInfoMetadata } : {}),
      ...(statusDetails === undefined ? {} : { statusDetails })
    })}`
  } catch {
    return ''
  }
}

function isRetryableGoogleError(error: unknown) {
  const current = asRecord(error)
  const cause = asRecord(current?.cause)
  const code = current?.code
  const networkCode =
    stringProperty(current, 'code') ??
    stringProperty(cause, 'code')
  const message = stringProperty(current, 'message') ?? ''

  if (
    typeof code === 'number' &&
    RETRYABLE_GRPC_CODES.has(code)
  ) {
    return true
  }
  if (networkCode && RETRYABLE_NETWORK_CODES.has(networkCode)) {
    return true
  }

  return (
    message.startsWith(
      'Missing required Google Data Manager auth configuration:'
    ) ||
    message.startsWith(
      'Missing required Google Data Manager configuration:'
    )
  )
}

function summarizeGoogleError(error: unknown) {
  const current = asRecord(error)
  const name = stringProperty(current, 'name') ?? 'Error'
  const message =
    stringProperty(current, 'message') ??
    'Unknown Google Data Manager error'
  const details = serializeGoogleErrorDetails(current)

  return `${name}: ${message}${details}`
    .replaceAll(/\s+/g, ' ')
    .slice(0, 1000)
}

type GoogleDispatchReceipt = {
  eventId: string
  eventName: string
  provider: 'google_data_manager'
  result: GoogleDataManagerSendResult
}

export function createGoogleDataManagerProviderAdapter<
  E extends CanonicalEvent,
  R extends GoogleDispatchReceipt
>(input: {
  dispatch: (event: E) => Promise<R>
  eventName: E['event_name']
  key: ProviderAdapterKey
  schema: z.$ZodType<E>
}): ProviderAdapter<E, R> {
  return {
    deadLetterReasons: {
      attemptsExhausted:
        'google_data_manager_attempts_exhausted',
      invalidPayload: 'invalid_canonical_payload',
      permanentError: 'google_data_manager_permanent_error'
    },
    dispatch: input.dispatch,
    eventName: input.eventName,
    isRetryable: isRetryableGoogleError,
    key: input.key,
    projectReceipt: receipt => ({
      requestId: receipt.result.requestId ?? null,
      response: receipt.result,
      validationResult: {
        validate_only: receipt.result.validateOnly,
        validated: true
      }
    }),
    provider: 'google',
    retryPolicy: {
      delaysMs: [
        60_000,
        5 * 60_000,
        30 * 60_000,
        2 * 60 * 60_000
      ],
      maxAttempts: 5,
      positiveJitterRatio: 0.2
    },
    schema: input.schema,
    summarizeError: summarizeGoogleError
  }
}
