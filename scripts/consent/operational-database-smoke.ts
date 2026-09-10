import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import {
  readFile,
  realpath,
  stat,
  writeFile
} from 'node:fs/promises'
import { setTimeout as delay } from 'node:timers/promises'
import postgres from 'postgres'
import { z } from 'zod'

const args = z
  .tuple([
    z.string().regex(/^\/tmp\/utekos-consent-db\.[A-Za-z0-9]+$/),
    z
      .string()
      .regex(
        /^\/Users\/kristofferohnstadhjelmeland\/utekos-headless\/work\/consent-database\.[A-Za-z0-9]+$/
      )
  ])
  .rest(z.literal('readback'))
  .refine(values => values.length <= 3)
  .parse(process.argv.slice(2))
const [socketDirectory, evidenceDirectory, readback] = args
const columns = z.array(z.object({ column_name: z.string() }))
const checks: {
  name: string
  status: 'passed' | 'failed'
  message?: string
}[] = []
const sourceHashes: Record<string, string> = {}
const sql = postgres({
  host: socketDirectory,
  port: 58527,
  database: 'postgres',
  username: 'consent_test_admin',
  password: '',
  ssl: false,
  max: 4,
  prepare: false,
  connect_timeout: 5,
  onnotice: () => {},
  connection: {
    application_name: 'isolated-consent-database-smoke',
    statement_timeout: 10000
  }
})
type Connection = typeof sql | postgres.TransactionSql

async function check(name: string, run: () => Promise<void>) {
  try {
    await run()
    checks.push({ name, status: 'passed' })
  } catch (error) {
    checks.push({
      name,
      status: 'failed',
      message:
        error instanceof Error ? error.message : String(error)
    })
  }
}

async function source(name: string) {
  const text = await readFile(
    new URL(
      `../../supabase/migrations/${name}`,
      import.meta.url
    ),
    'utf8'
  )
  sourceHashes[name] = createHash('sha256')
    .update(text)
    .digest('hex')
  return text
}

function prefix(text: string, marker: string) {
  const index = text.indexOf(marker)
  assert.ok(
    index > 0,
    `Missing exact baseline boundary: ${marker}`
  )
  return text.slice(0, index)
}

function observation(
  id: string,
  overrides: Record<
    string,
    string | number | boolean | Date | null
  > = {}
) {
  return {
    vercel_log_id: id,
    deployment_id: 'synthetic-deployment',
    project_id: 'synthetic-project',
    environment: 'preview',
    observed_at: new Date(),
    observation_type: 'document',
    route_pathname: '/skreddersy-varmen',
    host: 'local-test.invalid',
    method: 'GET',
    source: 'edge',
    status_code: 200,
    edge_region: 'local-test',
    in_app_browser: 'unknown',
    device_class: 'unknown',
    os_class: 'unknown',
    automation_class: 'synthetic_client',
    fbclid_present: false,
    response_bytes: 100,
    data_policy: 'operational_v1',
    ...overrides
  }
}

async function insert(
  id: string,
  overrides: Record<
    string,
    string | number | boolean | Date | null
  > = {},
  connection: Connection = sql
) {
  return connection`insert into ops.vercel_edge_request_observations ${connection(observation(id, overrides))} on conflict (vercel_log_id) do nothing`
}

async function asRole(
  role:
    | 'postgres'
    | 'service_role'
    | 'anon'
    | 'authenticated'
    | 'consent_rls_probe',
  run: (connection: postgres.TransactionSql) => Promise<void>
) {
  await sql.begin(async connection => {
    await connection.unsafe(`set local role ${role}`)
    await run(connection)
  })
}

async function scalar(statement: string) {
  const result = z
    .array(z.object({ value: z.coerce.number() }))
    .length(1)
    .parse(await sql.unsafe(statement))
  assert.ok(result[0])
  return result[0].value
}

async function clearSyntheticObservations() {
  await sql`truncate ops.vercel_edge_request_observations, ops.daily_operational_traffic, ops.privacy_retention_exceptions`
}

async function setting(name: 'listen_addresses' | 'cron.launch_active_jobs') {
  const [row] = z.tuple([z.object({ value: z.string() })]).parse(
    await sql`select current_setting(${name}) as value`
  )
  return row.value
}

