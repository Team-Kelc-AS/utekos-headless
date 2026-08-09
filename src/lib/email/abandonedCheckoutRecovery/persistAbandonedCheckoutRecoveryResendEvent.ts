import 'server-only'

import type { WebhookEventPayload } from 'resend'
import { z } from 'zod'

import { createSupabaseAdminClient } from '@/lib/supabase/server'
import type { Database } from '@/types/supabase/database.types'

const SupportedEventTypeSchema = z.enum([
  'email.sent',
  'email.delivered',
  'email.delivery_delayed',
  'email.bounced',
  'email.complained',
  'email.failed',
  'email.suppressed'
])

const TaggedEventSchema = z.object({
  type: SupportedEventTypeSchema,
  created_at: z.string().datetime({ offset: true }),
  data: z.object({
    email_id: z
      .string()
      .regex(/^[A-Za-z0-9][A-Za-z0-9_-]{0,254}$/),
    tags: z.record(z.string(), z.string()).optional()
  })
})

type ResendEventRow = {
  id: string
  resend_event_id: string
  resend_email_id: string
  dispatch_id: string
  event_type: string
  occurred_at: string
  received_at: string
}

type RecoveryEventDatabase = Omit<Database, 'ops'> & {
  ops: Omit<Database['ops'], 'Tables'> & {
    Tables: Database['ops']['Tables'] & {
      abandoned_checkout_recovery_resend_events: {
        Row: ResendEventRow
        Insert: Omit<ResendEventRow, 'id' | 'received_at'> & {
          id?: string
          received_at?: string
        }
        Update: never
        Relationships: []
      }
    }
  }
}

export async function persistAbandonedCheckoutRecoveryResendEvent(input: {
  resendEventId: string
  event: WebhookEventPayload
}): Promise<'ignored' | 'persisted'> {
  const parsed = TaggedEventSchema.safeParse(input.event)

  if (!parsed.success) {
    return 'ignored'
  }

  const tags = parsed.data.data.tags
  const dispatchId = z.string().uuid().safeParse(tags?.dispatch_id)

  if (
    tags?.category !== 'abandoned_checkout_recovery' ||
    !dispatchId.success
  ) {
    return 'ignored'
  }

  const client = createSupabaseAdminClient<RecoveryEventDatabase>()
  const { error } = await client
    .schema('ops')
    .from('abandoned_checkout_recovery_resend_events')
    .upsert(
      {
        resend_event_id: input.resendEventId,
        resend_email_id: parsed.data.data.email_id,
        dispatch_id: dispatchId.data,
        event_type: parsed.data.type,
        occurred_at: parsed.data.created_at
      },
      { onConflict: 'resend_event_id', ignoreDuplicates: true }
    )

  if (error) {
    throw new Error('abandoned_checkout_recovery_resend_event_persist_failed')
  }

  return 'persisted'
}
