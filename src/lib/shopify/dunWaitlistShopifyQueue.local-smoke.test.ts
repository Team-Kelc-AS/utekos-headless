import assert from 'node:assert/strict'
import Module from 'node:module'
import { createRequire } from 'node:module'
import test from 'node:test'
import postgres from 'postgres'

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
const { archiveDunWaitlistShopifyQueueMessage } = require(
  './archiveDunWaitlistShopifyQueueMessage.ts'
) as typeof import('./archiveDunWaitlistShopifyQueueMessage')
const { deadLetterDunWaitlistShopifyQueueMessage } = require(
  './deadLetterDunWaitlistShopifyQueueMessage.ts'
) as typeof import('./deadLetterDunWaitlistShopifyQueueMessage')
const {
  DUN_WAITLIST_SHOPIFY_PGMQ_DEAD_LETTER_SOURCE
} = require(
  './dunWaitlistShopifyFailureClassification.ts'
) as typeof import('./dunWaitlistShopifyFailureClassification')
const { DUN_WAITLIST_SHOPIFY_QUEUE_NAME } = require(
  './dunWaitlistShopifyQueueMessage.ts'
) as typeof import('./dunWaitlistShopifyQueueMessage')
const { readDunWaitlistShopifyQueue } = require(
  './readDunWaitlistShopifyQueue.ts'
) as typeof import('./readDunWaitlistShopifyQueue')
const { setDunWaitlistShopifyQueueVisibility } = require(
  './setDunWaitlistShopifyQueueVisibility.ts'
) as typeof import('./setDunWaitlistShopifyQueueVisibility')

const localDatabaseUrl =
  process.env.STEG3_PGMQ_SMOKE_DATABASE_URL ??
  process.env.STEG4_PGMQ_SMOKE_DATABASE_URL ??
  'postgresql://postgres:postgres@127.0.0.1:54322/postgres'

async function canConnect(): Promise<boolean> {
  const sql = postgres(localDatabaseUrl, {
    connect_timeout: 2,
    max: 1,
    prepare: false
  })

  try {
    await sql`select 1`
    return true
  } catch {
    return false
  } finally {
    await sql.end({ timeout: 1 })
  }
}

test('local PGMQ smoke: read_ct, short VT, and archive', async t => {
  if (!(await canConnect())) {
    t.skip('local Supabase Postgres is not available')
    return
  }

  const sql = postgres(localDatabaseUrl, {
    max: 1,
    prepare: false
  })

  const executeQuery = async <T extends Record<string, unknown>>(
    query: string,
    parameters: readonly unknown[]
  ) =>
    sql.unsafe<T[]>(
      query,
      parameters as Parameters<typeof sql.unsafe>[1]
    )

  const leadId = '33333333-3333-4333-8333-333333333333'

  try {
    await sql`
      delete from pgmq.q_shopify_dun_waitlist_sync
      where message ->> 'lead_id' = ${leadId}
    `
    await sql`
      delete from pgmq.a_shopify_dun_waitlist_sync
      where message ->> 'lead_id' = ${leadId}
    `

    const sent = await sql`
      select pgmq.send(
        ${DUN_WAITLIST_SHOPIFY_QUEUE_NAME},
        ${sql.json({
          schema_version: 1,
          lead_id: leadId
        })}
      ) as msg_id
    `
    assert.ok(sent[0]?.msg_id, 'expected pgmq.send to return a msg_id')

    const queued = await sql`
      select message
      from pgmq.q_shopify_dun_waitlist_sync
      where message ->> 'lead_id' = ${leadId}
    `
    assert.equal(queued.length, 1, 'expected one queued smoke message')

    const firstRead = await readDunWaitlistShopifyQueue(
      {
        maxItems: 50,
        visibilityTimeoutSeconds: 2
      },
      { executeQuery }
    )

    const target = firstRead.find(record => {
      const message = record.message as { lead_id?: string }
      return message.lead_id === leadId
    })

    assert.ok(target, 'expected smoke message to be readable')
    assert.equal(target.read_ct >= 1, true)

    const secondReadWhileLeased = await readDunWaitlistShopifyQueue(
      {
        maxItems: 10,
        visibilityTimeoutSeconds: 2
      },
      { executeQuery }
    )

    assert.equal(
      secondReadWhileLeased.some(record => {
        const message = record.message as { lead_id?: string }
        return message.lead_id === leadId
      }),
      false,
      'message should be invisible while leased'
    )

    await new Promise(resolve => setTimeout(resolve, 2_100))

    const thirdRead = await readDunWaitlistShopifyQueue(
      {
        maxItems: 10,
        visibilityTimeoutSeconds: 30
      },
      { executeQuery }
    )

    const reopened = thirdRead.find(record => {
      const message = record.message as { lead_id?: string }
      return message.lead_id === leadId
    })

    assert.ok(reopened, 'message should reappear after VT expiry')
    assert.equal(reopened.read_ct >= 2, true)

    const archived = await archiveDunWaitlistShopifyQueueMessage(
      reopened.msg_id,
      { executeQuery }
    )
    assert.equal(archived, true)

    const afterArchive = await sql`
      select count(*)::integer as count
      from pgmq.q_shopify_dun_waitlist_sync
      where message ->> 'lead_id' = ${leadId}
    `
    assert.equal(afterArchive[0]?.count, 0)
  } finally {
    await sql`
      delete from pgmq.q_shopify_dun_waitlist_sync
      where message ->> 'lead_id' = ${leadId}
    `
    await sql`
      delete from pgmq.a_shopify_dun_waitlist_sync
      where message ->> 'lead_id' = ${leadId}
    `
    await sql.end({ timeout: 2 })
  }
})

