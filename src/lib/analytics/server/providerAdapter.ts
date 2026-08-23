import type { ZodType } from 'zod'
import type {
  CanonicalEvent,
  ImplementedCanonicalEventName
} from '../canonicalEvent'

export type ProviderId =
  | 'google'
  | 'meta'
  | 'microsoft_uet'
  | 'pinterest'
  | 'snapchat'

export type ProviderAdapterKey =
  `${ProviderId}:${ImplementedCanonicalEventName}`

export type ProviderReceiptProjection = {
  httpStatus?: number | null
  requestId: string | null
  response: unknown
  validationResult: unknown
}

export type ProviderRetryPolicy = {
  delaysMs: readonly number[]
  maxAttempts: number
  positiveJitterRatio: number
}

export type ProviderAdapter<E extends CanonicalEvent, R> = {
  claimNotBefore?: string
  deadLetterReasons: {
    attemptsExhausted: string
    invalidPayload: string
    permanentError: string
  }
  dispatch: (event: E) => Promise<R>
  eventName: E['event_name']
  isRetryable: (error: unknown) => boolean
  key: ProviderAdapterKey
  projectReceipt: (receipt: R) => ProviderReceiptProjection
  provider: ProviderId
  retryPolicy: ProviderRetryPolicy
  schema: ZodType<E>
  summarizeError: (error: unknown) => string
}
