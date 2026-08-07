import 'server-only'

import { z } from 'zod'

import { startAnalyticsSpan } from '@/lib/observability/tracing/startAnalyticsSpan'

import {
  classifyDunWaitlistShopifyFailure,
  failureReasonFromUnknown,
  type DunWaitlistShopifyFailureReason
} from './dunWaitlistShopifyFailureClassification'
import {
  DUN_WAITLIST_SHOPIFY_QUEUE_NAME,
  dunWaitlistShopifyQueueMessageSchema
} from './dunWaitlistShopifyQueueMessage'
import {
  executeDunWaitlistShopifyQueueQuery,
  type DunWaitlistShopifyQueueQueryExecutor
} from './dunWaitlistShopifyQueueDb'
import type { DunWaitlistShopifyQueueRecord } from './dunWaitlistShopifyQueueRecord'
import { isDunWaitlistShopifyLegacySatisfied } from './isDunWaitlistShopifyLegacySatisfied'
import {
  syncDunWaitlistCustomerToShopify,
  type DunWaitlistCustomer
} from './syncDunWaitlistCustomerToShopify'

export type ProcessDunWaitlistShopifyQueueMessageResult =
  | { status: 'already_satisfied' }
  | { status: 'succeeded'; customerId: string; leadId: string }
  | {
      status: 'failure'
      kind: 'transient' | 'permanent'
      reason: DunWaitlistShopifyFailureReason
      leadId?: string
      schemaVersion?: number
    }

export type ProcessDunWaitlistShopifyQueueMessageDependencies = {
  executeQuery: DunWaitlistShopifyQueueQueryExecutor
  isLegacySatisfied: (leadId: string) => Promise<boolean>
  syncCustomer: (
    input: DunWaitlistCustomer
  ) => Promise<{ customerId: string }>
}

const leadRowSchema = z.strictObject({
  email: z.string().nullable(),
  first_name: z.string().nullable(),
  phone: z.string().nullable()
})

const LOAD_LEAD_QUERY = `
  select
    email,
    first_name,
    phone
  from marketing.leads
  where id = $1::uuid
    and source = 'product_waitlist_utekos_dun'
  limit 1
`

const defaultDependencies: ProcessDunWaitlistShopifyQueueMessageDependencies =
  {
    executeQuery: executeDunWaitlistShopifyQueueQuery,
    isLegacySatisfied: isDunWaitlistShopifyLegacySatisfied,
    syncCustomer: syncDunWaitlistCustomerToShopify
  }

function permanentFailure(
  reason: DunWaitlistShopifyFailureReason,
  extras: { leadId?: string; schemaVersion?: number } = {}
): ProcessDunWaitlistShopifyQueueMessageResult {
  return {
    status: 'failure',
    kind: 'permanent',
    reason,
    ...extras
  }
}

export async function processDunWaitlistShopifyQueueMessage(
  record: DunWaitlistShopifyQueueRecord,
  dependencies: ProcessDunWaitlistShopifyQueueMessageDependencies =
    defaultDependencies
): Promise<ProcessDunWaitlistShopifyQueueMessageResult> {
  return startAnalyticsSpan(
    {
      name: 'dun-waitlist-shopify-queue-process',
      op: 'queue.process',
      attributes: {
        'messaging.system': 'postgres_pgmq',
        'messaging.destination.name': DUN_WAITLIST_SHOPIFY_QUEUE_NAME,
        'messaging.operation.type': 'process',
        'messaging.message.id': record.msg_id,
        'messaging.message.delivery_count': record.read_ct
      }
    },
    async () => {
      const payload = dunWaitlistShopifyQueueMessageSchema.safeParse(
        record.message
      )

      if (!payload.success) {
        return permanentFailure('invalid_queue_message')
      }

      const leadId = payload.data.lead_id
      const schemaVersion = payload.data.schema_version

      if (await dependencies.isLegacySatisfied(leadId)) {
        return { status: 'already_satisfied' }
      }

      const leadRows = await dependencies.executeQuery(
        LOAD_LEAD_QUERY,
        [leadId]
      )

      if (leadRows.length === 0) {
        return permanentFailure('lead_not_found', {
          leadId,
          schemaVersion
        })
      }

      const lead = leadRowSchema.safeParse(leadRows[0])

      if (
        !lead.success ||
        lead.data.email === null ||
        lead.data.email.trim() === ''
      ) {
        return permanentFailure('invalid_lead_record', {
          leadId,
          schemaVersion
        })
      }

      try {
        const synced = await dependencies.syncCustomer({
          email: lead.data.email,
          firstName: lead.data.first_name,
          phone: lead.data.phone
        })

        return {
          status: 'succeeded',
          customerId: synced.customerId,
          leadId
        }
      } catch (error: unknown) {
        const reason = failureReasonFromUnknown(error)
        const classification = classifyDunWaitlistShopifyFailure(reason)

        return {
          status: 'failure',
          kind: classification.kind,
          reason: classification.reason,
          leadId,
          schemaVersion
        }
      }
    }
  )
}