async function denied(
  run: () => Promise<unknown>,
  code: string
) {
  await assert.rejects(
    run,
    (error: unknown) =>
      z.object({ code: z.literal(code) }).safeParse(error)
        .success
  )
}

async function main() {
  const metadata = await stat(socketDirectory)
  assert.equal(metadata.uid, process.getuid?.())
  assert.equal(metadata.mode & 0o777, 0o700)
  const expectedDataDirectory = await realpath(
    `${socketDirectory}/data`
  )
  const server = z
    .array(
      z.object({
        isolated: z.literal('isolated'),
        address: z.null(),
        directory: z.string(),
        username: z.literal('consent_test_admin'),
        database: z.literal('postgres')
      })
    )
    .length(1)
    .parse(
      await sql`
    select current_setting('utekos.consent_test') as isolated, inet_server_addr() as address,
      current_setting('data_directory') as directory, current_user as username, current_database() as database
  `
    )[0]
  assert.ok(server)
  assert.equal(
    await realpath(server.directory),
    expectedDataDirectory
  )
  assert.equal(await setting('listen_addresses'), '')

  if (readback) {
    await check(
      'restart_preserves_disabled_control_and_exact_named_jobs',
      async () => {
        assert.equal(
          await scalar(
            'select count(*) as value from ops.operational_statistics_control where not enabled'
          ),
          1
        )
        assert.equal(
          await scalar(
            'select count(*) as value from cron.job where jobname=\'purge_operational_v1\' and schedule=\'35 * * * *\' and username=\'postgres\''
          ),
          1
        )
        assert.equal(
          await scalar(
            'select count(*) as value from cron.job where jobname=\'purge_expired_landing_observations\' and schedule=\'40 * * * *\''
          ),
          1
        )
        assert.equal(await setting('cron.launch_active_jobs'), 'off')
      }
    )
    return
  }

  await sql
    .unsafe(
      `
    create extension pg_cron version '1.6.4';
    create schema extensions;
    create extension plpgsql_check with schema extensions;
    create role postgres login bypassrls;
    create role service_role bypassrls;
    create role anon nobypassrls;
    create role authenticated nobypassrls;
    create role consent_rls_probe nobypassrls;
    grant all on database postgres to postgres;
    grant usage on schema cron to postgres;
    create schema ops authorization postgres;
    create schema analytics authorization postgres;
  `
    )
    .simple()
  const baseline = await source(
    '20260801062712_add_vercel_landing_observability.sql'
  )
  const privacy = await source(
    '20260726034756_enforce_privacy_retention.sql'
  )
  const previousRetention = await source(
    '20260907145000_enforce_landing_observation_retention_window.sql'
  )
  const migration = await source(
    '20260910060000_add_operational_v1_privacy_policy.sql'
  )
  await asRole('postgres', async connection => {
    await connection
      .unsafe(
        prefix(
          baseline,
          'create index if not exists event_ledger_edge_request_page_view_idx'
        )
      )
      .simple()
    await connection
      .unsafe(
        prefix(
          privacy,
          'create or replace function ops.purge_expired_privacy_data()'
        )
      )
      .simple()
    for (const table of [
      'vercel_edge_request_observations',
      'vercel_trace_observations',
      'landing_consent_observations'
    ]) {
      const actions = [
        `alter table ops.${table} enable row level security;`,
        `alter table ops.${table} force row level security;`,
        `revoke all on table ops.${table}\n  from public, anon, authenticated, service_role;`,
        `grant ${table === 'vercel_edge_request_observations' ? 'select, insert' : 'select, insert, update'} on table ops.${table} to service_role;`
      ]
      for (const statement of actions) {
        assert.ok(
          baseline.includes(statement),
          `Baseline ACL drift: ${statement}`
        )
        await connection.unsafe(statement)
      }
    }
    await connection`grant usage on schema ops to service_role`
    await connection.unsafe(previousRetention).simple()
    const legacy = observation('legacy-before-migration', {
      fbclid_present: true,
      utm_source: 'synthetic-legacy',
      in_app_browser: 'facebook'
    })
    const { data_policy: unusedPolicy, ...oldRow } = legacy
    assert.equal(unusedPolicy, 'operational_v1')
    await connection`insert into ops.vercel_edge_request_observations ${connection(oldRow)}`
  })

  await check(
    'migration_rolls_back_wholly_on_transaction_failure',
    async () => {
      await denied(
        () =>
          asRole('postgres', async connection => {
            await connection.unsafe(migration).simple()
            await connection`select 1/0`
          }),
        '22012'
      )
      assert.equal(
        await scalar(
          'select count(*) as value from information_schema.columns where table_schema=\'ops\' and table_name=\'vercel_edge_request_observations\' and column_name=\'data_policy\''
        ),
        0
      )
      assert.equal(
        await scalar(
          'select count(*) as value from cron.job where jobname=\'purge_operational_v1\''
        ),
        0
      )
    }
  )
  await asRole('postgres', async connection => {
    await connection.unsafe(migration).simple()
  })
  checks.push({
    name: 'exact_migration_applies_as_non_superuser_postgres',
    status: 'passed'
  })

  await check(
    'reapplying_migration_fails_without_partially_changing_state',
    async () => {
      await denied(
        () =>
          asRole('postgres', async connection => {
            await connection.unsafe(migration).simple()
          }),
        '42701'
      )
      assert.equal(
        await scalar(
          'select count(*) as value from ops.operational_statistics_control where not enabled'
        ),
        1
      )
      assert.equal(
        await scalar(
          'select count(*) as value from cron.job where jobname=\'purge_operational_v1\''
        ),
        1
      )
    }
  )

  await check(
    'legacy_preserved_and_aggregation_starts_off',
    async () => {
      assert.equal(
        await scalar(
          'select count(*) as value from ops.vercel_edge_request_observations where vercel_log_id=\'legacy-before-migration\' and data_policy=\'legacy\' and fbclid_present and utm_source=\'synthetic-legacy\''
        ),
        1
      )
      await asRole('service_role', async connection => {
        await insert('before-approval', {}, connection)
      })
      assert.equal(
        await scalar(
          'select count(*) as value from ops.daily_operational_traffic'
        ),
        0
      )
      assert.equal(
        await scalar(
          'select count(*) as value from ops.operational_statistics_control where not enabled and approved_at is null and approved_by is null'
        ),
        1
      )
    }
  )
  await check(
    'approval_required_and_service_role_cannot_self_approve',
    async () => {
      await denied(
        () =>
          sql`update ops.operational_statistics_control set enabled=true`,
        '23514'
      )
      await denied(
        () =>
          asRole('service_role', async connection => {
            await connection`update ops.operational_statistics_control set enabled=true, approved_at=now(), approved_by='synthetic'`
          }),
        '42501'
      )
    }
  )
  await check(
    'all_new_tables_and_functions_have_restricted_access',
    async () => {
      for (const role of ['anon', 'authenticated'] as const) {
        await denied(
          () =>
            asRole(role, async connection => {
              await connection`select * from ops.daily_operational_traffic`
            }),
          '42501'
        )
        await denied(
          () =>
            asRole(role, async connection => {
              await connection`select ops.purge_operational_v1()`
            }),
          '42501'
        )
      }
      await denied(
        () =>
          asRole('service_role', async connection => {
            await connection`select * from ops.operational_statistics_control`
          }),
        '42501'
      )
      await denied(
        () =>
          asRole('service_role', async connection => {
            await connection`delete from ops.daily_operational_traffic`
          }),
        '42501'
      )
      await asRole('service_role', async connection => {
        await connection`select * from ops.daily_operational_traffic`
      })
      assert.equal(
        await scalar(
          'select count(*) as value from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname=\'ops\' and c.relname in (\'daily_operational_traffic\',\'operational_statistics_control\') and c.relrowsecurity'
        ),
        2
      )
      await sql`grant usage on schema ops to consent_rls_probe`
      await sql`grant select on ops.daily_operational_traffic, ops.operational_statistics_control to consent_rls_probe`
      await asRole('consent_rls_probe', async connection => {
        assert.equal(
          (
            await connection`select * from ops.operational_statistics_control`
          ).length,
          0
        )
      })
    }
  )

  const forbidden = {
    edge_request_id: '11111111-1111-4111-8111-111111111111',
    fbclid_present: true,
    fbclid_hmac: 'a'.repeat(64),
    utm_source: 'synthetic',
    utm_medium: 'synthetic',
    utm_campaign: 'synthetic',
    utm_content: 'synthetic',
    utm_term: 'synthetic',
    meta_campaign_id: '12345',
    meta_adset_id: '12345',
    meta_ad_id: '12345',
    meta_placement: 'synthetic',
    meta_site_source_name: 'synthetic',
    referrer_host: 'example.invalid',
    in_app_browser: 'facebook',
    device_class: 'mobile',
    os_class: 'ios'
  }
  for (const [field, value] of Object.entries(forbidden)) {
    await check(
      `rejects_operational_ad_or_browser_field_${field}`,
      async () => {
        await denied(
          () => insert(`invalid-${field}`, { [field]: value }),
          '23514'
        )
      }
    )
  }
  await check(
    'rejects_query_strings_and_invalid_policy',
    async () => {
      await denied(
        () =>
          insert('invalid-query', {
            route_pathname: '/?fbclid=synthetic'
          }),
        '23514'
      )
      await denied(
        () =>
          insert('invalid-policy', {
            data_policy: 'unrecognized'
          }),
        '23514'
      )
    }
  )

  await clearSyntheticObservations()
  await sql`update ops.operational_statistics_control set enabled=true, approved_at=now(), approved_by='synthetic-local-test-controller'`
  await check(
    'duplicate_retry_and_concurrent_insert_count_once_per_log_id',
    async () => {
      await Promise.all(
        Array.from({ length: 12 }, (_, index) =>
          asRole('service_role', async connection => {
            await insert(`parallel-${index % 6}`, {}, connection)
          })
        )
      )
      assert.equal(
        await scalar(
          'select count(*) as value from ops.vercel_edge_request_observations'
        ),
        6
      )
      assert.equal(
        await scalar(
          'select sum(observations) as value from ops.daily_operational_traffic'
        ),
        6
      )
      assert.equal(
        await scalar(
          'select sum(response_bytes) as value from ops.daily_operational_traffic'
        ),
        600
      )
    }
  )
  await check(
    'failed_batch_rolls_back_rows_and_aggregate',
    async () => {
      await denied(
        () =>
          asRole('service_role', async connection => {
            await insert('batch-valid', {}, connection)
            await insert(
              'batch-invalid',
              { fbclid_present: true },
              connection
            )
          }),
        '23514'
      )
      assert.equal(
        await scalar(
          'select count(*) as value from ops.vercel_edge_request_observations where vercel_log_id like \'batch-%\''
        ),
        0
      )
      assert.equal(
        await scalar(
          'select sum(observations) as value from ops.daily_operational_traffic'
        ),
        6
      )
    }
  )
  await check(
    'same_request_from_two_log_sources_remains_two_observations',
    async () => {
      await insert('source-edge', {
        request_id: 'shared-synthetic-request'
      })
      await insert('source-static', {
        request_id: 'shared-synthetic-request',
        source: 'static',
        response_bytes: null
      })
      assert.equal(
        await scalar(
          'select sum(observations) as value from ops.daily_operational_traffic'
        ),
        8
      )
      assert.equal(
        await scalar(
          'select sum(response_bytes) as value from ops.daily_operational_traffic'
        ),
        700
      )
    }
  )
  await check(
    'aggregate_is_identifier_free_and_rls_blocks_granted_unprivileged_role',
    async () => {
      const actual = columns
        .parse(
          await sql`select column_name from information_schema.columns where table_schema='ops' and table_name='daily_operational_traffic' order by ordinal_position`
        )
        .map(row => row.column_name)
      assert.deepEqual(actual, [
        'day',
        'project_id',
        'environment',
        'route',
        'source',
        'status_code',
        'observations',
        'response_bytes'
      ])
      await asRole('consent_rls_probe', async connection => {
        assert.equal(
          (
            await connection`select * from ops.daily_operational_traffic`
          ).length,
          0
        )
      })
    }
  )
  await check(
    'oslo_calendar_bucket_uses_earlier_observation_and_ingestion',
    async () => {
      await insert('midnight-oslo', {
        observed_at: new Date('2026-09-01T22:05:00Z'),
        ingested_at: new Date('2026-09-01T22:06:00Z'),
        route_pathname: '/midnight'
      })
      await insert('future-observation', {
        observed_at: new Date('2030-01-01T00:00:00Z'),
        ingested_at: new Date('2026-09-01T22:05:00Z'),
        route_pathname: '/future'
      })
      assert.equal(
        await scalar(
          'select count(*) as value from ops.daily_operational_traffic where route in (\'/midnight\',\'/future\') and day=date \'2026-09-02\''
        ),
        2
      )
    }
  )
  await check(
    'revoked_or_missing_approval_stops_new_aggregation_without_replay',
    async () => {
      const before = await scalar(
        'select sum(observations) as value from ops.daily_operational_traffic'
      )
      await sql`update ops.operational_statistics_control set enabled=false`
      await insert('disabled-again')
      await insert('legacy-after-approval', {
        data_policy: 'legacy',
        fbclid_present: true
      })
      assert.equal(
        await scalar(
          'select sum(observations) as value from ops.daily_operational_traffic'
        ),
        before
      )
      await sql`delete from ops.operational_statistics_control`
      await insert('missing-controller')
      assert.equal(
        await scalar(
          'select sum(observations) as value from ops.daily_operational_traffic'
        ),
        before
      )
      await sql`insert into ops.operational_statistics_control (enabled) values (false)`
      await sql`update ops.operational_statistics_control set enabled=true, approved_at=now(), approved_by='synthetic-reapproval'`
      await insert('after-reapproval')
      assert.equal(
        await scalar(
          'select sum(observations) as value from ops.daily_operational_traffic'
        ),
        before + 1
      )
      await sql`update ops.operational_statistics_control set enabled=false`
    }
  )

  await clearSyntheticObservations()
  await check(
    'seven_day_raw_retention_with_margin_and_time_limited_legal_hold',
    async () => {
      const now = Date.now()
      const hour = 3_600_000
      await insert('old', {
        observed_at: new Date(now - 168 * hour)
      })
      await insert('conservative-margin', {
        observed_at: new Date(now - 167.5 * hour)
      })
      await insert('recent', {
        observed_at: new Date(now - 166.5 * hour)
      })
      await insert('held', {
        observed_at: new Date(now - 200 * hour)
      })
      await insert('expired-hold', {
        observed_at: new Date(now - 200 * hour)
      })
      await insert('future-timestamp-old-ingestion', {
        observed_at: new Date(now + hour),
        ingested_at: new Date(now - 168 * hour)
      })
      await insert('legacy-young', {
        observed_at: new Date(now - 10 * 24 * hour),
        data_policy: 'legacy',
        fbclid_present: true
      })
      await sql`insert into ops.privacy_retention_exceptions (resource_schema, resource_table, resource_key, reason, expires_at) values ('ops','vercel_edge_request_observations','held','Synthetic local legal hold test',now()+interval '1 day')`
      await sql`insert into ops.privacy_retention_exceptions (resource_schema, resource_table, resource_key, reason, created_at, expires_at) values ('ops','vercel_edge_request_observations','expired-hold','Synthetic expired hold test',now()-interval '2 days',now()-interval '1 day')`
      await asRole('service_role', async connection => {
        await connection`select ops.purge_operational_v1()`
      })
      assert.deepEqual(
        (
          await sql`select vercel_log_id from ops.vercel_edge_request_observations order by vercel_log_id`
        ).map(row => row.vercel_log_id),
        ['held', 'legacy-young', 'recent']
      )
    }
  )
  await check(
    'ninety_calendar_days_aggregate_retention',
    async () => {
      await sql`insert into ops.daily_operational_traffic (day,project_id,environment,route,source,status_code,observations,response_bytes) select (now() at time zone 'Europe/Oslo')::date - age, 'synthetic-project', 'preview', '/retention', 'edge', 200, 1, 0 from unnest(array[88,89,90]) age`
      await sql`select ops.purge_operational_v1()`
      assert.equal(
        await scalar(
          'select count(*) as value from ops.daily_operational_traffic where route=\'/retention\''
        ),
        2
      )
    }
  )
  await check(
    'existing_thirty_day_cleanup_preserves_new_policy_and_legal_holds',
    async () => {
      await insert('legacy-expired', {
        observed_at: new Date(Date.now() - 31 * 86400000),
        data_policy: 'legacy'
      })
      await asRole('service_role', async connection => {
        await connection`select ops.purge_expired_landing_observations()`
      })
      assert.deepEqual(
        (
          await sql`select vercel_log_id from ops.vercel_edge_request_observations order by vercel_log_id`
        ).map(row => row.vercel_log_id),
        ['held', 'legacy-young', 'recent']
      )
    }
  )
  await check(
    'named_jobs_exact_and_upsert_does_not_duplicate',
    async () => {
      const [job] =
        await sql`select jobid, schedule, command, username, active from cron.job where jobname='purge_operational_v1'`
      assert.ok(job)
      assert.equal(job.schedule, '35 * * * *')
      assert.equal(
        job.command,
        'select ops.purge_operational_v1();'
      )
      assert.equal(job.username, 'postgres')
      assert.equal(job.active, true)
      await asRole('postgres', async connection => {
        await connection`select cron.schedule('purge_operational_v1','35 * * * *','select ops.purge_operational_v1();')`
      })
      assert.equal(
        await scalar(
          'select count(*) as value from cron.job where jobname=\'purge_operational_v1\''
        ),
        1
      )
    }
  )
  await check(
    'plpgsql_check_real_trigger_and_purge_lint',
    async () => {
      const triggerFindings =
        await sql`select * from extensions.plpgsql_check_function_tb('ops.aggregate_operational_v1_insert()'::regprocedure, 'ops.vercel_edge_request_observations'::regclass)`
      const purgeFindings =
        await sql`select * from extensions.plpgsql_check_function_tb('ops.purge_operational_v1()'::regprocedure)`
      assert.equal(
        triggerFindings.length,
        0,
        JSON.stringify(triggerFindings)
      )
      assert.equal(
        purgeFindings.length,
        0,
        JSON.stringify(purgeFindings)
      )
    }
  )
  await check(
    'real_cron_background_worker_executes_purge_as_postgres',
    async () => {
      await sql`update cron.job set active=false`
      await insert('cron-expired', {
        observed_at: new Date(Date.now() - 9 * 86400000)
      })
      await asRole('postgres', async connection => {
        await connection`select cron.schedule('consent-local-smoke', '1 second', 'select ops.purge_operational_v1();')`
      })
      await sql.unsafe(
        'alter system set cron.launch_active_jobs=\'on\''
      )
      await sql`select pg_reload_conf()`
      let succeeded = false
      try {
        for (let attempt = 0; attempt < 60; attempt++) {
          const runs =
            await sql`select d.status from cron.job_run_details d join cron.job j on j.jobid=d.jobid where j.jobname='consent-local-smoke' and d.username='postgres' order by d.runid desc`
          if (runs.some(run => run.status === 'succeeded')) {
            succeeded = true
            break
          }
          await delay(200)
        }
        assert.equal(
          succeeded,
          true,
          'Real cron run did not succeed within 12 seconds'
        )
        assert.equal(
          await scalar(
            'select count(*) as value from ops.vercel_edge_request_observations where vercel_log_id=\'cron-expired\''
          ),
          0
        )
      } finally {
        await asRole('postgres', async connection => {
          await connection`select cron.unschedule('consent-local-smoke')`
        })
        await sql.unsafe(
          'alter system set cron.launch_active_jobs=\'off\''
        )
        await sql`select pg_reload_conf()`
      }
    }
  )
  await sql`update ops.operational_statistics_control set enabled=false, approved_at=null, approved_by=null`
}

try {
  await main()
} catch (error) {
  checks.push({
    name: 'setup_or_unhandled_failure',
    status: 'failed',
    message:
      error instanceof Error ? error.message : String(error)
  })
} finally {
  await sql.end({ timeout: 5 })
  const report = {
    testedAt: new Date().toISOString(),
    scope: 'isolated_native_postgresql_17_synthetic_data_only',
    productionWrites: false,
    fullSupabaseStack: false,
    sourceHashes,
    checks,
    limitations: [
      'Selected verbatim dependency DDL, not full migration history replay',
      'No PostgREST/JWT or hosted Supabase platform test',
      'pg_cron local source v1.6.8; SQL extension version 1.6.4 matches production read-only snapshot',
      'No production migration or provider delivery evidence'
    ]
  }
  await writeFile(
    `${evidenceDirectory}/${readback ? 'restart-' : ''}report.json`,
    `${JSON.stringify(report, null, 2)}\n`
  )
  console.log(JSON.stringify(report, null, 2))
  process.exitCode =
    checks.some(item => item.status === 'failed') ? 1 : 0
}
