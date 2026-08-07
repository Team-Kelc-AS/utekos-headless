import { z } from 'zod'

export const dunWaitlistSyncBackendSchema = z.enum(['legacy', 'pgmq'])

export type DunWaitlistSyncBackend = z.infer<
  typeof dunWaitlistSyncBackendSchema
>

export const DUN_WAITLIST_SYNC_BACKEND_ENV =
  'DUN_WAITLIST_SYNC_BACKEND' as const

/**
 * Fail-closed backend selector for Dun waitlist → Shopify sync.
 * Missing or invalid values throw — never silently pick a backend.
 */
export function getDunWaitlistSyncBackend(
  env: Record<string, string | undefined> = process.env
): DunWaitlistSyncBackend {
  const raw = env[DUN_WAITLIST_SYNC_BACKEND_ENV]
  const parsed = dunWaitlistSyncBackendSchema.safeParse(raw)

  if (!parsed.success) {
    throw new Error(
      `${DUN_WAITLIST_SYNC_BACKEND_ENV} must be exactly "legacy" or "pgmq"`
    )
  }

  return parsed.data
}
