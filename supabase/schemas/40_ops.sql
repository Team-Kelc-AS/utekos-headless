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
  meta_attempt.processed_at as meta_dispatch_processed_at
from ranked_edge edge
left join ops.vercel_trace_observations trace
  on trace.trace_id = edge.correlated_trace_id
left join ops.landing_consent_observations consent
  on consent.edge_request_id = edge.correlated_edge_request_id
left join lateral (
  select
    candidate.event_id,
    candidate.occurred_at
  from marketing.event_ledger candidate
  where candidate.event_name = 'page_view'
    and edge.correlated_edge_request_id is not null
    and candidate.payload ->> 'edge_request_id' = edge.correlated_edge_request_id::text
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
  'Security-invoker read model for privacy-safe Meta landing, HTTP, trace, consent, canonical PageView and Meta dispatch evidence. Use is_primary_request_observation for request counts and is_first_fbclid_observation for a deduplicated click-to-edge numerator.';
