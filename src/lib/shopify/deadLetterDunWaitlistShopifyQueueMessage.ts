import 'server-only'

import { z } from 'zod'

import { startAnalyticsSpan } from '@/lib/observability/tracing/startAnalyticsSpan'

import {
  DUN_WAITLIST_SHOPIFY_ATTEMPTS_EXHAUSTED_REASON,
  DUN_WAITLIST_SHOPIFY_PGMQ_DEAD_LETTER_SOURCE,
  dunWaitlistShopifyFailureReasonSchema,
  type DunWaitlistShopifyFailureReason
} from './dunWaitlistShopifyFailureClassification'
import { DUN_WAITLIST_SHOPIFY_QUEUE_NAME } from './dunWaitlistShopifyQueueMessage'
import {
  withDunWaitlistShopifyQueueTransaction,
  type DunWaitlistShopifyQueueTransactionRunner
} from './dunWaitlistShopifyQueueDb'
import { toPgmqMsgIdSqlParameter } from './dunWaitlistShopifyQueueRecord'

export type DeadLetterDunWaitlistShopifyQueueMessageInput = {
  msgId: string
  readCt: number
  failureKind: 'transient' | 'permanent'
  reason: DunWaitlistShopifyFailureReason | typeof DUN_WAITLIST_SHOPIFY_ATTEMPTS_EXHAUSTED_REASON
  leadId?: string
  schemaVersion?: number
  lastFailureReason?: DunWaitlistShopifyFailureReason
}

export type DeadLetterDunWaitlistShopifyQueueMessageResult = {
  alreadyExisted: boolean
  archived: boolean
  deadLettered: boolean
}

export type DeadLetterDunWaitlistShopifyQueueMessageDependencies = {
  runTransaction: DunWaitlistShopifyQueueTransactionRunner
}

const defaultDependencies: DeadLetterDunWaitlistShopifyQueueMessageDependencies =
  {
    runTransaction: withDunWaitlistShopifyQueueTransaction
  }

const leadIdSchema = z.string().uuid()

const TERMINAL_QUERY = `
  with existing as (
    select id
    from ops.dead_letter_events
    where source = $1::text
      and payload ->> 'pgmq_message_id' = $2::text
    limit 1
  ),
  inserted as (
    insert into ops.dead_letter_events (
      source,
      reason,
      payload,
      metadata
    )
    select
      $1::text,
      $3::text,
      $4::jsonb,
      $5::jsonb
    where not exists (select 1 from existing)
    returning id
  ),
  archived as (
    select pgmq.archive(
      $6::text,
      $7::bigint
    ) as archived
  )
  select
    coalesce(
      (select id::text from inserted),
      (select id::text from existing)
    ) as dead_letter_id,
    exists(select 1 from existing) as already_existed,
    exists(select 1 from inserted) as inserted,
    (select archived from archived) as archived
`

export async function deadLetterDunWaitlistShopifyQueueMessage(
  input: DeadLetterDunWaitlistShopifyQueueMessageInput,
  dependencies: DeadLetterDunWaitlistShopifyQueueMessageDependencies =
    defaultDependencies
): Promise<DeadLetterDunWaitlistShopifyQueueMessageResult> {
  const sqlMsgId = toPgmqMsgIdSqlParameter(input.msgId)

  const reason =
    input.reason === DUN_WAITLIST_SHOPIFY_ATTEMPTS_EXHAUSTED_REASON ?
      input.reason
    : dunWaitlistShopifyFailureReasonSchema.parse(input.reason)

  const payload: Record<string, string> = {
    pgmq_message_id: sqlMsgId
  }

  if (input.leadId !== undefined) {
    payload.lead_id = leadIdSchema.parse(input.leadId)
  }

  const metadata: Record<string, string | number> = {
    queue_name: DUN_WAITLIST_SHOPIFY_QUEUE_NAME,
    read_ct: input.readCt,
    failure_kind: input.failureKind
  }

  if (input.schemaVersion !== undefined) {
    metadata.schema_version = input.schemaVersion
  }

  if (input.lastFailureReason !== undefined) {
    metadata.last_failure_reason =
      dunWaitlistShopifyFailureReasonSchema.parse(input.lastFailureReason)
  }

  return startAnalyticsSpan(
    {
      name: 'dun-waitlist-shopify-queue-dead-letter',
      op: 'queue.dead_letter',
      attributes: {
        'messaging.system': 'postgres_pgmq',
        'messaging.destination.name': DUN_WAITLIST_SHOPIFY_QUEUE_NAME,
        'messaging.operation.type': 'dead_letter',
        'messaging.message.id': sqlMsgId,
        'messaging.message.delivery_count': input.readCt,
        'failure.kind': input.failureKind,
        'failure.reason': reason
      }
    },
    async () => {
      const rows = await dependencies.runTransaction(async transaction => {
        return transaction.executeQuery<{
          already_existed: boolean
          archived: boolean
          dead_letter_id: string | null
          inserted: boolean
        }>(TERMINAL_QUERY, [
          DUN_WAITLIST_SHOPIFY_PGMQ_DEAD_LETTER_SOURCE,
          sqlMsgId,
          reason,
          JSON.stringify(payload),
          JSON.stringify(metadata),
          DUN_WAITLIST_SHOPIFY_QUEUE_NAME,
          sqlMsgId
        ])
      })

      const row = rows[0]

      if (!row || row.dead_letter_id === null) {
        throw new Error('dead_letter_terminal_state_conflict')
      }

      return {
        alreadyExisted: row.already_existed === true,
        archived: row.archived === true,
        deadLettered: row.inserted === true || row.already_existed === true
      }
    }
  )
}
