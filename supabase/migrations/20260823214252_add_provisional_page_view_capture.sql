set lock_timeout = '5s';

create table if not exists marketing.provisional_page_view_captures (
  event_id uuid primary key,
  page_view_id uuid not null,
  edge_request_id uuid,
  capture_state text not null
    check (capture_state in ('pending', 'denied', 'granted')),
  payload jsonb not null,
  occurred_at timestamptz not null,
  capture_count integer not null default 1
    check (capture_count >= 1),
  captured_at timestamptz not null default statement_timestamp(),
  updated_at timestamptz not null default statement_timestamp(),
  expires_at timestamptz not null
    default (statement_timestamp() + interval '24 hours'),
  constraint provisional_page_view_captures_payload_identity_check
    check (
      payload ->> 'event_name' = 'page_view'
      and payload ->> 'event_id' = event_id::text
      and payload ->> 'page_view_id' = page_view_id::text
      and (
        edge_request_id is null
        or payload ->> 'edge_request_id' = edge_request_id::text
      )
    ),
  constraint provisional_page_view_captures_retention_check
    check (
      updated_at >= captured_at
      and expires_at > updated_at
      and expires_at <= updated_at + interval '24 hours 5 minutes'
    )
);

comment on table marketing.provisional_page_view_captures is
  'Server-only, 24-hour consent buffer for canonical page_view capture. It may temporarily contain source URLs and advertising click identifiers, but it never creates provider dispatch attempts and is deleted immediately after canonical consented acceptance.';
comment on column marketing.provisional_page_view_captures.capture_state is
  'Cookiebot decision state observed by the browser. pending and denied rows remain provider-ineligible; granted rows are released after canonical acceptance.';

create index if not exists provisional_page_view_captures_state_idx
  on marketing.provisional_page_view_captures (
    capture_state,
    captured_at desc
  );
create index if not exists provisional_page_view_captures_edge_idx
  on marketing.provisional_page_view_captures (
    edge_request_id,
    occurred_at desc
  )
  where edge_request_id is not null;
create index if not exists provisional_page_view_captures_expiry_idx
  on marketing.provisional_page_view_captures (expires_at);

alter table marketing.provisional_page_view_captures
  enable row level security;
alter table marketing.provisional_page_view_captures
  force row level security;
revoke all on table marketing.provisional_page_view_captures
  from public, anon, authenticated, service_role;
grant usage on schema marketing to service_role;
grant select, insert, update, delete
  on table marketing.provisional_page_view_captures
  to service_role;

create or replace function ops.purge_expired_provisional_page_view_captures()
returns bigint
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_deleted bigint := 0;
  v_now timestamptz := statement_timestamp();
begin
  delete from marketing.provisional_page_view_captures capture
  where capture.expires_at <= v_now
    and not ops.has_active_privacy_retention_exception(
      'marketing',
      'provisional_page_view_captures',
      capture.event_id::text,
      v_now
    );

  get diagnostics v_deleted = row_count;
  return v_deleted;
end;
$$;

comment on function ops.purge_expired_provisional_page_view_captures() is
  'Deletes short-lived consent-buffer page views after at most 24 hours unless a time-limited privacy retention exception is active.';

revoke all on function ops.purge_expired_provisional_page_view_captures()
  from public;
revoke execute on function ops.purge_expired_provisional_page_view_captures()
  from public, anon, authenticated;
grant execute on function ops.purge_expired_provisional_page_view_captures()
  to service_role, postgres;

do $schedule_provisional_page_view_capture_purge$
declare
  v_job_exists boolean;
begin
  if to_regclass('cron.job') is null then
    raise exception using
      errcode = '55000',
      message = 'pg_cron cron.job is required for provisional page_view retention';
  end if;

  execute $query$
    select exists (
      select 1
      from cron.job
      where jobname = 'purge_expired_provisional_page_view_captures'
    )
  $query$ into v_job_exists;

  if not v_job_exists then
    perform cron.schedule(
      'purge_expired_provisional_page_view_captures',
      '*/15 * * * *',
      'select ops.purge_expired_provisional_page_view_captures();'
    );
  end if;
end;
$schedule_provisional_page_view_capture_purge$;
