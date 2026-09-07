import { pathToFileURL } from 'node:url'
import dotenv from 'dotenv'
import postgres from 'postgres'
import { z } from 'zod'
import { resolvePostgresConnectionUrl } from '../../src/lib/db/resolvePostgresConnectionUrl'
import { sanitizeJourneyPath } from '../../src/lib/observability/journey/sanitizeJourneyPath'

export const JOURNEY_TIMELINE_QUERY = `
with timeline as (
  select 'journey.event' as log_event, event_id::text, event_name,
    occurred_at, received_at, page_view_id::text, previous_page_view_id::text,
    page_path, consent, 'browser' as source, 'browser_reported' as evidence,
    traffic_classification, environment, commit_sha, deployment_id,
    payload -> 'data' as details, null::text as source_method, null::text as source_topic
  from ops.journey_events
  where journey_id = $1::uuid
    and occurred_at >= statement_timestamp() - interval '14 months'
  union all
  select 'commerce.event', ledger.event_id, ledger.event_name,
    ledger.occurred_at, ledger.created_at,
    ledger.payload ->> 'page_view_id', ledger.payload ->> 'previous_page_view_id',
    ledger.payload ->> 'page_url', ledger.consent, ledger.payload ->> 'source',
    'persisted_canonical_event', 'human_or_unknown', ledger.payload ->> 'environment', null, null,
    jsonb_build_object(
      'value', ledger.payload #> '{custom_data,value}',
      'currency', ledger.payload #> '{custom_data,currency}',
      'begin_checkout_event_id', coalesce(ledger.payload -> 'begin_checkout_event_id', ledger.payload #> '{custom_data,begin_checkout_event_id}'),
      'journey_link_reason', ledger.payload -> 'journey_link_reason'
    ), evidence.source_method, evidence.source_topic
  from marketing.event_ledger ledger
  left join lateral (
    select source_method, source_topic
    from marketing.canonical_event_source_evidence
    where canonical_event_id = ledger.event_id
      and canonical_event_name = ledger.event_name
    order by source_observed_at limit 1
  ) evidence on true
  where ledger.event_name in (
    'add_to_cart', 'begin_checkout', 'add_shipping_info', 'add_payment_info',
    'add_to_wishlist', 'generate_lead', 'purchase'
  ) and ledger.consent ->> 'analytics' = 'granted'
    and ledger.occurred_at >= statement_timestamp() - interval '14 months'
    and ledger.payload ->> 'journey_id' = $1::text
)
select * from timeline order by occurred_at, received_at, event_id limit $2
`

export function parseJourneyTimelineArguments(argv: string[]) {
  const input: Record<string, unknown> = { limit: 500 }
  for (let index = 0; index < argv.length; index += 2) {
    const key = argv[index]
    if (key === '--journey') input.journey_id = argv[index + 1]
    else if (key === '--limit')
      input.limit = Number(argv[index + 1])
    else
      throw new Error(
        'Usage: --journey <UUID> [--limit <1-2000>]'
      )
  }
  return z
    .strictObject({
      journey_id: z.string().uuid(),
      limit: z.number().int().min(1).max(2000)
    })
    .parse(input)
}

export function formatJourneyTimeline(
  rows: readonly Record<string, unknown>[]
): Record<string, unknown>[] {
  return rows.map(row => ({
    ...row,
    page_path:
      typeof row.page_path === 'string' ?
        sanitizeJourneyPath(row.page_path)
      : null,
    status: 'persisted',
    observation_semantics:
      row.event_name === 'journey_progress' ?
        'last_observed_not_proven_exit'
      : row.evidence
  }))
}

async function main() {
  const args = parseJourneyTimelineArguments(
    process.argv.slice(2)
  )
  dotenv.config({ path: '.env.local', quiet: true })
  const connection = resolvePostgresConnectionUrl(process.env)
  if (!connection)
    throw new Error('Missing warehouse connection')
  const sql = postgres(connection, {
    max: 1,
    prepare: false,
    connect_timeout: 10
  })
  try {
    const report = await sql.begin(
      'read only',
      async transaction => {
        await transaction`set local statement_timeout = '10s'`
        const rows = await transaction.unsafe(
          JOURNEY_TIMELINE_QUERY,
          [args.journey_id, args.limit + 1]
        )
        const events = formatJourneyTimeline(
          rows.slice(0, args.limit)
        )
        const commerceIds = events.flatMap(event =>
          (
            event.log_event === 'commerce.event' &&
            typeof event.event_id === 'string'
          ) ?
            [event.event_id]
          : []
        )
        const providerReceipts =
          commerceIds.length === 0 ?
            []
          : await transaction`
        select event_id, provider, status, http_status, response_semantics, processed_at
        from ops.provider_dispatch_attempts
        where event_id in ${transaction(commerceIds)}
        order by processed_at nulls last, provider limit 5001
      `
        return {
          journey_id: args.journey_id,
          truncated: rows.length > args.limit,
          events,
          provider_receipts: providerReceipts.slice(0, 5000),
          provider_receipts_truncated:
            providerReceipts.length > 5000
        }
      }
    )
    console.log(JSON.stringify(report, null, 2))
  } finally {
    await sql.end({ timeout: 5 })
  }
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  main().catch(() => {
    console.error(
      'Journey report unavailable. Check arguments, migration and read access locally; database details were not printed.'
    )
    process.exitCode = 1
  })
}
