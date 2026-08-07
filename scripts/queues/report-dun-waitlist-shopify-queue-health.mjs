#!/usr/bin/env node

/**
 * Read-only Dun waitlist → Shopify PGMQ health report.
 * Does not process, archive, delete, or requeue messages.
 * Never prints message payloads / PII.
 */

import dotenv from 'dotenv'
import postgres from 'postgres'
import { z } from 'zod'

dotenv.config({ path: '.env.local', quiet: true })
dotenv.config({ path: '.env.mcp.local', override: false, quiet: true })

const QUEUE_NAME = 'shopify_dun_waitlist_sync'
const DLQ_SOURCE = 'shopify_dun_waitlist_pgmq'
const WARNING_SECONDS = 15 * 60
const CRITICAL_SECONDS = 30 * 60

const healthRowSchema = z.object({
  queue_length: z.coerce.number().int().nonnegative(),
  newest_msg_age_sec: z.coerce.number().int().nullable(),
  oldest_msg_age_sec: z.coerce.number().int().nullable(),
  total_messages: z.coerce.number().int().nonnegative(),
  visible_count: z.coerce.number().int().nonnegative(),
  delayed_count: z.coerce.number().int().nonnegative(),
  oldest_visible_age_sec: z.coerce.number().int().nullable(),
  oldest_delayed_vt: z.union([z.string(), z.date()]).nullable(),
  archived_last_24h: z.coerce.number().int().nonnegative(),
  dead_lettered_last_7d: z.coerce.number().int().nonnegative(),
  unresolved_dead_letters: z.coerce.number().int().nonnegative()
})

function getWarehouseUrl(env = process.env) {
  return (
    env.SUPABASE_VERCEL_POSTGRES_URL_NON_POOLING ||
    env.SUPABASE_VERCEL_POSTGRES_URL_NON_POOLING_MAYBE ||
    env.SUPABASE_VERCEL_POSTGRES_URL ||
    null
  )
}

function classifyHealth(oldestVisibleAgeSec) {
  if (oldestVisibleAgeSec === null) {
    return 'healthy'
  }

  if (oldestVisibleAgeSec >= CRITICAL_SECONDS) {
    return 'critical'
  }

  if (oldestVisibleAgeSec >= WARNING_SECONDS) {
    return 'warning'
  }

  return 'healthy'
}

function toIso(value) {
  if (value instanceof Date) {
    return value.toISOString()
  }

  return typeof value === 'string' ? value : null
}

async function reportDunWaitlistShopifyQueueHealth() {
  const warehouseUrl = getWarehouseUrl()

  if (!warehouseUrl) {
    throw new Error(
      'No Supabase tracking warehouse URL configured. Set SUPABASE_VERCEL_POSTGRES_URL_NON_POOLING or SUPABASE_VERCEL_POSTGRES_URL.'
    )
  }

  const sql = postgres(warehouseUrl, {
    max: 1,
    prepare: false,
    idle_timeout: 5,
    connect_timeout: 10
  })

  try {
    const rows = await sql`
      with metrics as (
        select
          queue_length,
          newest_msg_age_sec,
          oldest_msg_age_sec,
          total_messages
        from pgmq.metrics(${QUEUE_NAME})
      ),
      visibility as (
        select
          count(*) filter (where q.vt <= clock_timestamp())::bigint as visible_count,
          count(*) filter (where q.vt > clock_timestamp())::bigint as delayed_count,
          floor(
            extract(
              epoch from (
                clock_timestamp() - min(q.enqueued_at) filter (
                  where q.vt <= clock_timestamp()
                )
              )
            )
          )::integer as oldest_visible_age_sec,
          min(q.vt) filter (where q.vt > clock_timestamp()) as oldest_delayed_vt
        from pgmq.q_shopify_dun_waitlist_sync as q
      ),
      archive_recent as (
        select count(*)::bigint as archived_last_24h
        from pgmq.a_shopify_dun_waitlist_sync
        where archived_at >= now() - interval '24 hours'
      ),
      dlq as (
        select
          count(*) filter (
            where created_at >= now() - interval '7 days'
          )::bigint as dead_lettered_last_7d,
          count(*) filter (
            where resolved_at is null
          )::bigint as unresolved_dead_letters
        from ops.dead_letter_events
        where source = ${DLQ_SOURCE}
      )
      select
        metrics.queue_length,
        metrics.newest_msg_age_sec,
        metrics.oldest_msg_age_sec,
        metrics.total_messages,
        coalesce(visibility.visible_count, 0)::bigint as visible_count,
        coalesce(visibility.delayed_count, 0)::bigint as delayed_count,
        visibility.oldest_visible_age_sec,
        visibility.oldest_delayed_vt,
        archive_recent.archived_last_24h,
        dlq.dead_lettered_last_7d,
        dlq.unresolved_dead_letters
      from metrics
      cross join visibility
      cross join archive_recent
      cross join dlq
    `

    const row = healthRowSchema.parse(rows[0])
    const report = {
      queueName: QUEUE_NAME,
      generatedAt: new Date().toISOString(),
      readOnly: true,
      healthLevel: classifyHealth(row.oldest_visible_age_sec),
      queueLength: row.queue_length,
      totalMessages: row.total_messages,
      newestMsgAgeSec: row.newest_msg_age_sec,
      oldestMsgAgeSec: row.oldest_msg_age_sec,
      visibleCount: row.visible_count,
      delayedCount: row.delayed_count,
      oldestVisibleAgeSec: row.oldest_visible_age_sec,
      oldestDelayedVt: toIso(row.oldest_delayed_vt),
      archivedLast24h: row.archived_last_24h,
      deadLetteredLast7d: row.dead_lettered_last_7d,
      unresolvedDeadLetters: row.unresolved_dead_letters,
      thresholds: {
        warningVisibleAgeSec: WARNING_SECONDS,
        criticalVisibleAgeSec: CRITICAL_SECONDS
      }
    }

    process.stdout.write(`${JSON.stringify(report, null, 2)}\n`)
  } finally {
    await sql.end({ timeout: 2 })
  }
}

const isDirectRun =
  import.meta.url === `file://${process.argv[1]}` ||
  process.argv[1]?.endsWith(
    'report-dun-waitlist-shopify-queue-health.mjs'
  )

if (isDirectRun) {
  reportDunWaitlistShopifyQueueHealth().catch(error => {
    const message =
      error instanceof Error ? error.message : 'unknown_error'
    process.stderr.write(`${message}\n`)
    process.exitCode = 1
  })
}

export { reportDunWaitlistShopifyQueueHealth, classifyHealth }
