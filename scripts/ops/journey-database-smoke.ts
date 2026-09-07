import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import postgres from 'postgres'
import { z } from 'zod'
import { journeyEventSchema } from '../../src/lib/observability/journey/contract'
import { createJourneyStore } from '../../src/lib/observability/journey/createJourneyStore'
import type { JourneyRow } from '../../src/lib/observability/journey/journeyStore'
import { JOURNEY_TIMELINE_QUERY } from './journey-timeline'

type LocalDatabase = {
  exec: (sql: string) => Promise<unknown>
  query: (
    sql: string,
    parameters?: unknown[]
  ) => Promise<{ rows: Record<string, unknown>[] }>
  close: () => Promise<void>
}

type PGliteConstructor = new () => LocalDatabase

const packageDirectory = new URL(
  '../../work/journey-observability-validation/db-test/node_modules/@electric-sql/pglite/',
  import.meta.url
)
const migrationFile = new URL(
  '../../supabase/migrations/20260906172240_add_consented_journey_events.sql',
  import.meta.url
)
const nativeDatabaseUrl = process.env.JOURNEY_DATABASE_SMOKE_URL
const scope =
  nativeDatabaseUrl ?
    'isolated_native_postgresql_only'
  : 'isolated_in_memory_pglite_only'
const unverified = [
  'real_pg_cron_execution_and_permissions',
  'supabase_db_lint',
  'managed_supabase_role_configuration',
  'postgresql_concurrent_connections',
  'production_migration_and_readback'
]
const identifier = (value: number) =>
  `${value.toString(16).padStart(8, '0')}-1111-4111-8111-111111111111`
const journeyId = identifier(1000)
const otherJourneyId = identifier(1001)
const consent = {
  analytics: 'granted' as const,
  marketing: 'denied' as const,
  preferences: 'denied' as const,
  source: 'cookiebot' as const,
  version: '1'
}

function observation(
  value: number,
  occurredAt = new Date().toISOString(),
  journey = journeyId
): JourneyRow {
  return {
    event: journeyEventSchema.parse({
      schema_version: 1,
      event_name: 'utm_landing_page_view',
      event_id: identifier(value),
      journey_id: journey,
      page_view_id: identifier(value + 2000),
      occurred_at: occurredAt,
      page_path: '/skreddersy-varmen',
      consent,
      source: 'browser',
      environment: 'test',
      data: { utm_source: 'database-smoke' }
    }),
    received_at: new Date().toISOString(),
    traffic_classification: 'synthetic',
    runtime: {
      environment: 'test',
      deploymentId: 'local-pglite-smoke',
      commitSha: null
    }
  }
}

