import type { CanonicalViewItem } from '../../viewItemEvent'
import { canonicalViewItemSchema } from '../../viewItemEvent'
import {
  dispatchCanonicalViewItemToMeta,
  type MetaViewItemDispatchReceipt
} from '../dispatchCanonicalViewItemToMeta'
import type { ProviderAdapter } from '../providerAdapter'

const RETRYABLE_META_CODES = new Set([
  1,
  2,
  4,
  17,
  32,
  341,
  613
])
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

function numericProperty(
  value: Record<string, unknown> | undefined,
  property: string
) {
  const candidate = value?.[property]
  return typeof candidate === 'number' ? candidate : undefined
}

function stringProperty(
  value: Record<string, unknown> | undefined,
  property: string
) {
  const candidate = value?.[property]
  return typeof candidate === 'string' ? candidate : undefined
}

function isRetryableMetaError(error: unknown) {
  const current = asRecord(error)
  const response = asRecord(current?.response)
  const cause = asRecord(current?.cause)
  const status = numericProperty(current, 'status')
  const metaCode = numericProperty(response, 'code')
  const networkCode =
    stringProperty(current, 'code') ??
    stringProperty(cause, 'code')

  if (response?.is_transient === true) return true
  if (metaCode && RETRYABLE_META_CODES.has(metaCode)) return true
  if (networkCode && RETRYABLE_NETWORK_CODES.has(networkCode)) {
    return true
  }

  if (
    status === 408 ||
    status === 409 ||
    status === 425 ||
    status === 429 ||
    (status !== undefined && status >= 500)
  ) {
    return true
  }

  return (
    current?.name === 'FacebookRequestError' &&
    status === undefined
  )
}

function summarizeMetaError(error: unknown) {
  const current = asRecord(error)
  const name = stringProperty(current, 'name') ?? 'Error'
  const message =
    stringProperty(current, 'message') ?? 'Unknown Meta error'

  return `${name}: ${message}`
    .replaceAll(/\s+/g, ' ')
    .slice(0, 1000)
}

export const metaViewItemProviderAdapter: ProviderAdapter<
  CanonicalViewItem,
  MetaViewItemDispatchReceipt
> = {
  deadLetterReasons: {
    attemptsExhausted: 'meta_attempts_exhausted',
    invalidPayload: 'invalid_canonical_payload',
    permanentError: 'meta_permanent_error'
  },
  dispatch: dispatchCanonicalViewItemToMeta,
  eventName: 'view_item',
  isRetryable: isRetryableMetaError,
  key: 'meta:view_item',
  projectReceipt: receipt => ({
    httpStatus: receipt.result.httpStatus ?? null,
    requestId: receipt.result.fbTraceId ?? null,
    response: receipt.result,
    validationResult: {
      events_received: receipt.result.eventsReceived,
      ...(receipt.result.processedEntries === undefined ?
        {}
      : { processed_entries: receipt.result.processedEntries })
    }
  }),
  provider: 'meta',
  retryPolicy: {
    delaysMs: [60_000, 5 * 60_000, 30 * 60_000, 2 * 60 * 60_000],
    maxAttempts: 5,
    positiveJitterRatio: 0
  },
  schema: canonicalViewItemSchema,
  summarizeError: summarizeMetaError
}
