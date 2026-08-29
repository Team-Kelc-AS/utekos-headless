import 'server-only'

import { createHash } from 'node:crypto'
import postgres from 'postgres'
import type { IntegrationHealthSnapshot } from './integrationHealthSnapshot'

type QueryRow = Record<string, unknown>

export type IntegrationHealthQueryExecutor = (
  query: string,
  parameters: readonly unknown[]
) => Promise<QueryRow[]>

export type IntegrationHealthIncident = Readonly<{
  currentOpenedAt: string
  fingerprint: string
  id: string
  integration: string
  lastAlertedAt: string | null
  observationCount: number
  recentFailureCount: number
  severity: 'critical' | 'high' | 'medium' | 'low'
  summaryCode: string
  surface: string
}>

export type IntegrationHealthRecovery = Readonly<{
  currentOpenedAt: string
  fingerprint: string
  id: string
  integration: string
  severity: 'critical' | 'high' | 'medium' | 'low'
  surface: string
  wasSentrySent: boolean
  wasTwilioSent: boolean
}>

type AlertChannel = 'sentry' | 'codex' | 'twilio_sms'
type AlertKind = 'incident' | 'recovery' | 'test'

let integrationHealthSql: ReturnType<typeof postgres> | undefined

function getIntegrationHealthSql() {
  const connectionString =
    process.env.SUPABASE_VERCEL_POSTGRES_URL ??
    process.env.SUPABASE_VERCEL_POSTGRES_URL_NON_POOLING

  if (!connectionString) {
    throw new Error('launch_guard_database_not_configured')
  }

  integrationHealthSql ??= postgres(connectionString, {
    connect_timeout: 10,
    idle_timeout: 20,
    max: 1,
    max_lifetime: 60 * 30,
    prepare: false
  })

  return integrationHealthSql
}

const executePostgresQuery: IntegrationHealthQueryExecutor =
  async (
    query: string,
    parameters: readonly unknown[]
  ) => {
    const sql = getIntegrationHealthSql()
    const postgresParameters = parameters as Parameters<
      typeof sql.unsafe
    >[1]

    return sql.unsafe<QueryRow[]>(query, postgresParameters)
  }

const UPSERT_SNAPSHOTS_QUERY = `
  /* launch_guard:upsert_snapshots */
  insert into ops.integration_health_snapshots (
    run_id,
    integration,
    surface,
    status,
    severity,
    checked_at,
    data_freshness_seconds,
    traffic_window_seconds,
    sample_count,
    error_count,
    evidence_level,
    provider_receipt_status,
    error_fingerprint,
    result_code,
    safe_action,
    measurements
  )
  select
    snapshot.run_id,
    snapshot.integration,
    snapshot.surface,
    snapshot.status,
    snapshot.severity,
    snapshot.checked_at,
    snapshot.data_freshness_seconds,
    snapshot.traffic_window_seconds,
    snapshot.sample_count,
    snapshot.error_count,
    snapshot.evidence_level,
    snapshot.provider_receipt_status,
    snapshot.error_fingerprint,
    snapshot.result_code,
    snapshot.safe_action,
    snapshot.measurements
  -- postgres.js binds the serialized JSON text as a JSON string scalar.
  -- Extract its text value before parsing so recordset always receives the
  -- original top-level array.
  from jsonb_to_recordset(
    ($1::jsonb #>> '{}'::text[])::jsonb
  ) as snapshot(
    run_id uuid,
    integration text,
    surface text,
    status text,
    severity text,
    checked_at timestamptz,
    data_freshness_seconds integer,
    traffic_window_seconds integer,
    sample_count integer,
    error_count integer,
    evidence_level text,
    provider_receipt_status text,
    error_fingerprint text,
    result_code text,
    safe_action text,
    measurements jsonb
  )
  on conflict (run_id, integration, surface) do update set
    status = excluded.status,
    severity = excluded.severity,
    checked_at = excluded.checked_at,
    data_freshness_seconds = excluded.data_freshness_seconds,
    traffic_window_seconds = excluded.traffic_window_seconds,
    sample_count = excluded.sample_count,
    error_count = excluded.error_count,
    evidence_level = excluded.evidence_level,
    provider_receipt_status = excluded.provider_receipt_status,
    error_fingerprint = excluded.error_fingerprint,
    result_code = excluded.result_code,
    safe_action = excluded.safe_action,
    measurements = excluded.measurements
`

