import 'server-only'

import { z } from 'zod'

import { archiveDunWaitlistShopifyQueueMessage } from './archiveDunWaitlistShopifyQueueMessage'
import { deadLetterDunWaitlistShopifyQueueMessage } from './deadLetterDunWaitlistShopifyQueueMessage'
import {
  DUN_WAITLIST_SHOPIFY_ATTEMPTS_EXHAUSTED_REASON,
  DUN_WAITLIST_SHOPIFY_MAX_ATTEMPTS
} from './dunWaitlistShopifyFailureClassification'
import type { DunWaitlistShopifyQueueRecord } from './dunWaitlistShopifyQueueRecord'
import { getDunWaitlistShopifyRetryDelaySeconds } from './getDunWaitlistShopifyRetryDelaySeconds'
import {
  processDunWaitlistShopifyQueueMessage,
  type ProcessDunWaitlistShopifyQueueMessageResult
} from './processDunWaitlistShopifyQueueMessage'
import { readDunWaitlistShopifyQueue } from './readDunWaitlistShopifyQueue'
import { setDunWaitlistShopifyQueueVisibility } from './setDunWaitlistShopifyQueueVisibility'

export type DunWaitlistShopifyQueueBatchSummary = {
  read: number
  succeeded: number
  alreadySatisfied: number
  retryScheduled: number
  deadLettered: number
  invalid: number
  leadNotFound: number
  failed: number
  archived: number
}

export type RunDunWaitlistShopifyQueueBatchDependencies = {
  readMessages: (input: {
    maxItems: number
    visibilityTimeoutSeconds?: number
  }) => Promise<DunWaitlistShopifyQueueRecord[]>
  processMessage: (
    record: DunWaitlistShopifyQueueRecord
  ) => Promise<ProcessDunWaitlistShopifyQueueMessageResult>
  archiveMessage: (msgId: string) => Promise<boolean>
  setVisibility: (input: {
    msgId: string
    visibilityTimeoutSeconds: number
  }) => Promise<boolean>
  deadLetterMessage: typeof deadLetterDunWaitlistShopifyQueueMessage
}

const maxItemsSchema = z.number().int().min(1).max(50)

const defaultDependencies: RunDunWaitlistShopifyQueueBatchDependencies =
  {
    readMessages: readDunWaitlistShopifyQueue,
    processMessage: processDunWaitlistShopifyQueueMessage,
    archiveMessage: archiveDunWaitlistShopifyQueueMessage,
    setVisibility: setDunWaitlistShopifyQueueVisibility,
    deadLetterMessage: deadLetterDunWaitlistShopifyQueueMessage
  }

async function archiveSuccess(
  msgId: string,
  archiveMessage: RunDunWaitlistShopifyQueueBatchDependencies['archiveMessage'],
  summary: DunWaitlistShopifyQueueBatchSummary
): Promise<void> {
  try {
    const archived = await archiveMessage(msgId)
    if (archived) {
      summary.archived += 1
    }
  } catch {
    // Leave the message leased; visibility timeout will resurface it.
  }
}

async function handleFailure(
  record: DunWaitlistShopifyQueueRecord,
  result: Extract<
    ProcessDunWaitlistShopifyQueueMessageResult,
    { status: 'failure' }
  >,
  dependencies: RunDunWaitlistShopifyQueueBatchDependencies,
  summary: DunWaitlistShopifyQueueBatchSummary
): Promise<void> {
  if (result.reason === 'invalid_queue_message') {
    summary.invalid += 1
  } else if (result.reason === 'lead_not_found') {
    summary.leadNotFound += 1
  }

  const attemptsExhausted =
    result.kind === 'transient' &&
    record.read_ct >= DUN_WAITLIST_SHOPIFY_MAX_ATTEMPTS

  if (result.kind === 'permanent' || attemptsExhausted) {
    try {
      const terminal = await dependencies.deadLetterMessage({
        msgId: record.msg_id,
        readCt: record.read_ct,
        failureKind: result.kind,
        reason:
          attemptsExhausted ?
            DUN_WAITLIST_SHOPIFY_ATTEMPTS_EXHAUSTED_REASON
          : result.reason,
        ...(result.leadId !== undefined ? { leadId: result.leadId } : {}),
        ...(result.schemaVersion !== undefined ?
          { schemaVersion: result.schemaVersion }
        : {}),
        ...(attemptsExhausted ?
          { lastFailureReason: result.reason }
        : {})
      })

      if (terminal.deadLettered) {
        summary.deadLettered += 1
      }

      if (terminal.archived) {
        summary.archived += 1
      }
    } catch {
      summary.failed += 1
    }

    return
  }

  try {
    const delaySeconds = getDunWaitlistShopifyRetryDelaySeconds(
      record.read_ct
    )
    const scheduled = await dependencies.setVisibility({
      msgId: record.msg_id,
      visibilityTimeoutSeconds: delaySeconds
    })

    if (scheduled) {
      summary.retryScheduled += 1
    } else {
      summary.failed += 1
    }
  } catch {
    summary.failed += 1
  }
}

export async function runDunWaitlistShopifyQueueBatch(
  input: {
    maxItems: number
    visibilityTimeoutSeconds?: number
  },
  dependencies: RunDunWaitlistShopifyQueueBatchDependencies =
    defaultDependencies
): Promise<DunWaitlistShopifyQueueBatchSummary> {
  const maxItems = maxItemsSchema.parse(input.maxItems)

  const records = await dependencies.readMessages({
    maxItems,
    ...(input.visibilityTimeoutSeconds !== undefined ?
      {
        visibilityTimeoutSeconds: input.visibilityTimeoutSeconds
      }
    : {})
  })

  const summary: DunWaitlistShopifyQueueBatchSummary = {
    read: records.length,
    succeeded: 0,
    alreadySatisfied: 0,
    retryScheduled: 0,
    deadLettered: 0,
    invalid: 0,
    leadNotFound: 0,
    failed: 0,
    archived: 0
  }

  for (const record of records) {
    let result: ProcessDunWaitlistShopifyQueueMessageResult

    try {
      result = await dependencies.processMessage(record)
    } catch {
      summary.failed += 1
      continue
    }

    switch (result.status) {
      case 'succeeded':
        summary.succeeded += 1
        await archiveSuccess(
          record.msg_id,
          dependencies.archiveMessage,
          summary
        )
        break
      case 'already_satisfied':
        summary.alreadySatisfied += 1
        await archiveSuccess(
          record.msg_id,
          dependencies.archiveMessage,
          summary
        )
        break
      case 'failure':
        await handleFailure(record, result, dependencies, summary)
        break
    }
  }

  return summary
}
