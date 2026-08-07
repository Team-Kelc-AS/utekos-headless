import { z } from 'zod'

import {
  DUN_WAITLIST_SHOPIFY_ATTEMPTS_EXHAUSTED_REASON,
  DUN_WAITLIST_SHOPIFY_MAX_ATTEMPTS,
  DUN_WAITLIST_SHOPIFY_PGMQ_DEAD_LETTER_SOURCE
} from './dunWaitlistShopifyQueueConfig'

export {
  DUN_WAITLIST_SHOPIFY_ATTEMPTS_EXHAUSTED_REASON,
  DUN_WAITLIST_SHOPIFY_MAX_ATTEMPTS,
  DUN_WAITLIST_SHOPIFY_PGMQ_DEAD_LETTER_SOURCE
}

export const dunWaitlistShopifyProviderFailureReasonSchema = z.enum([
  'invalid_waitlist_customer',
  'shopify_customer_lookup_failed',
  'shopify_customer_lookup_invalid_response',
  'shopify_customer_create_failed',
  'shopify_customer_create_invalid_response',
  'shopify_customer_create_rejected',
  'shopify_tags_add_failed',
  'shopify_tags_add_invalid_response',
  'shopify_tags_add_rejected'
])

export const dunWaitlistShopifyQueueFailureReasonSchema = z.enum([
  'invalid_queue_message',
  'lead_not_found',
  'invalid_lead_record',
  'unexpected_error'
])

export const dunWaitlistShopifyFailureReasonSchema = z.union([
  dunWaitlistShopifyProviderFailureReasonSchema,
  dunWaitlistShopifyQueueFailureReasonSchema
])

export type DunWaitlistShopifyFailureReason = z.infer<
  typeof dunWaitlistShopifyFailureReasonSchema
>

export type DunWaitlistShopifyFailureClassification =
  | {
      kind: 'transient'
      reason: DunWaitlistShopifyFailureReason
    }
  | {
      kind: 'permanent'
      reason: DunWaitlistShopifyFailureReason
    }

export const DUN_WAITLIST_SHOPIFY_PERMANENT_FAILURE_REASONS =
  new Set<DunWaitlistShopifyFailureReason>([
    'invalid_waitlist_customer',
    'shopify_customer_lookup_invalid_response',
    'shopify_customer_create_invalid_response',
    'shopify_customer_create_rejected',
    'shopify_tags_add_invalid_response',
    'shopify_tags_add_rejected',
    'invalid_queue_message',
    'lead_not_found',
    'invalid_lead_record'
  ])

export const DUN_WAITLIST_SHOPIFY_LEGACY_PERMANENT_PROVIDER_REASONS =
  new Set<string>([
    'invalid_waitlist_customer',
    'shopify_customer_lookup_invalid_response',
    'shopify_customer_create_invalid_response',
    'shopify_customer_create_rejected',
    'shopify_tags_add_invalid_response',
    'shopify_tags_add_rejected'
  ])

export function classifyDunWaitlistShopifyFailure(
  reason: string
): DunWaitlistShopifyFailureClassification {
  const parsed = dunWaitlistShopifyFailureReasonSchema.safeParse(reason)

  if (!parsed.success) {
    return {
      kind: 'transient',
      reason: 'unexpected_error'
    }
  }

  if (DUN_WAITLIST_SHOPIFY_PERMANENT_FAILURE_REASONS.has(parsed.data)) {
    return {
      kind: 'permanent',
      reason: parsed.data
    }
  }

  return {
    kind: 'transient',
    reason: parsed.data
  }
}

export function failureReasonFromUnknown(
  error: unknown
): DunWaitlistShopifyFailureReason {
  const message = error instanceof Error ? error.message : ''
  return classifyDunWaitlistShopifyFailure(message).reason
}
