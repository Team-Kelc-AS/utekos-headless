create table marketing.meta_audience_registry_runs (
  run_id uuid primary key,
  account_id text not null check (account_id ~ '^[0-9]+$'),
  api_version text not null check (api_version = 'v26.0'),
  observed_at timestamptz not null,
  status text not null default 'building' check (status in ('building', 'complete', 'failed')),
  aggregate_report jsonb not null check (jsonb_typeof(aggregate_report) = 'object'),
  created_at timestamptz not null default now()
);

create table marketing.meta_audience_segment_snapshots (
  run_id uuid not null references marketing.meta_audience_registry_runs(run_id),
  segment_key text not null,
  definition text not null,
  planned_label text not null,
  source_manifest jsonb not null check (jsonb_typeof(source_manifest) = 'array'),
  aggregate_counts jsonb not null check (jsonb_typeof(aggregate_counts) = 'object'),
  audience_ids text[] not null,
  primary key (run_id, segment_key)
);

create table marketing.meta_audience_snapshots (
  run_id uuid not null references marketing.meta_audience_registry_runs(run_id),
  audience_id text not null check (audience_id ~ '^[0-9]+$'),
  audience_name text not null,
  subtype text not null,
  labels text[] not null,
  is_value_based boolean,
  customer_file_source text,
  segment_key text,
  source_status text not null,
  metadata jsonb not null check (jsonb_typeof(metadata) = 'object'),
  primary key (run_id, audience_id)
);

create table marketing.meta_audience_upload_batches (
  account_id text not null check (account_id ~ '^[0-9]+$'),
  audience_id text not null check (audience_id ~ '^[0-9]+$'),
  session_id text not null check (session_id ~ '^[0-9]+$'),
  batch_seq integer not null check (batch_seq > 0),
  dataset_hash text not null check (dataset_hash ~ '^[a-f0-9]{64}$'),
  batch_size integer not null check (batch_size between 1 and 9999),
  state text not null check (state in ('prepared', 'in_flight', 'accepted', 'uncertain', 'rejected')),
  receipt_count integer check (receipt_count >= 0),
  invalid_count integer check (invalid_count >= 0),
  last_batch boolean not null,
  observed_at timestamptz not null default now(),
  primary key (account_id, audience_id, session_id, batch_seq)
);

alter table marketing.meta_audience_registry_runs enable row level security;
alter table marketing.meta_audience_segment_snapshots enable row level security;
alter table marketing.meta_audience_snapshots enable row level security;
alter table marketing.meta_audience_upload_batches enable row level security;

revoke all on table marketing.meta_audience_registry_runs from public, anon, authenticated, service_role;
revoke all on table marketing.meta_audience_segment_snapshots from public, anon, authenticated, service_role;
revoke all on table marketing.meta_audience_snapshots from public, anon, authenticated, service_role;
revoke all on table marketing.meta_audience_upload_batches from public, anon, authenticated, service_role;

grant select, insert, update on marketing.meta_audience_registry_runs to service_role;
grant select, insert on marketing.meta_audience_segment_snapshots to service_role;
grant select, insert on marketing.meta_audience_snapshots to service_role;
grant select, insert, update on marketing.meta_audience_upload_batches to service_role;

comment on table marketing.meta_audience_registry_runs is 'Private aggregate audit snapshots. Complete means registry ingestion completed, not audience matching or ad delivery.';
comment on table marketing.meta_audience_snapshots is 'Private audience metadata, lineage and usage. Labels on lookalikes do not establish customer status.';
comment on table marketing.meta_audience_upload_batches is 'Private receipt checkpoints only. Acceptance does not establish processing, matching or delivery. Uncertain requests must be reconciled before retry.';
