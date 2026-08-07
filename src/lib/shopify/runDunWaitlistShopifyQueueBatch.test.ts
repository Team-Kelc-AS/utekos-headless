import assert from 'node:assert/strict'
import Module from 'node:module'
import { createRequire } from 'node:module'
import test from 'node:test'

import type { DunWaitlistShopifyQueueRecord } from './dunWaitlistShopifyQueueRecord'

const moduleWithLoad = Module as typeof Module & {
  _load: (
    request: string,
    parent: NodeModule | null,
    isMain: boolean
  ) => unknown
}
const originalLoad = moduleWithLoad._load.bind(Module)

moduleWithLoad._load = (request, parent, isMain) => {
  if (request === 'server-only') {
    return {}
  }

  if (
    request === '@/lib/observability/tracing/startAnalyticsSpan' ||
    request.endsWith('/observability/tracing/startAnalyticsSpan') ||
    request.endsWith('/observability/tracing/startAnalyticsSpan.ts')
  ) {
    return {
      startAnalyticsSpan: <T>(
        _options: unknown,
        callback: () => T
      ) => callback()
    }
  }

  return originalLoad(request, parent, isMain)
}

const require = createRequire(import.meta.url)
const { runDunWaitlistShopifyQueueBatch } = require(
  './runDunWaitlistShopifyQueueBatch.ts'
) as typeof import('./runDunWaitlistShopifyQueueBatch')
const {
  DUN_WAITLIST_SHOPIFY_ATTEMPTS_EXHAUSTED_REASON
} = require(
  './dunWaitlistShopifyFailureClassification.ts'
) as typeof import('./dunWaitlistShopifyFailureClassification')

const leadA = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1'
const leadB = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb2'
const leadC = 'cccccccc-cccc-4ccc-8ccc-ccccccccccc3'
const leadD = 'dddddddd-dddd-4ddd-8ddd-ddddddddddd4'

function makeRecord(
  msgId: string,
  leadId: string,
  readCt = 1
): DunWaitlistShopifyQueueRecord {
  return {
    msg_id: msgId,
    read_ct: readCt,
    enqueued_at: new Date('2026-08-07T12:00:00.000Z'),
    vt: new Date('2026-08-07T12:02:00.000Z'),
    message: {
      schema_version: 1,
      lead_id: leadId
    }
  }
}

function unusedDeadLetter(): never {
  throw new Error('deadLetter should not be called')
}

async function noopRecordSucceeded(): Promise<{ recorded: boolean }> {
  return { recorded: true }
}

test('records sync evidence before archive on Shopify success', async () => {
  const order: string[] = []
  let recordedLeadId: string | undefined

  const summary = await runDunWaitlistShopifyQueueBatch(
    { maxItems: 1 },
    {
      readMessages: async () => [makeRecord('1', leadA)],
      processMessage: async () => {
        order.push('sync')
        return {
          status: 'succeeded',
          customerId: 'gid://shopify/Customer/1',
          leadId: leadA
        }
      },
      recordSyncSucceeded: async leadId => {
        recordedLeadId = leadId
        order.push('evidence')
        return { recorded: true }
      },
      archiveMessage: async msgId => {
        order.push(`archive:${msgId}`)
        return true
      },
      setVisibility: async () => {
        throw new Error('setVisibility should not be called')
      },
      deadLetterMessage: unusedDeadLetter
    }
  )

  assert.deepEqual(order, ['sync', 'evidence', 'archive:1'])
  assert.equal(recordedLeadId, leadA)
  assert.equal(summary.succeeded, 1)
  assert.equal(summary.archived, 1)
})

test('does not archive when sync evidence write fails', async () => {
  let archiveCalls = 0

  const summary = await runDunWaitlistShopifyQueueBatch(
    { maxItems: 1 },
    {
      readMessages: async () => [makeRecord('1', leadA)],
      processMessage: async () => ({
        status: 'succeeded',
        customerId: 'gid://shopify/Customer/1',
        leadId: leadA
      }),
      recordSyncSucceeded: async () => {
        throw new Error('evidence write failed')
      },
      archiveMessage: async () => {
        archiveCalls += 1
        return true
      },
      setVisibility: async () => false,
      deadLetterMessage: unusedDeadLetter
    }
  )

  assert.equal(archiveCalls, 0)
  assert.equal(summary.succeeded, 0)
  assert.equal(summary.failed, 1)
})