const UPSERT_INCIDENTS_QUERY = `
  /* launch_guard:upsert_incidents */
  insert into ops.integration_health_incidents (
    fingerprint,
    integration,
    surface,
    status,
    severity,
    summary_code,
    first_observed_at,
    current_opened_at,
    last_observed_at,
    last_snapshot_id,
    alert_state,
    evidence
  )
  select
    snapshot.error_fingerprint,
    snapshot.integration,
    snapshot.surface,
    'open',
    snapshot.severity,
    snapshot.result_code,
    snapshot.checked_at,
    snapshot.checked_at,
    snapshot.checked_at,
    snapshot.id,
    'not_required',
    jsonb_build_object(
      'sample_count', snapshot.sample_count,
      'error_count', snapshot.error_count,
      'evidence_level', snapshot.evidence_level,
      'provider_receipt_status', snapshot.provider_receipt_status
    )
  from ops.integration_health_snapshots snapshot
  where snapshot.run_id = $1::uuid
    and snapshot.status in ('degraded', 'unhealthy')
  on conflict (fingerprint) do update set
    integration = excluded.integration,
    surface = excluded.surface,
    status = 'open',
    severity = excluded.severity,
    summary_code = excluded.summary_code,
    observation_count = case
      when ops.integration_health_incidents.status = 'recovered'
        then 1
      when ops.integration_health_incidents.last_snapshot_id =
        excluded.last_snapshot_id
        then ops.integration_health_incidents.observation_count
      else ops.integration_health_incidents.observation_count + 1
    end,
    current_opened_at = case
      when ops.integration_health_incidents.status = 'recovered'
        then excluded.current_opened_at
      else ops.integration_health_incidents.current_opened_at
    end,
    last_observed_at = excluded.last_observed_at,
    recovered_at = null,
    last_snapshot_id = excluded.last_snapshot_id,
    alert_state = case
      when ops.integration_health_incidents.status = 'recovered'
        then 'not_required'
      else ops.integration_health_incidents.alert_state
    end,
    last_alerted_at = case
      when ops.integration_health_incidents.status = 'recovered'
        then null
      else ops.integration_health_incidents.last_alerted_at
    end,
    alert_suppressed_until = case
      when ops.integration_health_incidents.status = 'recovered'
        then null
      else ops.integration_health_incidents.alert_suppressed_until
    end,
    safe_retry_count = case
      when ops.integration_health_incidents.status = 'recovered'
        then 0
      else ops.integration_health_incidents.safe_retry_count
    end,
    evidence = excluded.evidence,
    updated_at = now()
`