test('local PGMQ smoke: set_vt backoff and read_ct increment', async t => {
  if (!(await canConnect())) {
    t.skip('local Supabase Postgres is not available')
    return
  }

  const sql = postgres(localDatabaseUrl, {
    max: 1,
    prepare: false
  })

  const executeQuery = async <T extends Record<string, unknown>>(
    query: string,
    parameters: readonly unknown[]
  ) =>
    sql.unsafe<T[]>(
      query,
      parameters as Parameters<typeof sql.unsafe>[1]
    )

  const leadId = '44444444-4444-4444-8444-444444444444'

  try {
    await sql`
      delete from pgmq.q_shopify_dun_waitlist_sync
      where message ->> 'lead_id' = ${leadId}
    `
    await sql`
      delete from pgmq.a_shopify_dun_waitlist_sync
      where message ->> 'lead_id' = ${leadId}
    `

    await sql`
      select pgmq.send(
        ${DUN_WAITLIST_SHOPIFY_QUEUE_NAME},
        ${sql.json({
          schema_version: 1,
          lead_id: leadId
        })}
      )
    `

    const firstRead = await readDunWaitlistShopifyQueue(
      {
        maxItems: 50,
        visibilityTimeoutSeconds: 30
      },
      { executeQuery }
    )

    const target = firstRead.find(record => {
      const message = record.message as { lead_id?: string }
      return message.lead_id === leadId
    })

    assert.ok(target, 'expected set_vt smoke message')
    const firstReadCt = target.read_ct

    const updated = await setDunWaitlistShopifyQueueVisibility(
      {
        msgId: target.msg_id,
        visibilityTimeoutSeconds: 2
      },
      { executeQuery }
    )
    assert.equal(updated, true)

    const whileHidden = await readDunWaitlistShopifyQueue(
      {
        maxItems: 10,
        visibilityTimeoutSeconds: 2
      },
      { executeQuery }
    )

    assert.equal(
      whileHidden.some(record => {
        const message = record.message as { lead_id?: string }
        return message.lead_id === leadId
      }),
      false,
      'message should stay invisible after set_vt'
    )

    await new Promise(resolve => setTimeout(resolve, 2_100))

    const afterBackoff = await readDunWaitlistShopifyQueue(
      {
        maxItems: 10,
        visibilityTimeoutSeconds: 30
      },
      { executeQuery }
    )

    const reopened = afterBackoff.find(record => {
      const message = record.message as { lead_id?: string }
      return message.lead_id === leadId
    })

    assert.ok(reopened, 'message should reappear after set_vt expiry')
    assert.equal(reopened.read_ct >= firstReadCt + 1, true)

    await archiveDunWaitlistShopifyQueueMessage(reopened.msg_id, {
      executeQuery
    })
  } finally {
    await sql`
      delete from pgmq.q_shopify_dun_waitlist_sync
      where message ->> 'lead_id' = ${leadId}
    `
    await sql`
      delete from pgmq.a_shopify_dun_waitlist_sync
      where message ->> 'lead_id' = ${leadId}
    `
    await sql.end({ timeout: 2 })
  }
})

