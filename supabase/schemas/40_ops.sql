create table if not exists ops.integration_events (
  id uuid primary key default gen_random_uuid(),

  provider text not null,
  event_type text not null,

  status text not null default 'pending',
  payload jsonb not null default '{}'::jsonb,
  error_message text,

  created_at timestamptz not null default now(),
  processed_at timestamptz
);

create index if not exists integration_events_status_idx
  on ops.integration_events (status, created_at);

create index if not exists integration_events_provider_idx
  on ops.integration_events (provider, created_at desc);

create table if not exists ops.provider_dispatch_attempts (
  id uuid primary key default gen_random_uuid(),

  idempotency_key text not null,
  provider text not null,
  event_id text,
  event_name text,
  payload jsonb not null default '{}'::jsonb,
  payload_summary jsonb not null default '{}'::jsonb,

  status text not null default 'pending'
    check (status in ('pending', 'processing', 'succeeded', 'accepted_unverified', 'retry_scheduled', 'failed', 'dead_lettered', 'skipped_unqualified')),
  attempt_count integer not null default 0
    check (attempt_count >= 0),
  next_attempt_at timestamptz,
  last_error text,
  response jsonb not null default '{}'::jsonb,
  request_id text,
  http_status integer
    check (http_status is null or http_status between 100 and 599),
  validation_result jsonb not null default '{}'::jsonb,
  response_semantics text,
  consent_basis jsonb not null default '{}'::jsonb,
  data_quality jsonb not null default '{}'::jsonb,
  dispatch_mode text not null default 'server_retry'
    check (dispatch_mode in ('server_retry', 'server_direct', 'client_observed')),
  skip_reason text,
  last_attempt_started_at timestamptz,
  latency_ms integer
    check (latency_ms is null or latency_ms >= 0),

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  processed_at timestamptz,

  unique (provider, idempotency_key)
);

create index if not exists provider_dispatch_attempts_queue_idx
  on ops.provider_dispatch_attempts (status, next_attempt_at, created_at)
  where status in ('pending', 'retry_scheduled');

create index if not exists provider_dispatch_attempts_event_idx
  on ops.provider_dispatch_attempts (event_id, provider)
  where event_id is not null;

create index if not exists provider_dispatch_attempts_provider_status_idx
  on ops.provider_dispatch_attempts (provider, status, updated_at desc);

create index if not exists provider_dispatch_attempts_skipped_idx
  on ops.provider_dispatch_attempts (provider, skip_reason, updated_at desc)
  where status = 'skipped_unqualified';