const RECOVER_INCIDENTS_QUERY = `
  /* launch_guard:recover_incidents */
  update ops.integration_health_incidents incident
  set
    status = 'recovered',
    recovered_at = $2::timestamptz,
    alert_state = case
      when incident.last_alerted_at is null then 'not_required'
      else 'recovery_pending'
    end,
    updated_at = now()
  where incident.status = 'open'
    and exists (
      select 1
      from ops.integration_health_snapshots healthy
      where healthy.run_id = $1::uuid
        and healthy.integration = incident.integration
        and healthy.surface = incident.surface
        and healthy.status = 'healthy'
    )
    and not exists (
      select 1
      from ops.integration_health_snapshots failed
      where failed.run_id = $1::uuid
        and failed.error_fingerprint = incident.fingerprint
        and failed.status in ('degraded', 'unhealthy')
    )
  returning
    incident.id::text,
    incident.fingerprint,
    incident.integration,
    incident.surface,
    incident.severity,
    incident.current_opened_at::text,
    exists (
      select 1
      from ops.integration_alert_deliveries delivery
      where delivery.incident_id = incident.id
        and delivery.channel = 'sentry'
        and delivery.alert_kind = 'incident'
        and delivery.status in ('sent', 'delivered')
    ) as was_sentry_sent,
    exists (
      select 1
      from ops.integration_alert_deliveries delivery
      where delivery.incident_id = incident.id
        and delivery.channel = 'twilio_sms'
        and delivery.alert_kind = 'incident'
        and delivery.status in ('sent', 'delivered')
    ) as was_twilio_sent
`

const READ_CURRENT_INCIDENTS_QUERY = `
  /* launch_guard:read_current_incidents */
  select
    incident.id::text,
    incident.fingerprint,
    incident.integration,
    incident.surface,
    incident.severity,
    incident.summary_code,
    incident.observation_count,
    incident.current_opened_at::text,
    incident.last_alerted_at::text,
    (
      select count(*)::integer
      from ops.integration_health_snapshots recent
      where recent.error_fingerprint = incident.fingerprint
        and recent.checked_at >= $2::timestamptz - interval '5 minutes'
        and recent.checked_at <= $2::timestamptz
    ) as recent_failure_count
  from ops.integration_health_incidents incident
  inner join ops.integration_health_snapshots latest
    on latest.id = incident.last_snapshot_id
  where incident.status = 'open'
    and latest.run_id = $1::uuid
`

const RESERVE_DELIVERY_QUERY = `
  /* launch_guard:reserve_delivery */
  with eligible as (
    update ops.integration_health_incidents incident
    set
      alert_state = case
        when $4::text = 'recovery' then 'recovery_pending'
        else 'pending'
      end,
      last_alerted_at = $5::timestamptz,
      alert_suppressed_until = $5::timestamptz + interval '1 hour',
      updated_at = now()
    where incident.id = $1::uuid
      and (
        $4::text = 'recovery'
        or incident.last_alerted_at = $5::timestamptz
        or incident.alert_suppressed_until is null
        or incident.alert_suppressed_until <= $5::timestamptz
      )
    returning incident.id
  ), inserted as (
    insert into ops.integration_alert_deliveries (
      incident_id,
      fingerprint,
      idempotency_key,
      channel,
      alert_kind,
      status,
      attempted_at
    )
    select
      eligible.id,
      $2::text,
      $3::text,
      $6::text,
      $4::text,
      'pending',
      $5::timestamptz
    from eligible
    on conflict (idempotency_key) do nothing
    returning id::text
  )
  select id from inserted
`

const UPDATE_DELIVERY_QUERY = `
  /* launch_guard:update_delivery */
  update ops.integration_alert_deliveries
  set
    status = $2::text,
    provider_receipt_id = $3::text,
    failure_code = $4::text,
    acknowledged_at = case
      when $2::text = 'delivered' then $5::timestamptz
      else acknowledged_at
    end,
    updated_at = now()
  where id = $1::uuid
`

const UPDATE_TWILIO_DELIVERY_QUERY = `
  /* launch_guard:update_twilio_delivery */
  update ops.integration_alert_deliveries
  set
    status = $3::text,
    failure_code = $4::text,
    acknowledged_at = case
      when $3::text = 'delivered' then $5::timestamptz
      else acknowledged_at
    end,
    updated_at = now()
  where id = $1::uuid
    and channel = 'twilio_sms'
    and provider_receipt_id = $2::text
  returning id::text
`

const READ_TWILIO_TEST_RECEIPT_QUERY = `
  /* launch_guard:read_twilio_test_receipt */
  select exists (
    select 1
    from ops.integration_alert_deliveries
    where channel = 'twilio_sms'
      and alert_kind = 'test'
      and status = 'delivered'
  ) as delivered
`

