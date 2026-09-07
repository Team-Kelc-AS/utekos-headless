set lock_timeout = '5s';

create table ops.journey_events (
  event_id uuid primary key,
  journey_id uuid not null,
  page_view_id uuid not null,
  previous_page_view_id uuid,
  event_name text not null check (event_name in (
    'utm_landing_page_view', 'page_arrival', 'section_view',
    'internal_link_click', 'journey_progress'
  )),
  occurred_at timestamptz not null,
  received_at timestamptz not null default statement_timestamp(),
  page_path text not null check (length(page_path) between 1 and 256 and page_path !~ '[?#@]'),
  consent jsonb not null check (
    (jsonb_typeof(consent) = 'object'
    and consent ->> 'analytics' = 'granted'
    and consent ->> 'source' = 'cookiebot') is true
  ),
  payload jsonb not null check (jsonb_typeof(payload) = 'object' and octet_length(payload::text) <= 8192),
  payload_sha256 text not null check (payload_sha256 ~ '^[a-f0-9]{64}$'),
  traffic_classification text not null check (traffic_classification in (
    'human_or_unknown', 'synthetic', 'verified_bot', 'automated_bot'
  )),
  environment text not null check (environment in ('development', 'preview', 'production', 'test')),
  deployment_id text,
  commit_sha text,
  constraint journey_events_payload_identity_check check (
    (payload ->> 'event_id' = event_id::text
    and payload ->> 'journey_id' = journey_id::text
    and payload ->> 'page_view_id' = page_view_id::text
    and payload ->> 'event_name' = event_name
    and payload ->> 'source' = 'browser'
    and payload ->> 'page_path' = page_path
    and payload -> 'consent' = consent) is true
  )
);

comment on table ops.journey_events is
  'Private consented browser journey observations. Browser reports and consent declarations are not verified human activity. Commerce stays in marketing.event_ledger; provider delivery stays in ops.provider_dispatch_attempts. No raw URL query, customer/contact, checkout/payment or advertising identifiers.';

create index journey_events_timeline_idx on ops.journey_events (journey_id, occurred_at, event_id);
create index journey_events_retention_idx on ops.journey_events (occurred_at);
create index journey_events_page_idx on ops.journey_events (page_view_id, event_name);

alter table ops.journey_events enable row level security;
alter table ops.journey_events force row level security;
revoke all on table ops.journey_events from public, anon, authenticated, service_role;
grant usage on schema ops to service_role;
grant select, insert on table ops.journey_events to service_role;

create or replace function ops.purge_expired_journey_events()
returns bigint
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_deleted bigint;
begin
  delete from ops.journey_events
  where occurred_at < statement_timestamp() - interval '14 months' + interval '1 hour';
  get diagnostics v_deleted = row_count;
  return v_deleted;
end;
$$;

comment on function ops.purge_expired_journey_events() is
  'Hourly purge with a conservative one-hour margin within the 14-month raw analytics retention limit. No automatic retention exception for journey behavior.';
revoke all on function ops.purge_expired_journey_events() from public, anon, authenticated, service_role;
grant execute on function ops.purge_expired_journey_events() to postgres;

do $schedule_journey_retention$
begin
  if to_regclass('cron.job') is null then
    raise exception using errcode = '55000', message = 'pg_cron is required for journey retention';
  end if;
  perform cron.schedule(
    'purge_expired_journey_events', '17 * * * *',
    'select ops.purge_expired_journey_events();'
  );
end;
$schedule_journey_retention$;