test('schedules retry via set_vt on transient first attempt', async () => {
  let archiveCalls = 0
  let deadLetterCalls = 0
  const visibility: Array<{ msgId: string; seconds: number }> = []

  const summary = await runDunWaitlistShopifyQueueBatch(
    { maxItems: 1 },
    {
      readMessages: async () => [makeRecord('2', leadB, 1)],
      processMessage: async () => ({
        status: 'failure',
        kind: 'transient',
        reason: 'shopify_customer_create_failed',
        leadId: leadB,
        schemaVersion: 1
      }),
      recordSyncSucceeded: noopRecordSucceeded,
      archiveMessage: async () => {
        archiveCalls += 1
        return true
      },
      setVisibility: async input => {
        visibility.push({
          msgId: input.msgId,
          seconds: input.visibilityTimeoutSeconds
        })
        return true
      },
      deadLetterMessage: async () => {
        deadLetterCalls += 1
        return { alreadyExisted: false, archived: true, deadLettered: true }
      }
    }
  )

  assert.deepEqual(visibility, [{ msgId: '2', seconds: 300 }])
  assert.equal(archiveCalls, 0)
  assert.equal(deadLetterCalls, 0)
  assert.equal(summary.retryScheduled, 1)
  assert.equal(summary.failed, 0)
  assert.equal(summary.archived, 0)
})

test('schedules 600s backoff on transient second attempt', async () => {
  const visibility: number[] = []

  const summary = await runDunWaitlistShopifyQueueBatch(
    { maxItems: 1 },
    {
      readMessages: async () => [makeRecord('22', leadB, 2)],
      processMessage: async () => ({
        status: 'failure',
        kind: 'transient',
        reason: 'shopify_tags_add_failed'
      }),
      recordSyncSucceeded: noopRecordSucceeded,
      archiveMessage: async () => true,
      setVisibility: async input => {
        visibility.push(input.visibilityTimeoutSeconds)
        return true
      },
      deadLetterMessage: unusedDeadLetter
    }
  )

  assert.deepEqual(visibility, [600])
  assert.equal(summary.retryScheduled, 1)
})

test('dead-letters permanent failure on first attempt without set_vt', async () => {
  let setVisibilityCalls = 0
  const deadLetters: unknown[] = []

  const summary = await runDunWaitlistShopifyQueueBatch(
    { maxItems: 1 },
    {
      readMessages: async () => [makeRecord('3', leadC, 1)],
      processMessage: async () => ({
        status: 'failure',
        kind: 'permanent',
        reason: 'shopify_customer_create_rejected',
        leadId: leadC,
        schemaVersion: 1
      }),
      recordSyncSucceeded: noopRecordSucceeded,
      archiveMessage: async () => {
        throw new Error('success archive should not be used')
      },
      setVisibility: async () => {
        setVisibilityCalls += 1
        return true
      },
      deadLetterMessage: async input => {
        deadLetters.push(input)
        return { alreadyExisted: false, archived: true, deadLettered: true }
      }
    }
  )

  assert.equal(setVisibilityCalls, 0)
  assert.equal(deadLetters.length, 1)
  assert.deepEqual(deadLetters[0], {
    msgId: '3',
    readCt: 1,
    failureKind: 'permanent',
    reason: 'shopify_customer_create_rejected',
    leadId: leadC,
    schemaVersion: 1
  })
  assert.equal(summary.deadLettered, 1)
  assert.equal(summary.archived, 1)
})

test('dead-letters attempts exhausted with last failure reason preserved', async () => {
  let setVisibilityCalls = 0
  const deadLetters: unknown[] = []

  const summary = await runDunWaitlistShopifyQueueBatch(
    { maxItems: 1 },
    {
      readMessages: async () => [makeRecord('5', leadA, 5)],
      processMessage: async () => ({
        status: 'failure',
        kind: 'transient',
        reason: 'shopify_tags_add_failed',
        leadId: leadA,
        schemaVersion: 1
      }),
      recordSyncSucceeded: noopRecordSucceeded,
      archiveMessage: async () => true,
      setVisibility: async () => {
        setVisibilityCalls += 1
        return true
      },
      deadLetterMessage: async input => {
        deadLetters.push(input)
        return { alreadyExisted: false, archived: true, deadLettered: true }
      }
    }
  )

  assert.equal(setVisibilityCalls, 0)
  assert.deepEqual(deadLetters[0], {
    msgId: '5',
    readCt: 5,
    failureKind: 'transient',
    reason: DUN_WAITLIST_SHOPIFY_ATTEMPTS_EXHAUSTED_REASON,
    leadId: leadA,
    schemaVersion: 1,
    lastFailureReason: 'shopify_tags_add_failed'
  })
  assert.equal(summary.deadLettered, 1)
  assert.equal(summary.archived, 1)
})

test('archives success on final attempt without dead-letter', async () => {
  let deadLetterCalls = 0
  let setVisibilityCalls = 0
  let archiveCalls = 0

  const summary = await runDunWaitlistShopifyQueueBatch(
    { maxItems: 1 },
    {
      readMessages: async () => [makeRecord('55', leadA, 5)],
      processMessage: async () => ({
        status: 'succeeded',
        customerId: 'gid://shopify/Customer/55',
        leadId: leadA
      }),
      recordSyncSucceeded: noopRecordSucceeded,
      archiveMessage: async () => {
        archiveCalls += 1
        return true
      },
      setVisibility: async () => {
        setVisibilityCalls += 1
        return true
      },
      deadLetterMessage: async () => {
        deadLetterCalls += 1
        return { alreadyExisted: false, archived: true, deadLettered: true }
      }
    }
  )

  assert.equal(archiveCalls, 1)
  assert.equal(deadLetterCalls, 0)
  assert.equal(setVisibilityCalls, 0)
  assert.equal(summary.succeeded, 1)
  assert.equal(summary.archived, 1)
})

