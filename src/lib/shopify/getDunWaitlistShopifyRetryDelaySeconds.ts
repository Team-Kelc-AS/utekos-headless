import { z } from 'zod'

const readCtSchema = z.number().int().positive()

const MAX_RETRY_DELAY_SECONDS = 60 * 60

/**
 * Exponential backoff in seconds for PGMQ `set_vt`.
 * Mirrors legacy `retryDelayMinutes(attempt) = min(60, 5 * 2**(attempt-1))`.
 */
export function getDunWaitlistShopifyRetryDelaySeconds(
  readCt: number
): number {
  const attempt = readCtSchema.parse(readCt)

  const delayMinutes = Math.min(60, 5 * 2 ** Math.max(0, attempt - 1))

  return Math.min(MAX_RETRY_DELAY_SECONDS, delayMinutes * 60)
}