test('local PGMQ smoke: atomic dead-letter + archive is idempotent', async t => {
  if (!(await canConnect())) {
    t.skip('local Supabase Postgres is not available')
    return
  }

  const sql = postgres(localDatabaseUrl, {
    max: 1,
    prepare: false
  })

  const runTransaction = async <T>(
    work: (transaction: {
      executeQuery: <R extends Record<string, unknown>>(
        query: string,
        parameters: readonly unknown[]
      ) => Promise<R[]>
    }) => Promise<T>
  ) =>
    sql.begin(async tx =>
      work({
        executeQuery: async (query, parameters) =>
          tx.unsafe(
            query,
            parameters as Parameters<typeof tx.unsafe>[1]
          )
      })
    )

  const leadId = '55555555-5555-4555-8555-555555555555'

  try {
    await sql`
      delete from ops.dead_letter_events
      where source = ${DUN_WAITLIST_SHOPIFY_PGMQ_DEAD_LETTER_SOURCE}
        and payload ->> 'lead_id' = ${leadId}
    `
    await sql`
      delete from pgmq.q_shopify_dun_waitlist_sync
      where message ->> 'lead_id' = ${leadId}
    `
    await sql`
      delete from pgmq.a_shopify_dun_waitlist_sync
      where message ->> 'lead_id' = ${leadId}
    `

    const sent = await sql`
      select pgmq.send(
        ${DUN_WAITLIST_SHOPIFY_QUEUE_NAME},
        ${sql.json({
          schema_version: 1,
          lead_id: leadId
        })}
      ) as msg_id
    `
    const msgId = String(sent[0]?.msg_id)
    assert.ok(msgId)

    await sql`
      select * from pgmq.read(
        ${DUN_WAITLIST_SHOPIFY_QUEUE_NAME}::text,
        30::integer,
        1::integer
      )
    `

    const first = await deadLetterDunWaitlistShopifyQueueMessage(
      {
        msgId,
        readCt: 1,
        failureKind: 'permanent',
        reason: 'invalid_lead_record',
        leadId,
        schemaVersion: 1
      },
      { runTransaction }
    )

    assert.equal(first.deadLettered, true)
    assert.equal(first.archived, true)
    assert.equal(first.alreadyExisted, false)

    const active = await sql`
      select count(*)::integer as count
      from pgmq.q_shopify_dun_waitlist_sync
      where msg_id = ${msgId}::bigint
    `
    assert.equal(active[0]?.count, 0)

    const archived = await sql`
      select count(*)::integer as count
      from pgmq.a_shopify_dun_waitlist_sync
      where msg_id = ${msgId}::bigint
    `
    assert.equal(archived[0]?.count, 1)

    const deadLetters = await sql`
      select id::text as id, reason, payload, metadata
      from ops.dead_letter_events
      where source = ${DUN_WAITLIST_SHOPIFY_PGMQ_DEAD_LETTER_SOURCE}
        and payload ->> 'pgmq_message_id' = ${msgId}
    `
    assert.equal(deadLetters.length, 1)
    assert.equal(deadLetters[0]?.reason, 'invalid_lead_record')

    const second = await deadLetterDunWaitlistShopifyQueueMessage(
      {
        msgId,
        readCt: 1,
        failureKind: 'permanent',
        reason: 'invalid_lead_record',
        leadId,
        schemaVersion: 1
      },
      { runTransaction }
    )

    assert.equal(second.alreadyExisted, true)
    assert.equal(second.deadLettered, true)

    const deadLettersAfter = await sql`
      select count(*)::integer as count
      from ops.dead_letter_events
      where source = ${DUN_WAITLIST_SHOPIFY_PGMQ_DEAD_LETTER_SOURCE}
        and payload ->> 'pgmq_message_id' = ${msgId}
    `
    assert.equal(deadLettersAfter[0]?.count, 1)
  } finally {
    await sql`
      delete from ops.dead_letter_events
      where source = ${DUN_WAITLIST_SHOPIFY_PGMQ_DEAD_LETTER_SOURCE}
        and payload ->> 'lead_id' = ${leadId}
    `
    await sql`
      delete from pgmq.q_shopify_dun_waitlist_sync
      where message ->> 'lead_id' = ${leadId}
    `
    await sql`
      delete from pgmq.a_shopify_dun_waitlist_sync
      where message ->> 'lead_id' = ${leadId}
    `
    await sql.end({ timeout: 2 })
  }
})