const ENSURE_TWILIO_TEST_INCIDENT_QUERY = `
  /* launch_guard:ensure_twilio_test_incident */
  insert into ops.integration_health_incidents (
    fingerprint,
    integration,
    surface,
    status,
    severity,
    summary_code,
    first_observed_at,
    current_opened_at,
    last_observed_at,
    alert_state,
    evidence
  ) values (
    'twilio:controlled_delivery_test',
    'twilio',
    'critical_sms',
    'open',
    'low',
    'controlled_delivery_test',
    $1::timestamptz,
    $1::timestamptz,
    $1::timestamptz,
    'not_required',
    '{"contains_customer_data":false}'::jsonb
  )
  on conflict (fingerprint) do update set
    status = 'open',
    summary_code = excluded.summary_code,
    current_opened_at = excluded.current_opened_at,
    last_observed_at = excluded.last_observed_at,
    recovered_at = null,
    alert_state = 'not_required',
    alert_suppressed_until = null,
    updated_at = now()
  returning id::text, current_opened_at::text
`

function stringField(row: QueryRow, field: string) {
  const value = row[field]
  if (typeof value !== 'string' || !value) {
    throw new Error(`invalid_launch_guard_${field}`)
  }
  return value
}

function nullableString(row: QueryRow, field: string) {
  const value = row[field]
  return typeof value === 'string' && value ? value : null
}

function numberField(row: QueryRow, field: string) {
  const value = Number(row[field])
  if (!Number.isInteger(value) || value < 0) {
    throw new Error(`invalid_launch_guard_${field}`)
  }
  return value
}

function severityField(row: QueryRow) {
  const severity = stringField(row, 'severity')
  if (!['critical', 'high', 'medium', 'low'].includes(severity)) {
    throw new Error('invalid_launch_guard_severity')
  }
  return severity as IntegrationHealthIncident['severity']
}

function serializeSnapshots(
  snapshots: readonly IntegrationHealthSnapshot[]
) {
  return JSON.stringify(
    snapshots.map(snapshot => ({
      run_id: snapshot.runId,
      integration: snapshot.integration,
      surface: snapshot.surface,
      status: snapshot.status,
      severity: snapshot.severity,
      checked_at: snapshot.checkedAt,
      data_freshness_seconds:
        snapshot.dataFreshnessSeconds ?? null,
      traffic_window_seconds:
        snapshot.trafficWindowSeconds ?? null,
      sample_count: snapshot.sampleCount,
      error_count: snapshot.errorCount,
      evidence_level: snapshot.evidenceLevel,
      provider_receipt_status: snapshot.providerReceiptStatus,
      error_fingerprint: snapshot.errorFingerprint ?? null,
      result_code: snapshot.resultCode,
      safe_action: snapshot.safeAction ?? null,
      measurements: snapshot.measurements
    }))
  )
}

function deliveryIdempotencyKey(input: {
  channel: AlertChannel
  currentOpenedAt: string
  fingerprint: string
  kind: AlertKind
}) {
  return createHash('sha256')
    .update(
      [
        input.fingerprint,
        input.currentOpenedAt,
        input.kind,
        input.channel
      ].join(':')
    )
    .digest('hex')
}

