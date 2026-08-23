import 'server-only'

import { getPostgresClient } from '@/lib/db/getPostgresClient'

export async function purgeExpiredShopifyCheckoutRecoveryEvidence(
  now = new Date()
): Promise<number> {
  if (!Number.isFinite(now.getTime())) {
    throw new Error(
      'shopify_checkout_recovery_evidence_purge_input_invalid'
    )
  }

  const sql = getPostgresClient()

  if (!sql) {
    throw new Error('Missing tracking database connection string')
  }

  const rows = await sql`
    select ops.purge_expired_shopify_checkout_recovery_evidence(
      ${now.toISOString()}
    ) as deleted
  `
  const deleted = rows[0]?.deleted

  if (
    typeof deleted !== 'number'
    || !Number.isInteger(deleted)
    || deleted < 0
  ) {
    throw new Error(
      'shopify_checkout_recovery_evidence_purge_failed'
    )
  }

  return deleted
}
