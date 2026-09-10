import 'server-only'

import { z } from 'zod'

import { getPostgresClient } from '@/lib/db/getPostgresClient'
import {
  abandonedCheckoutRecoveryResendEventTypes,
  type AbandonedCheckoutRecoveryResendEventType
} from '@/lib/email/abandonedCheckoutRecovery/recordAbandonedCheckoutRecoveryResendEvent'

const inputSchema = z.strictObject({
  resendEventId: z.string().min(1).max(255),
  resendEmailId: z.string()
    .regex(/^[A-Za-z0-9][A-Za-z0-9_-]{0,254}$/u),
  eventType: z.enum(abandonedCheckoutRecoveryResendEventTypes),
  occurredAt: z.string().datetime({ offset: true }),
  receivedAt: z.date()
})

export async function recordShopifyTransactionalEmailResendEvent(
  input: {
    resendEventId: string
    resendEmailId: string
    eventType: AbandonedCheckoutRecoveryResendEventType
    occurredAt: string
    receivedAt?: Date
  }
): Promise<boolean> {
  const parsed = inputSchema.safeParse({
    ...input,
    receivedAt: input.receivedAt ?? new Date()
  })

  if (!parsed.success) {
    throw new Error(
      'shopify_transactional_email_resend_event_input_invalid'
    )
  }

  const sql = getPostgresClient()

  if (!sql) {
    throw new Error(
      'shopify_transactional_email_database_unavailable'
    )
  }

  const deliveries = await sql`
    select idempotency_key
    from ops.shopify_transactional_email_deliveries
    where resend_email_id = ${parsed.data.resendEmailId}
    limit 1
  `

  if (deliveries.length === 0) {
    return false
  }

  await sql`
    insert into ops.shopify_transactional_email_resend_events (
      resend_event_id,
      resend_email_id,
      idempotency_key,
      event_type,
      occurred_at,
      received_at
    ) values (
      ${parsed.data.resendEventId},
      ${parsed.data.resendEmailId},
      ${String(deliveries[0]?.idempotency_key)},
      ${parsed.data.eventType},
      ${parsed.data.occurredAt},
      ${parsed.data.receivedAt.toISOString()}
    )
    on conflict (resend_event_id) do nothing
  `

  await sql`
    update ops.shopify_transactional_email_deliveries
    set
      last_event_type = ${parsed.data.eventType},
      last_event_occurred_at = ${parsed.data.occurredAt}
    where resend_email_id = ${parsed.data.resendEmailId}
      and (
        last_event_occurred_at is null
        or last_event_occurred_at <= ${parsed.data.occurredAt}
      )
  `

  return true
}