create table if not exists ops.slo_incidents (
  id uuid primary key default gen_random_uuid(),

  incident_key text not null unique,
  severity text not null
    check (severity in ('critical', 'high', 'medium', 'low')),
  workload text not null,
  status text not null default 'open'
    check (status in ('open', 'investigating', 'mitigated', 'resolved')),
  description text not null,
  metadata jsonb not null default '{}'::jsonb,

  opened_at timestamptz not null default now(),
  resolved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists slo_incidents_status_idx
  on ops.slo_incidents (status, severity, opened_at desc);

create table if not exists ops.dead_letter_events (
  id uuid primary key default gen_random_uuid(),

  source text not null,
  reason text not null,
  payload jsonb not null default '{}'::jsonb,
  metadata jsonb not null default '{}'::jsonb,
  resolution_code text,
  resolution_note text,
  resolved_by text,

  created_at timestamptz not null default now(),
  resolved_at timestamptz
);

create index if not exists dead_letter_events_unresolved_idx
  on ops.dead_letter_events (created_at)
  where resolved_at is null;

create table if not exists ops.web_vitals (
  id uuid primary key default gen_random_uuid(),

  metric_id text not null,
  name text not null,
  value double precision not null,
  delta double precision,
  rating text
    check (rating in ('good', 'needs-improvement', 'poor')),
  pathname text,
  href text,
  referrer text,
  navigation_type text,
  attribution jsonb,
  entries jsonb not null default '[]'::jsonb,
  reported_at timestamptz not null,

  created_at timestamptz not null default now()
);

create index if not exists web_vitals_name_reported_at_idx
  on ops.web_vitals (name, reported_at desc);

create index if not exists web_vitals_pathname_reported_at_idx
  on ops.web_vitals (pathname, reported_at desc)
  where pathname is not null;

create table if not exists ops.integration_job_leases (
  job_name text primary key,
  lease_owner text not null,
  acquired_at timestamptz not null default now(),
  expires_at timestamptz not null,
  updated_at timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb
);

create index if not exists integration_job_leases_expires_at_idx
  on ops.integration_job_leases (expires_at);

create or replace view ops.provider_dispatch_health
with (security_invoker = true)
as
select
  provider,
  status,
  dispatch_mode,
  skip_reason,
  count(*)::bigint as row_count,
  max(updated_at) as last_updated_at,
  max(processed_at) as last_processed_at
from ops.provider_dispatch_attempts
group by provider, status, dispatch_mode, skip_reason;

create or replace view ops.dead_letter_summary
with (security_invoker = true)
as
select
  source,
  reason,
  count(*) filter (where resolved_at is null)::bigint as unresolved_count,
  count(*)::bigint as total_count,
  max(created_at) as latest_created_at,
  max(resolved_at) as latest_resolved_at
from ops.dead_letter_events
group by source, reason;

create table if not exists ops.vercel_edge_request_observations (
  vercel_log_id text primary key,
  edge_request_id uuid,
  deployment_id text not null,
  project_id text not null,
  environment text not null
    check (environment in ('production', 'preview')),
  observed_at timestamptz not null,
  observation_type text not null
    check (observation_type in ('document', 'redirect')),
  request_id text,
  trace_id text,
  vercel_id text,
  route_pathname text not null,
  host text not null,
  method text not null
    check (method in ('GET', 'HEAD')),
  source text not null
    check (source in ('edge', 'lambda', 'static', 'external', 'firewall', 'redirect')),
  status_code integer not null
    check (status_code = -1 or status_code between 100 and 599),
  cache_status text
    check (
      cache_status is null
      or cache_status in ('MISS', 'HIT', 'STALE', 'BYPASS', 'PRERENDER', 'REVALIDATED')
    ),
  waf_action text
    check (
      waf_action is null
      or waf_action in ('log', 'challenge', 'deny', 'bypass', 'rate_limit')
    ),
  path_type text
    check (
      path_type is null
      or path_type in (
        'func',
        'prerender',
        'edge',
        'middleware',
        'streaming_func',
        'partial_prerender',
        'external',
        'static',
        'not_found',
        'unknown'
      )
    ),
  path_type_variant text,
  edge_region text not null,
  execution_region text,
  lambda_region text,
  response_bytes bigint
    check (response_bytes is null or response_bytes >= 0),
  referrer_host text,
  in_app_browser text not null
    check (in_app_browser in ('facebook', 'instagram', 'none', 'unknown')),
  device_class text not null
    check (device_class in ('mobile', 'tablet', 'desktop', 'bot', 'unknown')),
  os_class text not null
    check (os_class in ('ios', 'android', 'macos', 'windows', 'linux', 'other', 'unknown')),
  automation_class text not null
    check (
      automation_class in (
        'known_bot_user_agent',
        'synthetic_client',
        'browser_automation',
        'human_or_unknown'
      )
    ),
  fbclid_present boolean not null,
  fbclid_hmac text
    check (fbclid_hmac is null or fbclid_hmac ~ '^[0-9a-f]{64}$'),
  utm_source text,
  utm_medium text,
  utm_campaign text,
  utm_content text,
  utm_term text,
  meta_campaign_id text
    check (meta_campaign_id is null or meta_campaign_id ~ '^\d{5,32}$'),
  meta_adset_id text
    check (meta_adset_id is null or meta_adset_id ~ '^\d{5,32}$'),
  meta_ad_id text
    check (meta_ad_id is null or meta_ad_id ~ '^\d{5,32}$'),
  meta_placement text,
  meta_site_source_name text,
  ingested_at timestamptz not null default statement_timestamp(),
  constraint vercel_edge_request_observations_log_id_length_check
    check (length(vercel_log_id) between 1 and 256),
  constraint vercel_edge_request_observations_deployment_id_length_check
    check (length(deployment_id) between 1 and 256),
  constraint vercel_edge_request_observations_project_id_length_check
    check (length(project_id) between 1 and 256),
  constraint vercel_edge_request_observations_trace_id_check
    check (trace_id is null or trace_id ~ '^[0-9a-f]{32}$'),
  constraint vercel_edge_request_observations_route_pathname_check
    check (
      length(route_pathname) between 1 and 2048
      and left(route_pathname, 1) = '/'
      and position('?' in route_pathname) = 0
      and position('#' in route_pathname) = 0
    ),
  constraint vercel_edge_request_observations_host_check
    check (length(host) between 1 and 253 and host = lower(host) and position(':' in host) = 0),
  constraint vercel_edge_request_observations_marketing_lengths_check
    check (
      length(coalesce(utm_source, '')) <= 128
      and length(coalesce(utm_medium, '')) <= 128
      and length(coalesce(utm_campaign, '')) <= 128
      and length(coalesce(utm_content, '')) <= 128
      and length(coalesce(utm_term, '')) <= 128
      and length(coalesce(meta_placement, '')) <= 64
      and length(coalesce(meta_site_source_name, '')) <= 32
    )
);

comment on table ops.vercel_edge_request_observations is
  'Thirty-day, privacy-bounded document and redirect observations from a signed Vercel Log Drain. Raw query strings, fbclid values, IP addresses, user agents and arbitrary log messages are forbidden.';

create index if not exists vercel_edge_request_observations_observed_at_idx
  on ops.vercel_edge_request_observations (observed_at desc);
create index if not exists vercel_edge_request_observations_route_idx
  on ops.vercel_edge_request_observations (route_pathname, observed_at desc);
create index if not exists vercel_edge_request_observations_deployment_idx
  on ops.vercel_edge_request_observations (deployment_id, observed_at desc);
create index if not exists vercel_edge_request_observations_status_idx
  on ops.vercel_edge_request_observations (status_code, observed_at desc);
create index if not exists vercel_edge_request_observations_edge_request_idx
  on ops.vercel_edge_request_observations (edge_request_id)
  where edge_request_id is not null;
create index if not exists vercel_edge_request_observations_request_idx
  on ops.vercel_edge_request_observations (request_id, observed_at)
  where request_id is not null;
create index if not exists vercel_edge_request_observations_vercel_id_idx
  on ops.vercel_edge_request_observations (vercel_id, observed_at)
  where vercel_id is not null;
create index if not exists vercel_edge_request_observations_trace_idx
  on ops.vercel_edge_request_observations (trace_id)
  where trace_id is not null;
create index if not exists vercel_edge_request_observations_meta_ad_idx
  on ops.vercel_edge_request_observations (meta_ad_id, observed_at desc)
  where meta_ad_id is not null;
create index if not exists vercel_edge_request_observations_fbclid_idx
  on ops.vercel_edge_request_observations (fbclid_present, observed_at desc);

create table if not exists ops.vercel_trace_observations (
  trace_id text primary key,
  deployment_id text not null,
  project_id text not null,
  environment text not null
    check (environment = 'production'),
  observed_at timestamptz not null,
  start_time_unix_nano numeric(20, 0) not null,
  end_time_unix_nano numeric(20, 0) not null,
  duration_ms numeric(20, 6) not null,
  span_count integer not null
    check (span_count between 1 and 1000),
  ingested_at timestamptz not null default statement_timestamp(),
  updated_at timestamptz not null default statement_timestamp(),
  constraint vercel_trace_observations_trace_id_check
    check (trace_id ~ '^[0-9a-f]{32}$'),
  constraint vercel_trace_observations_deployment_id_length_check
    check (length(deployment_id) between 1 and 256),
  constraint vercel_trace_observations_project_id_length_check
    check (length(project_id) between 1 and 256),
  constraint vercel_trace_observations_time_check
    check (
      start_time_unix_nano >= 0
      and end_time_unix_nano >= start_time_unix_nano
      and duration_ms = (end_time_unix_nano - start_time_unix_nano) / 1000000
    )
);

comment on table ops.vercel_trace_observations is
  'Thirty-day, privacy-bounded Vercel OTLP trace envelopes. Span names, span ids, attributes and raw request data are forbidden.';
comment on column ops.vercel_trace_observations.duration_ms is
  'Server trace-envelope duration from the earliest span start to latest span end; not browser TTFB or page-load duration.';

create index if not exists vercel_trace_observations_observed_at_idx
  on ops.vercel_trace_observations (observed_at desc);
create index if not exists vercel_trace_observations_deployment_idx
  on ops.vercel_trace_observations (deployment_id, observed_at desc);

create table if not exists ops.privacy_retention_exceptions (
  id uuid primary key default gen_random_uuid(),
  resource_schema text not null,
  resource_table text not null,
  resource_key text not null,
  reason text not null check (length(btrim(reason)) between 10 and 500),
  expires_at timestamptz not null,
  created_at timestamptz not null default statement_timestamp(),
  created_by text not null default current_user,
  constraint privacy_retention_exceptions_future_expiry_check
    check (expires_at > created_at),
  unique (resource_schema, resource_table, resource_key)
);

comment on table ops.privacy_retention_exceptions is
  'Time-limited legal holds. Every exception requires a concrete reason and expiry; indefinite holds are forbidden.';

create index if not exists privacy_retention_exceptions_expiry_idx
  on ops.privacy_retention_exceptions (expires_at);

create or replace function ops.has_active_privacy_retention_exception(
  p_resource_schema text,
  p_resource_table text,
  p_resource_key text,
  p_at timestamptz
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from ops.privacy_retention_exceptions exception
    where exception.resource_schema = p_resource_schema
      and exception.resource_table = p_resource_table
      and exception.resource_key = p_resource_key
      and exception.expires_at > p_at
  )
$$;

revoke execute on function ops.has_active_privacy_retention_exception(
  text,
  text,
  text,
  timestamptz
) from public, anon, authenticated, service_role;

create table if not exists ops.shopify_checkout_observations (
  id uuid primary key default gen_random_uuid(),
  idempotency_key text not null unique,
  payload_sha256 text not null,
  contract_name text not null
    default 'utekos.shopify.checkout_observation'
    check (contract_name = 'utekos.shopify.checkout_observation'),
  schema_version smallint not null default 1
    check (schema_version in (1, 2)),
  source text not null default 'shopify_app_web_pixel'
    check (source = 'shopify_app_web_pixel'),
  verification_status text not null default 'observed'
    check (verification_status = 'observed'),
  event_name text not null
    check (
      event_name in (
        'checkout_shipping_info_submitted',
        'payment_info_submitted',
        'alert_displayed'
      )
    ),
  event_id text not null,
  event_sequence integer not null
    check (event_sequence between 0 and 2147483647),
  occurred_at timestamptz not null,
  analytics_processing_allowed boolean not null,
  marketing_allowed boolean not null,
  preferences_processing_allowed boolean not null,
  sale_of_data_allowed boolean not null,
  checkout_token text,
  currency_code text,
  commerce_value double precision,
  item_quantity integer,
  alert_type text,
  first_observed_at timestamptz not null default statement_timestamp(),
  last_observed_at timestamptz not null default statement_timestamp(),
  observation_count integer not null default 1
    check (observation_count >= 1),
  created_at timestamptz not null default statement_timestamp(),
  updated_at timestamptz not null default statement_timestamp(),
  constraint shopify_checkout_observations_idempotency_key_check
    check (
      idempotency_key = concat_ws(
        ':',
        contract_name,
        schema_version::text,
        source,
        event_name,
        event_id
      )
      and length(idempotency_key) between 1 and 1024
    ),
  constraint shopify_checkout_observations_payload_sha256_check
    check (payload_sha256 ~ '^[a-f0-9]{64}$'),
  constraint shopify_checkout_observations_event_id_check
    check (length(event_id) between 1 and 255),
  constraint shopify_checkout_observations_checkout_token_check
    check (
      checkout_token is null
      or length(checkout_token) between 1 and 255
    ),
  constraint shopify_checkout_observations_currency_check
    check (currency_code is null or currency_code ~ '^[A-Z]{3}$'),
  constraint shopify_checkout_observations_value_check
    check (
      commerce_value is null
      or (
        commerce_value >= 0
        and commerce_value::text not in ('NaN', 'Infinity', '-Infinity')
      )
    ),
  constraint shopify_checkout_observations_quantity_check
    check (
      item_quantity is null
      or item_quantity between 0 and 1000000
    ),
  constraint shopify_checkout_observations_shape_check
    check (
      (
        event_name in (
          'checkout_shipping_info_submitted',
          'payment_info_submitted'
        )
        and checkout_token is not null
        and item_quantity is not null
        and alert_type is null
        and (commerce_value is null or currency_code is not null)
      )
      or (
        event_name = 'alert_displayed'
        and alert_type in ('CHECKOUT_ERROR', 'PAYMENT_ERROR')
        and checkout_token is null
        and currency_code is null
        and commerce_value is null
        and item_quantity is null
      )
    ),
  constraint shopify_checkout_observations_observation_window_check
    check (last_observed_at >= first_observed_at),
  constraint shopify_checkout_observations_update_window_check
    check (updated_at >= created_at)
);

comment on table ops.shopify_checkout_observations is
  'Thirty-day, PII-free Shopify Web Pixel checkout observations. Rows are public browser observations only: they are not canonical events, payment truth, provider outbox entries or delivery evidence. Raw payloads, names, email, phone, addresses, URLs, query strings, cookies, click ids, client ids, user agents, line items, payment methods, gateways, alert text and provider data are forbidden.';
comment on column ops.shopify_checkout_observations.idempotency_key is
  'Versioned source identity. A matching payload hash is an identical replay; a different hash is an idempotency conflict and must never overwrite the first observation.';
comment on column ops.shopify_checkout_observations.payload_sha256 is
  'SHA-256 of the strictly validated versioned observation used only for replay equality and conflict detection.';
comment on column ops.shopify_checkout_observations.checkout_token is
  'Pseudonymous Shopify checkout correlation token from the allowlisted contract; customer and payment data are forbidden.';
comment on column ops.shopify_checkout_observations.verification_status is
  'Always observed. This table cannot represent canonical acceptance or provider delivery.';

create index if not exists shopify_checkout_observations_event_idx
  on ops.shopify_checkout_observations (event_name, occurred_at desc);
create index if not exists shopify_checkout_observations_checkout_idx
  on ops.shopify_checkout_observations (checkout_token, occurred_at desc)
  where checkout_token is not null;
create index if not exists shopify_checkout_observations_last_observed_idx
  on ops.shopify_checkout_observations (last_observed_at desc);

create or replace function ops.enforce_shopify_checkout_observation_replay()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if row(
    new.id,
    new.idempotency_key,
    new.payload_sha256,
    new.contract_name,
    new.schema_version,
    new.source,
    new.verification_status,
    new.event_name,
    new.event_id,
    new.event_sequence,
    new.occurred_at,
    new.analytics_processing_allowed,
    new.marketing_allowed,
    new.preferences_processing_allowed,
    new.sale_of_data_allowed,
    new.checkout_token,
    new.currency_code,
    new.commerce_value,
    new.item_quantity,
    new.alert_type,
    new.first_observed_at,
    new.created_at
  ) is distinct from row(
    old.id,
    old.idempotency_key,
    old.payload_sha256,
    old.contract_name,
    old.schema_version,
    old.source,
    old.verification_status,
    old.event_name,
    old.event_id,
    old.event_sequence,
    old.occurred_at,
    old.analytics_processing_allowed,
    old.marketing_allowed,
    old.preferences_processing_allowed,
    old.sale_of_data_allowed,
    old.checkout_token,
    old.currency_code,
    old.commerce_value,
    old.item_quantity,
    old.alert_type,
    old.first_observed_at,
    old.created_at
  ) then
    raise exception using
      errcode = '23514',
      message = 'Shopify checkout observation identity and payload are immutable';
  end if;

  if new.observation_count <> old.observation_count + 1
    or new.last_observed_at < old.last_observed_at
    or new.updated_at < old.updated_at then
    raise exception using
      errcode = '23514',
      message = 'Shopify checkout observation replay counters must advance monotonically';
  end if;

  return new;
end;
$$;

comment on function ops.enforce_shopify_checkout_observation_replay() is
  'Allows only monotonic replay bookkeeping updates. The first validated observation, its idempotency identity and its payload hash are immutable.';

revoke execute on function ops.enforce_shopify_checkout_observation_replay()
  from public, anon, authenticated;

drop trigger if exists enforce_shopify_checkout_observation_replay
  on ops.shopify_checkout_observations;
create trigger enforce_shopify_checkout_observation_replay
before update on ops.shopify_checkout_observations
for each row
execute function ops.enforce_shopify_checkout_observation_replay();

create or replace function ops.purge_expired_shopify_checkout_observations()
returns bigint
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_deleted bigint := 0;
  v_now timestamptz := statement_timestamp();
begin
  delete from ops.shopify_checkout_observations observation
  where observation.last_observed_at < v_now - interval '30 days'
    and not ops.has_active_privacy_retention_exception(
      'ops',
      'shopify_checkout_observations',
      observation.id::text,
      v_now
    );

  get diagnostics v_deleted = row_count;
  return v_deleted;
end;
$$;

comment on function ops.purge_expired_shopify_checkout_observations() is
  'Deletes PII-free Shopify checkout observations after 30 days unless a time-limited retention exception is active.';

revoke execute on function ops.purge_expired_shopify_checkout_observations()
  from public, anon, authenticated;
grant execute on function ops.purge_expired_shopify_checkout_observations()
  to service_role, postgres;

do $schedule_shopify_checkout_observation_purge$
declare
  v_job_exists boolean;
begin
  if to_regclass('cron.job') is null then
    raise exception using
      errcode = '55000',
      message = 'pg_cron cron.job is required for Shopify checkout observation retention';
  end if;

  execute $query$
    select exists (
      select 1
      from cron.job
      where jobname = 'purge_expired_shopify_checkout_observations'
    )
  $query$ into v_job_exists;

  if not v_job_exists then
    perform cron.schedule(
      'purge_expired_shopify_checkout_observations',
      '47 3 * * *',
      'select ops.purge_expired_shopify_checkout_observations();'
    );
  end if;
end;
$schedule_shopify_checkout_observation_purge$;

create table if not exists ops.tagging_observations (
  id uuid primary key default gen_random_uuid(),
  idempotency_key text not null unique,
  event_id text not null,
  event_name text not null,
  observation_type text not null
    check (
      observation_type in (
        'browser_dispatch',
        'collector_received',
        'sgtm_ingress',
        'tag_execution'
      )
    ),
  container_id text,
  container_version text,
  client_name text,
  tag_id text,
  tag_status text,
  tag_execution_time_ms integer
    check (
      tag_execution_time_ms is null
      or tag_execution_time_ms >= 0
    ),
  page_view_id uuid,
  edge_request_id uuid,
  traffic_classification text,
  observed_at timestamptz not null,
  received_at timestamptz not null default now(),
  constraint tagging_observations_shape_check check (
    (
      observation_type = 'browser_dispatch'
      and container_id is null
      and container_version is null
      and client_name is null
      and tag_id is null
      and tag_status is null
      and tag_execution_time_ms is null
      and (
        (
          page_view_id is null
          and edge_request_id is null
          and traffic_classification is null
        )
        or (
          event_name = 'page_view'
          and page_view_id is not null
          and edge_request_id is not null
          and traffic_classification in (
            'human_or_unknown',
            'verified_bot',
            'automated_bot',
            'synthetic'
          )
        )
      )
    )
    or (
      observation_type = 'collector_received'
      and event_name = 'page_view'
      and page_view_id is not null
      and edge_request_id is not null
      and traffic_classification is null
      and container_id is null
      and container_version is null
      and client_name is null
      and tag_id is null
      and tag_status is null
      and tag_execution_time_ms is null
    )
    or (
      observation_type = 'sgtm_ingress'
      and page_view_id is null
      and edge_request_id is null
      and traffic_classification is null
      and container_id is not null
      and container_version is not null
      and client_name is not null
      and tag_id is null
      and tag_status is null
      and tag_execution_time_ms is null
    )
    or (
      observation_type = 'tag_execution'
      and page_view_id is null
      and edge_request_id is null
      and traffic_classification is null
      and container_id is not null
      and container_version is not null
      and client_name is not null
      and tag_id is not null
      and tag_status is not null
    )
  ),
  constraint tagging_observations_page_view_identity_check check (
    edge_request_id is null
    or event_id ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
  )
);

comment on table ops.tagging_observations is
  'PII-free browser, collector and server GTM receipts. URLs, query strings, click ids, cookies, client ids, IP addresses, user agents and raw payloads are forbidden.';
comment on column ops.tagging_observations.page_view_id is
  'Optional canonical page_view UUID. Required only for current browser-dispatch and collector-receipt funnel rows.';
comment on column ops.tagging_observations.edge_request_id is
  'Optional privacy-safe landing correlation UUID. Raw URLs, query strings, click ids, cookies, IP addresses and user agents are forbidden.';
comment on column ops.tagging_observations.traffic_classification is
  'Bounded traffic class for signed browser-dispatch receipts; collector receipt rows deliberately leave it null.';

create index if not exists tagging_observations_event_idx
  on ops.tagging_observations (event_id, observed_at desc);
create index if not exists tagging_observations_type_idx
  on ops.tagging_observations (observation_type, received_at desc);
create index if not exists tagging_observations_edge_page_view_idx
  on ops.tagging_observations (edge_request_id, page_view_id, observed_at)
  where edge_request_id is not null;

create table if not exists ops.landing_consent_observations (
  edge_request_id uuid primary key,
  page_view_id uuid not null,
  analytics_granted boolean not null,
  marketing_granted boolean not null,
  preferences_granted boolean not null,
  decision text not null
    check (decision in ('granted', 'denied', 'partial')),
  source text not null default 'cookiebot'
    check (source = 'cookiebot'),
  traffic_classification text not null
    check (
      traffic_classification in (
        'human_or_unknown',
        'verified_bot',
        'automated_bot',
        'synthetic'
      )
    ),
  observation_count smallint not null default 1
    check (observation_count between 1 and 4),
  observed_at timestamptz not null,
  updated_at timestamptz not null default statement_timestamp(),
  constraint landing_consent_observations_decision_consistency_check
    check (
      (
        decision = 'granted'
        and analytics_granted
        and marketing_granted
        and preferences_granted
      )
      or (
        decision = 'denied'
        and not analytics_granted
        and not marketing_granted
        and not preferences_granted
      )
      or (
        decision = 'partial'
        and (analytics_granted or marketing_granted or preferences_granted)
        and not (analytics_granted and marketing_granted and preferences_granted)
      )
    )
);

comment on table ops.landing_consent_observations is
  'Thirty-day consent-stage correlation keyed by edge_request_id. Pending state is deliberately not persisted; the asynchronous Log Drain row is not a foreign key prerequisite.';

create index if not exists landing_consent_observations_page_view_idx
  on ops.landing_consent_observations (page_view_id);
create index if not exists landing_consent_observations_observed_at_idx
  on ops.landing_consent_observations (observed_at desc);
create index if not exists landing_consent_observations_marketing_idx
  on ops.landing_consent_observations (
    marketing_granted,
    traffic_classification,
    observed_at desc
  );

create index if not exists event_ledger_edge_request_page_view_idx
  on marketing.event_ledger ((payload ->> 'edge_request_id'), occurred_at)
  where event_name = 'page_view' and payload ? 'edge_request_id';

create or replace view ops.meta_landing_observability
with (security_invoker = true)
as
with directly_linked_edge as (
  select
    edge.*,
    coalesce(
      case when edge.request_id is not null then
        max(edge.edge_request_id::text) over (
          partition by edge.project_id, edge.deployment_id, edge.request_id
        )
      end,
      case when edge.vercel_id is not null then
        max(edge.edge_request_id::text) over (
          partition by edge.project_id, edge.deployment_id, edge.vercel_id
        )
      end,
      case when edge.trace_id is not null then
        max(edge.edge_request_id::text) over (
          partition by edge.project_id, edge.deployment_id, edge.trace_id
        )
      end,
      edge.edge_request_id::text
    ) as linked_edge_request_id,
    coalesce(
      case when edge.edge_request_id is not null then
        max(edge.request_id) over (
          partition by edge.project_id, edge.deployment_id, edge.edge_request_id
        )
      end,
      case when edge.vercel_id is not null then
        max(edge.request_id) over (
          partition by edge.project_id, edge.deployment_id, edge.vercel_id
        )
      end,
      case when edge.trace_id is not null then
        max(edge.request_id) over (
          partition by edge.project_id, edge.deployment_id, edge.trace_id
        )
      end,
      edge.request_id
    ) as linked_request_id,
    coalesce(
      case when edge.edge_request_id is not null then
        max(edge.vercel_id) over (
          partition by edge.project_id, edge.deployment_id, edge.edge_request_id
        )
      end,
      case when edge.request_id is not null then
        max(edge.vercel_id) over (
          partition by edge.project_id, edge.deployment_id, edge.request_id
        )
      end,
      case when edge.trace_id is not null then
        max(edge.vercel_id) over (
          partition by edge.project_id, edge.deployment_id, edge.trace_id
        )
      end,
      edge.vercel_id
    ) as linked_vercel_id,
    coalesce(
      case when edge.edge_request_id is not null then
        max(edge.trace_id) over (
          partition by edge.project_id, edge.deployment_id, edge.edge_request_id
        )
      end,
      case when edge.request_id is not null then
        max(edge.trace_id) over (
          partition by edge.project_id, edge.deployment_id, edge.request_id
        )
      end,
      case when edge.vercel_id is not null then
        max(edge.trace_id) over (
          partition by edge.project_id, edge.deployment_id, edge.vercel_id
        )
      end,
      edge.trace_id
    ) as linked_trace_id
  from ops.vercel_edge_request_observations edge
),
bridged_edge as (
  select
    edge.*,
    coalesce(
      case when edge.linked_edge_request_id is not null then
        max(edge.linked_request_id) over (
          partition by edge.project_id, edge.deployment_id, edge.linked_edge_request_id
        )
      end,
      case when edge.linked_vercel_id is not null then
        max(edge.linked_request_id) over (
          partition by edge.project_id, edge.deployment_id, edge.linked_vercel_id
        )
      end,
      case when edge.linked_trace_id is not null then
        max(edge.linked_request_id) over (
          partition by edge.project_id, edge.deployment_id, edge.linked_trace_id
        )
      end,
      edge.linked_request_id
    ) as canonical_request_id,
    coalesce(
      case when edge.linked_request_id is not null then
        max(edge.linked_edge_request_id) over (
          partition by edge.project_id, edge.deployment_id, edge.linked_request_id
        )
      end,
      case when edge.linked_vercel_id is not null then
        max(edge.linked_edge_request_id) over (
          partition by edge.project_id, edge.deployment_id, edge.linked_vercel_id
        )
      end,
      case when edge.linked_trace_id is not null then
        max(edge.linked_edge_request_id) over (
          partition by edge.project_id, edge.deployment_id, edge.linked_trace_id
        )
      end,
      edge.linked_edge_request_id
    ) as canonical_edge_request_id,
    coalesce(
      case when edge.linked_request_id is not null then
        max(edge.linked_vercel_id) over (
          partition by edge.project_id, edge.deployment_id, edge.linked_request_id
        )
      end,
      case when edge.linked_edge_request_id is not null then
        max(edge.linked_vercel_id) over (
          partition by edge.project_id, edge.deployment_id, edge.linked_edge_request_id
        )
      end,
      case when edge.linked_trace_id is not null then
        max(edge.linked_vercel_id) over (
          partition by edge.project_id, edge.deployment_id, edge.linked_trace_id
        )
      end,
      edge.linked_vercel_id
    ) as canonical_vercel_id,
    coalesce(
      case when edge.linked_request_id is not null then
        max(edge.linked_trace_id) over (
          partition by edge.project_id, edge.deployment_id, edge.linked_request_id
        )
      end,
      case when edge.linked_edge_request_id is not null then
        max(edge.linked_trace_id) over (
          partition by edge.project_id, edge.deployment_id, edge.linked_edge_request_id
        )
      end,
      case when edge.linked_vercel_id is not null then
        max(edge.linked_trace_id) over (
          partition by edge.project_id, edge.deployment_id, edge.linked_vercel_id
        )
      end,
      edge.linked_trace_id
    ) as canonical_trace_id
  from directly_linked_edge edge
),
keyed_edge as (
  select
    edge.*,
    concat_ws(
      ':',
      edge.project_id,
      edge.deployment_id,
      coalesce(
        'request:' || edge.canonical_request_id,
        'edge:' || edge.canonical_edge_request_id,
        'vercel:' || edge.canonical_vercel_id,
        'trace:' || edge.canonical_trace_id,
        'log:' || edge.vercel_log_id
      )
    ) as request_partition_key
  from bridged_edge edge
),
ranked_edge as (
  select
    edge.*,
    max(edge.canonical_edge_request_id) over (
      partition by edge.request_partition_key
    )::uuid as correlated_edge_request_id,
    max(edge.canonical_trace_id) over (
      partition by edge.request_partition_key
    ) as correlated_trace_id,
    row_number() over (
      partition by edge.request_partition_key
      order by
        case edge.observation_type when 'document' then 0 else 1 end,
        edge.observed_at,
        edge.vercel_log_id
    ) as request_observation_rank,
    case
      when edge.fbclid_hmac is not null
        and edge.observation_type = 'document'
      then count(*) filter (
        where edge.observation_type = 'document'
      ) over (
        partition by
          edge.project_id,
          case
            when edge.fbclid_hmac is not null
              then 'fbclid:' || edge.fbclid_hmac
            else 'log:' || edge.vercel_log_id
          end
        order by edge.observed_at, edge.vercel_log_id
        rows between unbounded preceding and current row
      )
      else null
    end as fbclid_document_observation_rank
  from keyed_edge edge
)
select
  timezone('UTC', edge.observed_at)::date as observed_date_utc,
  edge.observed_at,
  edge.environment,
  edge.request_observation_rank,
  edge.request_observation_rank = 1 as is_primary_request_observation,
  coalesce(
    edge.fbclid_document_observation_rank = 1,
    false
  ) as is_first_fbclid_observation,
  edge.route_pathname,
  edge.host,
  edge.observation_type,
  edge.status_code,
  edge.response_bytes,
  edge.cache_status,
  edge.waf_action,
  edge.path_type,
  edge.edge_region,
  edge.execution_region,
  edge.lambda_region,
  edge.referrer_host,
  edge.in_app_browser,
  edge.device_class,
  edge.os_class,
  edge.automation_class,
  edge.fbclid_present,
  edge.utm_source,
  edge.utm_medium,
  edge.utm_campaign,
  edge.utm_content,
  edge.utm_term,
  edge.meta_campaign_id,
  edge.meta_adset_id,
  edge.meta_ad_id,
  edge.meta_placement,
  edge.meta_site_source_name,
  trace.duration_ms as server_trace_duration_ms,
  trace.span_count as server_trace_span_count,
  consent.decision as consent_decision,
  consent.analytics_granted,
  consent.marketing_granted,
  consent.preferences_granted,
  consent.traffic_classification,
  ledger.occurred_at is not null as canonical_page_view_observed,
  ledger.occurred_at as canonical_page_view_observed_at,
  meta_attempt.status as meta_dispatch_status,
  meta_attempt.http_status as meta_dispatch_http_status,
  meta_attempt.response_semantics as meta_dispatch_response_semantics,
  meta_attempt.processed_at as meta_dispatch_processed_at,
  funnel_identity.event_id as page_view_event_id,
  funnel_identity.page_view_id,
  browser_dispatch.traffic_classification as browser_page_view_traffic_classification,
  browser_dispatch.observed_at is not null as browser_page_view_dispatch_receipt_received,
  browser_dispatch.observed_at as browser_page_view_dispatch_receipt_received_at,
  collector_receipt.observed_at is not null as collector_page_view_receipt_received,
  collector_receipt.observed_at as collector_page_view_receipt_received_at
from ranked_edge edge
left join ops.vercel_trace_observations trace
  on trace.trace_id = edge.correlated_trace_id
left join ops.landing_consent_observations consent
  on consent.edge_request_id = edge.correlated_edge_request_id
left join lateral (
  select
    candidate.event_id,
    candidate.page_view_id,
    max(candidate.identity_authority) as identity_authority,
    min(candidate.observed_at) as first_observed_at
  from (
    select
      observation.event_id,
      observation.page_view_id,
      case
        when observation.observation_type = 'collector_received' then 1
        else 0
      end as identity_authority,
      observation.observed_at
    from ops.tagging_observations observation
    where observation.observation_type in (
        'browser_dispatch',
        'collector_received'
      )
      and observation.event_name = 'page_view'
      and edge.correlated_edge_request_id is not null
      and observation.edge_request_id = edge.correlated_edge_request_id

    union all

    select
      candidate.event_id::text,
      (candidate.payload ->> 'page_view_id')::uuid,
      2 as identity_authority,
      candidate.occurred_at
    from marketing.event_ledger candidate
    where candidate.event_name = 'page_view'
      and edge.correlated_edge_request_id is not null
      and candidate.payload ->> 'edge_request_id' = edge.correlated_edge_request_id::text
      and candidate.payload ->> 'page_view_id'
        ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
  ) candidate
  group by candidate.event_id, candidate.page_view_id
  order by
    max(candidate.identity_authority) desc,
    min(candidate.observed_at),
    candidate.event_id,
    candidate.page_view_id
  limit 1
) funnel_identity on true
left join lateral (
  select
    observation.observed_at,
    observation.traffic_classification
  from ops.tagging_observations observation
  where observation.observation_type = 'browser_dispatch'
    and observation.event_name = 'page_view'
    and observation.edge_request_id = edge.correlated_edge_request_id
    and observation.event_id = funnel_identity.event_id
    and observation.page_view_id = funnel_identity.page_view_id
  order by observation.observed_at
  limit 1
) browser_dispatch on true
left join lateral (
  select
    observation.observed_at
  from ops.tagging_observations observation
  where observation.observation_type = 'collector_received'
    and observation.event_name = 'page_view'
    and observation.edge_request_id = edge.correlated_edge_request_id
    and observation.event_id = funnel_identity.event_id
    and observation.page_view_id = funnel_identity.page_view_id
  order by observation.observed_at
  limit 1
) collector_receipt on true
left join lateral (
  select
    candidate.event_id,
    candidate.occurred_at
  from marketing.event_ledger candidate
  where candidate.event_name = 'page_view'
    and candidate.event_id::text = funnel_identity.event_id
    and candidate.payload ->> 'edge_request_id' = edge.correlated_edge_request_id::text
    and candidate.payload ->> 'page_view_id' = funnel_identity.page_view_id::text
  order by candidate.occurred_at
  limit 1
) ledger on true
left join lateral (
  select
    attempt.status,
    attempt.http_status,
    attempt.response_semantics,
    attempt.processed_at
  from ops.provider_dispatch_attempts attempt
  where attempt.provider = 'meta'
    and attempt.event_id = ledger.event_id
  order by attempt.updated_at desc
  limit 1
) meta_attempt on true;

comment on view ops.meta_landing_observability is
  'Security-invoker read model for privacy-safe Meta landing, HTTP, trace, consent, browser PageView dispatch-receipt, collector receipt, canonical acceptance and Meta dispatch evidence. PageView stages are bound to one event_id/page_view_id per edge request; canonical and collector-backed identities outrank browser-only receipts. Receipt timestamps are server observation times and do not prove strict wire ordering. Use is_primary_request_observation for request counts and is_first_fbclid_observation for a deduplicated click-to-edge numerator.';

create or replace function ops.purge_expired_page_view_funnel_observations()
returns bigint
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_deleted bigint := 0;
  v_now timestamptz := statement_timestamp();
begin
  delete from ops.tagging_observations observation
  where observation.edge_request_id is not null
    and observation.observed_at < v_now - interval '30 days'
    and not ops.has_active_privacy_retention_exception(
      'ops',
      'tagging_observations',
      observation.id::text,
      v_now
    );

  get diagnostics v_deleted = row_count;
  return v_deleted;
end;
$$;

comment on function ops.purge_expired_page_view_funnel_observations() is
  'Deletes privacy-bounded page_view browser-dispatch and collector-receipt observations after 30 days unless a time-limited retention exception is active.';

revoke execute on function ops.purge_expired_page_view_funnel_observations()
  from public, anon, authenticated;
grant execute on function ops.purge_expired_page_view_funnel_observations()
  to service_role, postgres;

do $schedule_page_view_funnel_observation_purge$
declare
  v_job_exists boolean;
begin
  if to_regclass('cron.job') is null then
    raise exception using
      errcode = '55000',
      message = 'pg_cron cron.job is required for page_view funnel observation retention';
  end if;

  execute $query$
    select exists (
      select 1
      from cron.job
      where jobname = 'purge_expired_page_view_funnel_observations'
    )
  $query$ into v_job_exists;

  if not v_job_exists then
    perform cron.schedule(
      'purge_expired_page_view_funnel_observations',
      '43 3 * * *',
      'select ops.purge_expired_page_view_funnel_observations();'
    );
  end if;
end;
$schedule_page_view_funnel_observation_purge$;
