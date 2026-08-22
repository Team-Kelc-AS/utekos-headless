import 'server-only'

import { z } from 'zod'

import type { Database } from '@/types/supabase/database.types'

export const abandonedCheckoutRecoveryResendEventTypes = [
  'email.sent',
  'email.delivered',
  'email.delivery_delayed',
  'email.bounced',
  'email.complained',
  'email.failed',
  'email.suppressed'
] as const

export type AbandonedCheckoutRecoveryResendEventType =
  typeof abandonedCheckoutRecoveryResendEventTypes[number]

type RpcArgs = {
  p_resend_event_id: string
  p_resend_email_id: string
  p_event_type: AbandonedCheckoutRecoveryResendEventType
  p_occurred_at: string
  p_received_at: string
}

type RecoveryResendEventDatabase =
  Omit<Database, 'ops'> & {
    ops: Omit<Database['ops'], 'Functions'> & {
      Functions: Database['ops']['Functions'] & {
        record_abandoned_checkout_recovery_resend_event: {
          Args: RpcArgs
          Returns: boolean
        }
      }
    }
  }

const inputSchema = z.strictObject({
  resendEventId: z.string().min(1).max(255),
  resendEmailId: z.string()
    .regex(/^[A-Za-z0-9][A-Za-z0-9_-]{0,254}$/),
  eventType: z.enum(abandonedCheckoutRecoveryResendEventTypes),
  occurredAt: z.string().datetime({ offset: true }),
  receivedAt: z.date()
})

type Dependencies = {
  executeRpc?: (args: RpcArgs) => Promise<{
    data: unknown
    error: { message?: string } | null
  }>
}

async function executeDefaultRpc(args: RpcArgs) {
  const { createSupabaseAdminClient } =
    await import('@/lib/supabase/server')
  const client =
    createSupabaseAdminClient<RecoveryResendEventDatabase>()
  const { data, error } = await client
    .schema('ops')
    .rpc(
      'record_abandoned_checkout_recovery_resend_event',
      args
    )

  return { data, error }
}

export async function recordAbandonedCheckoutRecoveryResendEvent(
  input: {
    resendEventId: string
    resendEmailId: string
    eventType: AbandonedCheckoutRecoveryResendEventType
    occurredAt: string
    receivedAt?: Date
  },
  dependencies: Dependencies = {}
): Promise<boolean> {
  const parsed = inputSchema.safeParse({
    ...input,
    receivedAt: input.receivedAt ?? new Date()
  })

  if (!parsed.success) {
    throw new Error(
      'abandoned_checkout_recovery_resend_event_input_invalid'
    )
  }

  const executeRpc = dependencies.executeRpc ?? executeDefaultRpc
  const result = await executeRpc({
    p_resend_event_id: parsed.data.resendEventId,
    p_resend_email_id: parsed.data.resendEmailId,
    p_event_type: parsed.data.eventType,
    p_occurred_at: parsed.data.occurredAt,
    p_received_at: parsed.data.receivedAt.toISOString()
  })

  if (result.error || typeof result.data !== 'boolean') {
    throw new Error(
      'abandoned_checkout_recovery_resend_event_persist_failed'
    )
  }

  return result.data
}