test('archives already_satisfied shadow messages without counting Shopify success', async () => {
  let archiveCalls = 0
  let evidenceCalls = 0

  const summary = await runDunWaitlistShopifyQueueBatch(
    { maxItems: 1 },
    {
      readMessages: async () => [makeRecord('3', leadC)],
      processMessage: async () => ({ status: 'already_satisfied' }),
      recordSyncSucceeded: async () => {
        evidenceCalls += 1
        return { recorded: true }
      },
      archiveMessage: async () => {
        archiveCalls += 1
        return true
      },
      setVisibility: async () => false,
      deadLetterMessage: unusedDeadLetter
    }
  )

  assert.equal(archiveCalls, 1)
  assert.equal(evidenceCalls, 0)
  assert.equal(summary.alreadySatisfied, 1)
  assert.equal(summary.succeeded, 0)
  assert.equal(summary.archived, 1)
})

test('isolates mixed outcomes within a batch', async () => {
  const archived: string[] = []
  const retries: string[] = []
  const deadLetters: string[] = []
  const evidence: string[] = []

  const summary = await runDunWaitlistShopifyQueueBatch(
    { maxItems: 4 },
    {
      readMessages: async () => [
        makeRecord('1', leadA),
        makeRecord('2', leadB),
        makeRecord('3', leadC),
        makeRecord('4', leadD)
      ],
      processMessage: async record => {
        if (record.msg_id === '1') {
          return {
            status: 'succeeded',
            customerId: 'gid://shopify/Customer/1',
            leadId: leadA
          }
        }

        if (record.msg_id === '2') {
          return {
            status: 'failure',
            kind: 'transient',
            reason: 'shopify_customer_create_failed'
          }
        }

        if (record.msg_id === '3') {
          return {
            status: 'failure',
            kind: 'permanent',
            reason: 'invalid_queue_message'
          }
        }

        return { status: 'already_satisfied' }
      },
      recordSyncSucceeded: async leadId => {
        evidence.push(leadId)
        return { recorded: true }
      },
      archiveMessage: async msgId => {
        archived.push(msgId)
        return true
      },
      setVisibility: async input => {
        retries.push(input.msgId)
        return true
      },
      deadLetterMessage: async input => {
        deadLetters.push(input.msgId)
        return { alreadyExisted: false, archived: true, deadLettered: true }
      }
    }
  )

  assert.deepEqual(summary, {
    read: 4,
    succeeded: 1,
    alreadySatisfied: 1,
    retryScheduled: 1,
    deadLettered: 1,
    invalid: 1,
    leadNotFound: 0,
    failed: 0,
    archived: 3
  })
  assert.deepEqual(evidence, [leadA])
  assert.deepEqual(archived, ['1', '4'])
  assert.deepEqual(retries, ['2'])
  assert.deepEqual(deadLetters, ['3'])
})

test('counts set_vt failure as failed and does not archive', async () => {
  let archiveCalls = 0

  const summary = await runDunWaitlistShopifyQueueBatch(
    { maxItems: 1 },
    {
      readMessages: async () => [makeRecord('9', leadA)],
      processMessage: async () => ({
        status: 'failure',
        kind: 'transient',
        reason: 'shopify_customer_lookup_failed'
      }),
      recordSyncSucceeded: noopRecordSucceeded,
      archiveMessage: async () => {
        archiveCalls += 1
        return true
      },
      setVisibility: async () => {
        throw new Error('set_vt unavailable')
      },
      deadLetterMessage: unusedDeadLetter
    }
  )

  assert.equal(archiveCalls, 0)
  assert.equal(summary.retryScheduled, 0)
  assert.equal(summary.failed, 1)
})

test('counts dead-letter transaction failure as failed without archive', async () => {
  const summary = await runDunWaitlistShopifyQueueBatch(
    { maxItems: 1 },
    {
      readMessages: async () => [makeRecord('10', leadA)],
      processMessage: async () => ({
        status: 'failure',
        kind: 'permanent',
        reason: 'lead_not_found',
        leadId: leadA
      }),
      recordSyncSucceeded: noopRecordSucceeded,
      archiveMessage: async () => true,
      setVisibility: async () => true,
      deadLetterMessage: async () => {
        throw new Error('txn failed')
      }
    }
  )

  assert.equal(summary.deadLettered, 0)
  assert.equal(summary.archived, 0)
  assert.equal(summary.failed, 1)
  assert.equal(summary.leadNotFound, 1)
})
