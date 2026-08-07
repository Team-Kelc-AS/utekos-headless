/**
 * Canonical Dun waitlist → Shopify PGMQ queue constants.
 * Domain-specific only — not a general queue framework.
 * Keep this module free of `server-only` so unit tests can import it.
 */

export const DUN_WAITLIST_SHOPIFY_QUEUE_NAME =
  'shopify_dun_waitlist_sync' as const

export const DUN_WAITLIST_SHOPIFY_QUEUE_VISIBILITY_TIMEOUT_SECONDS =
  120 as const

export const DUN_WAITLIST_SHOPIFY_MAX_ATTEMPTS = 5 as const

export const DUN_WAITLIST_SHOPIFY_PGMQ_DEAD_LETTER_SOURCE =
  'shopify_dun_waitlist_pgmq' as const

export const DUN_WAITLIST_SHOPIFY_ATTEMPTS_EXHAUSTED_REASON =
  'shopify_dun_waitlist_attempts_exhausted' as const

/** Oldest visible (vt <= now) age before warning. */
export const DUN_WAITLIST_SHOPIFY_QUEUE_VISIBLE_AGE_WARNING_SECONDS =
  15 * 60

/** Oldest visible age before critical. */
export const DUN_WAITLIST_SHOPIFY_QUEUE_VISIBLE_AGE_CRITICAL_SECONDS =
  30 * 60

/** PGMQ archive retention for this queue (days). */
export const DUN_WAITLIST_SHOPIFY_QUEUE_ARCHIVE_RETENTION_DAYS = 30 as const

export type DunWaitlistShopifyQueueHealthLevel =
  | 'healthy'
  | 'warning'
  | 'critical'

export function classifyDunWaitlistShopifyQueueHealthLevel(
  oldestVisibleAgeSec: number | null
): DunWaitlistShopifyQueueHealthLevel {
  if (oldestVisibleAgeSec === null) {
    return 'healthy'
  }

  if (
    oldestVisibleAgeSec >=
    DUN_WAITLIST_SHOPIFY_QUEUE_VISIBLE_AGE_CRITICAL_SECONDS
  ) {
    return 'critical'
  }

  if (
    oldestVisibleAgeSec >=
    DUN_WAITLIST_SHOPIFY_QUEUE_VISIBLE_AGE_WARNING_SECONDS
  ) {
    return 'warning'
  }

  return 'healthy'
}
