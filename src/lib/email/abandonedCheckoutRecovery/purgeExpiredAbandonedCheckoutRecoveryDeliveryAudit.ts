import 'server-only'

import type { Database } from '@/types/supabase/database.types'

type RpcArgs = {
  p_now: string
}

type PurgeAuditDatabase = Omit<Database, 'ops'> & {
  ops: Omit<Database['ops'], 'Functions'> & {
    Functions: Database['ops']['Functions'] & {
      purge_expired_abandoned_checkout_recovery_delivery_audit: {
        Args: RpcArgs
        Returns: number
      }
    }
  }
}

export async function purgeExpiredAbandonedCheckoutRecoveryDeliveryAudit(
  now = new Date()
): Promise<number> {
  if (!Number.isFinite(now.getTime())) {
    throw new Error(
      'abandoned_checkout_recovery_audit_purge_input_invalid'
    )
  }

  const { createSupabaseAdminClient } =
    await import('@/lib/supabase/server')
  const client = createSupabaseAdminClient<PurgeAuditDatabase>()
  const { data, error } = await client
    .schema('ops')
    .rpc(
      'purge_expired_abandoned_checkout_recovery_delivery_audit',
      { p_now: now.toISOString() }
    )

  if (error || !Number.isInteger(data) || data < 0) {
    throw new Error(
      'abandoned_checkout_recovery_audit_purge_failed'
    )
  }

  return data
}