export function createPostgresIntegrationHealthStore(
  executeQuery: IntegrationHealthQueryExecutor = executePostgresQuery
) {
  return {
    async persistAndReconcile(
      snapshots: readonly IntegrationHealthSnapshot[],
      now: Date
    ) {
      if (snapshots.length === 0) {
        return { incidents: [], recoveries: [] }
      }

      const runId = snapshots[0]?.runId
      if (!runId || snapshots.some(snapshot => snapshot.runId !== runId)) {
        throw new Error('launch_guard_run_id_mismatch')
      }

      await executeQuery(UPSERT_SNAPSHOTS_QUERY, [
        serializeSnapshots(snapshots)
      ])
      await executeQuery(UPSERT_INCIDENTS_QUERY, [runId])
      const recoveryRows = await executeQuery(
        RECOVER_INCIDENTS_QUERY,
        [runId, now.toISOString()]
      )
      const incidentRows = await executeQuery(
        READ_CURRENT_INCIDENTS_QUERY,
        [runId, now.toISOString()]
      )

      const incidents = incidentRows.map(
        (row): IntegrationHealthIncident => ({
          currentOpenedAt: stringField(row, 'current_opened_at'),
          fingerprint: stringField(row, 'fingerprint'),
          id: stringField(row, 'id'),
          integration: stringField(row, 'integration'),
          lastAlertedAt: nullableString(row, 'last_alerted_at'),
          observationCount: numberField(row, 'observation_count'),
          recentFailureCount: numberField(
            row,
            'recent_failure_count'
          ),
          severity: severityField(row),
          summaryCode: stringField(row, 'summary_code'),
          surface: stringField(row, 'surface')
        })
      )
      const recoveries = recoveryRows.map(
        (row): IntegrationHealthRecovery => ({
          currentOpenedAt: stringField(row, 'current_opened_at'),
          fingerprint: stringField(row, 'fingerprint'),
          id: stringField(row, 'id'),
          integration: stringField(row, 'integration'),
          severity: severityField(row),
          surface: stringField(row, 'surface'),
          wasSentrySent: row.was_sentry_sent === true,
          wasTwilioSent: row.was_twilio_sent === true
        })
      )

      return { incidents, recoveries }
    },

    async reserveDelivery(input: {
      channel: AlertChannel
      currentOpenedAt: string
      fingerprint: string
      incidentId: string
      kind: AlertKind
      now: Date
    }) {
      const rows = await executeQuery(RESERVE_DELIVERY_QUERY, [
        input.incidentId,
        input.fingerprint,
        deliveryIdempotencyKey(input),
        input.kind,
        input.now.toISOString(),
        input.channel
      ])

      return rows[0] ? stringField(rows[0], 'id') : null
    },

    async updateDelivery(input: {
      deliveryId: string
      failureCode?: string
      now: Date
      providerReceiptId?: string
      status: 'sent' | 'delivered' | 'failed' | 'suppressed'
    }) {
      await executeQuery(UPDATE_DELIVERY_QUERY, [
        input.deliveryId,
        input.status,
        input.providerReceiptId ?? null,
        input.failureCode ?? null,
        input.now.toISOString()
      ])
    },

    async updateTwilioDelivery(input: {
      deliveryId: string
      failureCode?: string
      messageSid: string
      now: Date
      status: 'sent' | 'delivered' | 'failed'
    }) {
      const rows = await executeQuery(
        UPDATE_TWILIO_DELIVERY_QUERY,
        [
          input.deliveryId,
          input.messageSid,
          input.status,
          input.failureCode ?? null,
          input.now.toISOString()
        ]
      )
      return rows.length === 1
    },

    async hasDeliveredTwilioTest() {
      const rows = await executeQuery(
        READ_TWILIO_TEST_RECEIPT_QUERY,
        []
      )
      return rows[0]?.delivered === true
    },

    async ensureTwilioTestIncident(now: Date) {
      const rows = await executeQuery(
        ENSURE_TWILIO_TEST_INCIDENT_QUERY,
        [now.toISOString()]
      )
      const row = rows[0]
      if (!row) {
        throw new Error('launch_guard_twilio_test_incident_missing')
      }

      return {
        currentOpenedAt: stringField(row, 'current_opened_at'),
        fingerprint: 'twilio:controlled_delivery_test',
        id: stringField(row, 'id')
      }
    }
  }
}

export const postgresIntegrationHealthStore =
  createPostgresIntegrationHealthStore()