async function main() {
  const checks: { name: string; status: 'passed' | 'failed' }[] =
    []
  const failures: { name: string; message: string }[] = []
  let database: LocalDatabase | undefined
  let phase = 'load_local_pglite_0_5_8'
  const check = async (
    name: string,
    run: () => Promise<void>
  ) => {
    try {
      await run()
      checks.push({ name, status: 'passed' })
    } catch (error) {
      checks.push({ name, status: 'failed' })
      failures.push({
        name,
        message:
          error instanceof Error ?
            error.message
          : 'Unknown local test failure'
      })
    }
  }

  try {
    let db: LocalDatabase
    if (nativeDatabaseUrl) {
      phase = 'connect_isolated_native_postgresql'
      const url = new URL(nativeDatabaseUrl)
      assert.equal(url.hostname, '127.0.0.1')
      assert.equal(url.port, '58417')
      assert.equal(url.pathname, '/journey_smoke')
      assert.ok(
        ['postgres:', 'postgresql:'].includes(url.protocol)
      )
      const sql = postgres(nativeDatabaseUrl, {
        max: 1,
        prepare: false,
        connection: {
          application_name: 'journey-native-smoke',
          statement_timeout: 10000
        }
      })
      db = {
        exec: statement => sql.unsafe(statement).simple(),
        query: async (statement, parameters = []) => ({
          rows: Array.from(
            await sql.unsafe(
              statement,
              parameters as Parameters<typeof sql.unsafe>[1]
            )
          )
        }),
        close: () => sql.end({ timeout: 5 })
      }
    } else {
      z.object({ version: z.literal('0.5.8') }).parse(
        JSON.parse(
          await readFile(
            new URL('package.json', packageDirectory),
            'utf8'
          )
        )
      )
      const { PGlite } = z
        .object({
          PGlite: z.custom<PGliteConstructor>(
            value => typeof value === 'function'
          )
        })
        .parse(
          await import(
            new URL('dist/index.js', packageDirectory).href
          )
        )
      db = new PGlite()
    }
    database = db

    phase = 'bootstrap_isolated_roles_and_cron_stub'
    await db.exec(`
      create schema ops;
      create schema marketing;
      create schema cron;
      create role anon;
      create role authenticated;
      create role service_role bypassrls;
      create role journey_rls_probe nobypassrls;
      create table cron.job (
        jobid bigint generated always as identity primary key,
        jobname text not null unique,
        schedule text not null,
        command text not null,
        username name not null default current_user
      );
      create function cron.schedule(text, text, text) returns bigint
      language sql as $$
        insert into cron.job (jobname, schedule, command)
        values ($1, $2, $3)
        on conflict (jobname) do update
          set schedule = excluded.schedule, command = excluded.command
        returning jobid
      $$;
      create table marketing.event_ledger (
        event_id text primary key,
        event_name text not null,
        occurred_at timestamptz not null,
        created_at timestamptz not null default statement_timestamp(),
        consent jsonb not null,
        payload jsonb not null
      );
      create table marketing.canonical_event_source_evidence (
        canonical_event_id text not null,
        canonical_event_name text not null,
        source_method text not null,
        source_topic text not null,
        source_observed_at timestamptz not null default statement_timestamp()
      );
    `)

    phase = 'apply_exact_journey_migration'
    await db.exec(await readFile(migrationFile, 'utf8'))
    checks.push({ name: phase, status: 'passed' })

    const query = async (
      sql: string,
      parameters: readonly unknown[] = []
    ) => (await db.query(sql, [...parameters])).rows
    const store = createJourneyStore(query)
    const asRole = async (
      role:
        | 'anon'
        | 'authenticated'
        | 'service_role'
        | 'journey_rls_probe',
      run: () => Promise<void>
    ) => {
      await db.exec(`set role ${role}`)
      try {
        await run()
      } finally {
        await db.exec('reset role')
      }
    }
    const rejectSql = (
      run: () => Promise<unknown>,
      code: string
    ) => assert.rejects(run, { code })
    const rawInsert = async (
      row: JourneyRow,
      overrides: { consent?: unknown; payload?: unknown } = {}
    ) => {
      const event = row.event
      await query(
        `
        insert into ops.journey_events (
          event_id, journey_id, page_view_id, event_name, occurred_at,
          page_path, consent, payload, payload_sha256,
          traffic_classification, environment
        ) values (
          $1::uuid, $2::uuid, $3::uuid, $4, $5::timestamptz,
          $6, $7::text::jsonb, $8::text::jsonb, $9, 'synthetic', 'test'
        )
      `,
        [
          event.event_id,
          event.journey_id,
          event.page_view_id,
          event.event_name,
          event.occurred_at,
          event.page_path,
          JSON.stringify(
            'consent' in overrides ?
              overrides.consent
            : event.consent
          ),
          JSON.stringify(
            'payload' in overrides ? overrides.payload : event
          ),
          '0'.repeat(64)
        ]
      )
    }

    await check('rls_and_explicit_role_privileges', async () => {
      const [security] = await query(`
        select relrowsecurity, relforcerowsecurity
        from pg_class where oid = 'ops.journey_events'::regclass
      `)
      assert.equal(security?.relrowsecurity, true)
      assert.equal(security?.relforcerowsecurity, true)
      const permissions = await query(`
        select role_name, privilege,
          has_table_privilege(role_name, 'ops.journey_events', privilege) as allowed
        from (values ('anon'), ('authenticated'), ('service_role')) roles(role_name)
        cross join (values ('SELECT'), ('INSERT'), ('UPDATE'), ('DELETE'),
          ('TRUNCATE'), ('REFERENCES'), ('TRIGGER')) privileges(privilege)
      `)
      assert.equal(permissions.length, 21)
      for (const permission of permissions) {
        assert.equal(
          permission.allowed,
          permission.role_name === 'service_role' &&
            ['SELECT', 'INSERT'].includes(
              String(permission.privilege)
            )
        )
      }
    })

    await check(
      'service_store_insert_duplicate_and_conflict',
      async () => {
        await asRole('service_role', async () => {
          const row = observation(1)
          assert.equal(await store.accept(row), 'persisted')
          assert.equal(
            await store.accept({
              ...row,
              received_at: new Date(
                Date.now() + 1000
              ).toISOString()
            }),
            'duplicate'
          )
          assert.equal(
            await store.accept({
              ...row,
              event: journeyEventSchema.parse({
                ...row.event,
                data: { utm_source: 'conflicting-source' }
              })
            }),
            'conflict'
          )
          const rows = await query(
            `
          select payload #>> '{data,utm_source}' as source,
            traffic_classification, deployment_id
          from ops.journey_events where event_id = $1::uuid
        `,
            [row.event.event_id]
          )
          assert.equal(rows.length, 1)
          assert.equal(rows[0]?.source, 'database-smoke')
          assert.equal(
            rows[0]?.traffic_classification,
            'synthetic'
          )
          assert.equal(
            rows[0]?.deployment_id,
            'local-pglite-smoke'
          )
          await rejectSql(
            () =>
              query(
                'update ops.journey_events set page_path = page_path'
              ),
            '42501'
          )
          await rejectSql(
            () => query('delete from ops.journey_events'),
            '42501'
          )
          await rejectSql(
            () =>
              query('select ops.purge_expired_journey_events()'),
            '42501'
          )
        })
      }
    )

    for (const role of ['anon', 'authenticated'] as const) {
      await check(`${role}_cannot_read_or_insert`, async () => {
        await asRole(role, async () => {
          await rejectSql(
            () => query('select * from ops.journey_events'),
            '42501'
          )
          await rejectSql(
            () => store.accept(observation(10)),
            '42501'
          )
        })
      })
    }

    await check(
      'rls_blocks_a_granted_role_without_bypass',
      async () => {
        await db.exec(`
        grant usage on schema ops to journey_rls_probe;
        grant select, insert on ops.journey_events to journey_rls_probe;
      `)
        await asRole('journey_rls_probe', async () => {
          assert.equal(
            (await query('select * from ops.journey_events'))
              .length,
            0
          )
          await rejectSql(
            () => store.accept(observation(11)),
            '42501'
          )
        })
      }
    )

    await check(
      'database_rejects_missing_and_null_consent_fields',
      async () => {
        for (const invalidConsent of [
          null,
          { source: 'cookiebot' },
          { analytics: 'granted' },
          { ...consent, analytics: null },
          { ...consent, analytics: 'denied' }
        ]) {
          const row = observation(20)
          await rejectSql(
            () =>
              rawInsert(row, {
                consent: invalidConsent,
                payload: {
                  ...row.event,
                  consent: invalidConsent
                }
              }),
            '23514'
          )
        }
      }
    )

    await check(
      'database_rejects_missing_null_and_mismatched_payload_identity',
      async () => {
        const row = observation(21)
        const { event_id: ignoredId, ...withoutId } = row.event
        assert.equal(ignoredId, identifier(21))
        for (const invalidPayload of [
          withoutId,
          { ...row.event, event_id: null },
          { ...row.event, event_id: identifier(22) },
          { ...row.event, journey_id: otherJourneyId },
          { ...row.event, consent: null },
          { ...row.event, source: null }
        ]) {
          await rejectSql(
            () => rawInsert(row, { payload: invalidPayload }),
            '23514'
          )
        }
      }
    )

    await check(
      'retention_function_deletes_expired_and_margin_rows',
      async () => {
        const [clock] = await query(`
        select extract(epoch from (statement_timestamp() - interval '14 months'))
          ::double precision * 1000 as cutoff_ms
      `)
        const cutoff = z.number().parse(clock?.cutoff_ms)
        for (const [value, offsetMs] of [
          [30, -86_400_000],
          [31, 1_800_000],
          [32, 7_200_000]
        ] as const) {
          assert.equal(
            await store.accept(
              observation(
                value,
                new Date(cutoff + offsetMs).toISOString(),
                otherJourneyId
              )
            ),
            'persisted'
          )
        }
        const [purge] = await query(
          'select ops.purge_expired_journey_events() as deleted'
        )
        assert.equal(Number(purge?.deleted), 2)
        const remaining = await query(
          `
        select event_id::text from ops.journey_events
        where journey_id = $1::uuid order by event_id
      `,
          [otherJourneyId]
        )
        assert.deepEqual(
          remaining.map(row => row.event_id),
          [identifier(32)]
        )
      }
    )

    await check(
      'technical_retention_window_and_existing_cron_update',
      async () => {
        await db.exec(`
        create table ops.privacy_retention_exceptions (
          resource_schema text, resource_table text, resource_key text,
          expires_at timestamptz
        );
        create function ops.has_active_privacy_retention_exception(text, text, text, timestamptz)
        returns boolean language sql stable security definer set search_path = '' as $$
          select exists (
            select 1 from ops.privacy_retention_exceptions
            where resource_schema = $1 and resource_table = $2
              and resource_key = $3 and expires_at > $4
          )
        $$;
        create table ops.vercel_edge_request_observations (vercel_log_id text primary key, observed_at timestamptz);
        create table ops.vercel_trace_observations (trace_id text primary key, observed_at timestamptz);
        create table ops.landing_consent_observations (edge_request_id uuid primary key, observed_at timestamptz);
      `)
        const [previousJob] = await query(`
        select cron.schedule('purge_expired_landing_observations', '40 3 * * *',
          'select ops.purge_expired_landing_observations();') as id
      `)
        await db.exec(
          await readFile(
            new URL(
              '../../supabase/migrations/20260907145000_enforce_landing_observation_retention_window.sql',
              import.meta.url
            ),
            'utf8'
          )
        )
        const jobs = await query(`
        select jobid as id, schedule from cron.job
        where jobname = 'purge_expired_landing_observations'
      `)
        assert.deepEqual(jobs, [
          { id: previousJob?.id, schedule: '40 * * * *' }
        ])
        const tables = [
          ['vercel_edge_request_observations', 'vercel_log_id'],
          ['vercel_trace_observations', 'trace_id'],
          ['landing_consent_observations', 'edge_request_id']
        ] as const
        for (const [table, key] of tables) {
          for (const [index, age] of [
            '31 days',
            '29 days 23 hours 30 minutes',
            '29 days 22 hours 30 minutes',
            '31 days'
          ].entries()) {
            await query(
              `insert into ops.${table} (${key}, observed_at)
            values ($1, statement_timestamp() - $2::interval)`,
              [identifier(300 + index), age]
            )
          }
          await query(
            `insert into ops.privacy_retention_exceptions
          values ('ops', $1, $2, statement_timestamp() + interval '1 day')`,
            [table, identifier(303)]
          )
        }
        const [purge] = await query(
          'select ops.purge_expired_landing_observations() as counts'
        )
        assert.deepEqual(
          purge?.counts,
          Object.fromEntries(
            tables.map(([table]) => [`${table}_deleted`, 2])
          )
        )
        for (const [table, key] of tables) {
          const remaining = await query(
            `select ${key}::text as id from ops.${table} order by ${key}`
          )
          assert.deepEqual(
            remaining.map(row => row.id),
            [identifier(302), identifier(303)]
          )
        }
        for (const role of ['anon', 'authenticated']) {
          const [permission] = await query(
            `select has_function_privilege($1,
          'ops.purge_expired_landing_observations()', 'EXECUTE') as allowed`,
            [role]
          )
          assert.equal(permission?.allowed, false)
        }
      }
    )

    await check(
      'migration_registers_expected_job_in_explicit_cron_stub',
      async () => {
        const jobs = await query(
          'select jobname, schedule, command from cron.job where jobname = $1',
          ['purge_expired_journey_events']
        )
        assert.deepEqual(jobs, [
          {
            jobname: 'purge_expired_journey_events',
            schedule: '17 * * * *',
            command: 'select ops.purge_expired_journey_events();'
          }
        ])
      }
    )

    await check(
      'real_timeline_query_excludes_rejected_checkout_linkage',
      async () => {
        const beginId = identifier(40)
        const fixtures = [
          {
            id: 40,
            event: 'begin_checkout',
            journey: journeyId,
            reason: null,
            analytics: 'granted'
          },
          {
            id: 41,
            event: 'purchase',
            journey: journeyId,
            reason: 'linked',
            analytics: 'granted'
          },
          {
            id: 42,
            event: 'purchase',
            journey: null,
            reason: 'begin_checkout_mismatch',
            analytics: 'granted'
          },
          {
            id: 43,
            event: 'purchase',
            journey: journeyId,
            reason: 'analytics_consent_not_granted',
            analytics: 'denied'
          },
          {
            id: 44,
            event: 'purchase',
            journey: otherJourneyId,
            reason: 'linked',
            analytics: 'granted'
          }
        ]
        for (const fixture of fixtures) {
          await query(
            `
          insert into marketing.event_ledger
            (event_id, event_name, occurred_at, consent, payload)
          values ($1, $2, statement_timestamp(), $3::text::jsonb, $4::text::jsonb)
        `,
            [
              identifier(fixture.id),
              fixture.event,
              JSON.stringify({
                ...consent,
                analytics: fixture.analytics
              }),
              JSON.stringify({
                event_id: identifier(fixture.id),
                source:
                  fixture.event === 'purchase' ?
                    'webhook'
                  : 'web',
                environment: 'test',
                ...(fixture.journey ?
                  { journey_id: fixture.journey }
                : {}),
                page_view_id: identifier(2001),
                page_url: 'https://utekos.no/skreddersy-varmen',
                begin_checkout_event_id: beginId,
                journey_link_reason: fixture.reason,
                custom_data: {
                  value: 1,
                  currency: fixture.id === 42 ? 'SEK' : 'NOK'
                }
              })
            ]
          )
        }
        await query(
          `
        insert into marketing.canonical_event_source_evidence
          (canonical_event_id, canonical_event_name, source_method, source_topic)
        values ($1, 'purchase', 'webhook', 'orders/paid')
      `,
          [identifier(41)]
        )
        await db.exec('begin read only')
        try {
          const timeline = await query(JOURNEY_TIMELINE_QUERY, [
            journeyId,
            100
          ])
          assert.deepEqual(
            timeline.map(row => row.event_id).sort(),
            [identifier(1), beginId, identifier(41)].sort()
          )
          const purchase = timeline.find(
            row => row.event_id === identifier(41)
          )
          assert.equal(purchase?.source_method, 'webhook')
          assert.equal(purchase?.source_topic, 'orders/paid')
          assert.deepEqual(purchase?.details, {
            value: 1,
            currency: 'NOK',
            begin_checkout_event_id: beginId,
            journey_link_reason: 'linked'
          })
        } finally {
          await db.exec('rollback')
        }
      }
    )
    if (nativeDatabaseUrl) {
      await check(
        'concurrent_insert_waits_for_commit_then_deduplicates_or_conflicts',
        async () => {
          const contender = postgres(nativeDatabaseUrl, {
            max: 1,
            prepare: false,
            connection: {
              application_name: 'journey-native-contender',
              statement_timeout: 5000
            }
          })
          const contenderStore = createJourneyStore(
            (statement, parameters) =>
              contender.unsafe(
                statement,
                parameters as Parameters<
                  typeof contender.unsafe
                >[1]
              )
          )
          try {
            await contender.unsafe('set role service_role')
            for (const [index, expected] of [
              'duplicate',
              'conflict'
            ].entries()) {
              const row = observation(
                500 + index,
                new Date().toISOString(),
                otherJourneyId
              )
              let transactionOpen = false
              let pending:
                | Promise<{ value?: string; error?: unknown }>
                | undefined
              try {
                await db.exec(
                  'begin; set local role service_role'
                )
                transactionOpen = true
                assert.equal(
                  await store.accept(row),
                  'persisted'
                )
                await db.exec('reset role')
                const candidate =
                  expected === 'duplicate' ? row : (
                    {
                      ...row,
                      event: journeyEventSchema.parse({
                        ...row.event,
                        data: {
                          utm_source:
                            'conflicting-concurrent-source'
                        }
                      })
                    }
                  )
                pending = contenderStore.accept(candidate).then(
                  value => ({ value }),
                  error => ({ error })
                )
                let blocked = false
                for (let attempt = 0; attempt < 100; attempt++) {
                  await query('select pg_stat_clear_snapshot()')
                  const [activity] = await query(`select exists (
                  select 1 from pg_stat_activity where application_name = 'journey-native-contender'
                    and wait_event_type = 'Lock' and wait_event = 'transactionid'
                ) as blocked`)
                  if (activity?.blocked === true) {
                    blocked = true
                    break
                  }
                  await new Promise(resolve =>
                    setTimeout(resolve, 10)
                  )
                }
                assert.ok(
                  blocked,
                  'contender must wait on the uncommitted event id'
                )
                await db.exec('commit')
                transactionOpen = false
                const receipt = await pending
                if (receipt.error) throw receipt.error
                assert.equal(receipt.value, expected)
                const rows = await query(
                  'select payload from ops.journey_events where event_id = $1',
                  [row.event.event_id]
                )
                assert.equal(rows.length, 1)
                assert.deepEqual(rows[0]?.payload, row.event)
              } finally {
                if (transactionOpen) await db.exec('rollback')
                if (pending) await pending
              }
            }
          } finally {
            await contender.end({ timeout: 5 })
          }
        }
      )
    }
  } catch (error) {
    checks.push({ name: phase, status: 'failed' })
    failures.push({
      name: phase,
      message:
        error instanceof Error ?
          error.message
        : 'Unknown local test failure'
    })
  } finally {
    if (database) {
      try {
        await database.close()
      } catch {
        checks.push({
          name: 'close_isolated_database',
          status: 'failed'
        })
      }
    }
    const passed = checks.filter(
      check => check.status === 'passed'
    )
    const failed = checks.filter(
      check => check.status === 'failed'
    )
    console.log(
      JSON.stringify({
        scope,
        pg_cron: 'stubbed_registration_only',
        passed: passed.length,
        failed: failed.length,
        passed_checks: passed.map(check => check.name),
        failed_checks: failed.map(check => check.name),
        failures,
        unverified: unverified.filter(
          item =>
            item !== 'postgresql_concurrent_connections' ||
            !passed.some(
              check =>
                check.name ===
                'concurrent_insert_waits_for_commit_then_deduplicates_or_conflicts'
            )
        )
      })
    )
    if (failed.length > 0) process.exitCode = 1
  }
}

void main()
