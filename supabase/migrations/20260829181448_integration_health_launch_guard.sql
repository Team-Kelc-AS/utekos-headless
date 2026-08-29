-- Production migration version: 20260829181448.
create table if not exists ops.integration_health_snapshots (
  id uuid primary key default gen_random_uuid(),
  run_id uuid not null,
  integration text not null,
  surface text not null,
  status text not null
    check (status in (
      'healthy',
      'degraded',
      'unhealthy',
      'unknown',
      'not_configured'
    )),
  severity text not null
    check (severity in ('critical', 'high', 'medium', 'low', 'info')),
  checked_at timestamptz not null,
  data_freshness_seconds integer
    check (
      data_freshness_seconds is null
      or data_freshness_seconds >= 0
    ),
  traffic_window_seconds integer
    check (
      traffic_window_seconds is null
      or traffic_window_seconds > 0
    ),
  sample_count integer not null default 0
    check (sample_count >= 0),
  error_count integer not null default 0
    check (error_count >= 0 and error_count <= sample_count),
  evidence_level text not null
    check (evidence_level in (
      'configuration',
      'synthetic_probe',
      'internal_ledger',
      'platform_observation',
      'provider_receipt'
    )),
  provider_receipt_status text not null default 'not_checked'
    check (provider_receipt_status in (
      'not_applicable',
      'not_checked',
      'accepted_unverified',
      'verified',
      'rejected'
    )),
  error_fingerprint text,
  result_code text not null,
  safe_action text,
  measurements jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique (run_id, integration, surface),
  check (jsonb_typeof(measurements) = 'object'),
  check (
    safe_action is null
    or safe_action in ('retry_probe_once', 'retry_existing_outbox')
  ),
  check (
    (
      status in ('unhealthy', 'degraded')
      and error_fingerprint is not null
    )
    or (
      status not in ('unhealthy', 'degraded')
      and error_fingerprint is null
    )
  )
);

comment on table ops.integration_health_snapshots is
  'Privacy-free launch-guard measurements. Never store URLs with query strings, request bodies, customer data, free text, click IDs, journey IDs, or credentials.';

create index if not exists integration_health_snapshots_surface_idx
  on ops.integration_health_snapshots (
    integration,
    surface,
    checked_at desc
  );

create index if not exists integration_health_snapshots_run_idx
  on ops.integration_health_snapshots (run_id, checked_at);

create index if not exists integration_health_snapshots_failure_idx
  on ops.integration_health_snapshots (
    error_fingerprint,
    checked_at desc
  )
  where error_fingerprint is not null;

create table if not exists ops.integration_health_incidents (
  id uuid primary key default gen_random_uuid(),
  fingerprint text not null unique,
  integration text not null,
  surface text not null,
  status text not null default 'open'
    check (status in ('open', 'recovered')),
  severity text not null
    check (severity in ('critical', 'high', 'medium', 'low')),
  summary_code text not null,
  observation_count integer not null default 1
    check (observation_count > 0),
  first_observed_at timestamptz not null,
  current_opened_at timestamptz not null,
  last_observed_at timestamptz not null,
  recovered_at timestamptz,
  last_snapshot_id uuid references ops.integration_health_snapshots(id)
    on delete set null,
  alert_state text not null default 'not_required'
    check (alert_state in (
      'not_required',
      'pending',
      'suppressed',
      'sent',
      'failed',
      'recovery_pending',
      'recovery_sent'
    )),
  last_alerted_at timestamptz,
  alert_suppressed_until timestamptz,
  safe_retry_count integer not null default 0
    check (safe_retry_count between 0 and 1),
  evidence jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (
    (status = 'open' and recovered_at is null)
    or (status = 'recovered' and recovered_at is not null)
  )
);

comment on table ops.integration_health_incidents is
  'Deduplicated privacy-free incidents keyed by stable technical fingerprints.';

create index if not exists integration_health_incidents_open_idx
  on ops.integration_health_incidents (
    severity,
    last_observed_at desc
  )
  where status = 'open';

create index if not exists integration_health_incidents_last_snapshot_idx
  on ops.integration_health_incidents (last_snapshot_id)
  where last_snapshot_id is not null;

create table if not exists ops.integration_alert_deliveries (
  id uuid primary key default gen_random_uuid(),
  incident_id uuid not null
    references ops.integration_health_incidents(id) on delete cascade,
  fingerprint text not null,
  idempotency_key text not null unique,
  channel text not null
    check (channel in ('sentry', 'codex', 'twilio_sms')),
  alert_kind text not null
    check (alert_kind in ('incident', 'recovery', 'test')),
  status text not null default 'pending'
    check (status in (
      'pending',
      'sent',
      'delivered',
      'failed',
      'suppressed'
    )),
  provider_receipt_id text,
  failure_code text,
  attempted_at timestamptz,
  acknowledged_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table ops.integration_alert_deliveries is
  'Notification receipts only. Phone numbers, message bodies, URLs, and provider credentials are forbidden.';

create index if not exists integration_alert_deliveries_incident_idx
  on ops.integration_alert_deliveries (
    incident_id,
    created_at desc
  );

create index if not exists integration_alert_deliveries_twilio_test_idx
  on ops.integration_alert_deliveries (created_at desc)
  where channel = 'twilio_sms'
    and alert_kind = 'test'
    and status = 'delivered';

alter table ops.integration_health_snapshots
  enable row level security;
alter table ops.integration_health_snapshots
  force row level security;
alter table ops.integration_health_incidents
  enable row level security;
alter table ops.integration_health_incidents
  force row level security;
alter table ops.integration_alert_deliveries
  enable row level security;
alter table ops.integration_alert_deliveries
  force row level security;

revoke all on table ops.integration_health_snapshots
  from public, anon, authenticated, service_role;
revoke all on table ops.integration_health_incidents
  from public, anon, authenticated, service_role;
revoke all on table ops.integration_alert_deliveries
  from public, anon, authenticated, service_role;

grant usage on schema ops to service_role;
grant select, insert, update, delete
  on table ops.integration_health_snapshots to service_role;
grant select, insert, update, delete
  on table ops.integration_health_incidents to service_role;
grant select, insert, update, delete
  on table ops.integration_alert_deliveries to service_role;
