alter table ops.tagging_observations
  add column if not exists page_view_id uuid,
  add column if not exists edge_request_id uuid,
  add column if not exists traffic_classification text;

alter table ops.tagging_observations
  drop constraint if exists tagging_observations_observation_type_check,
  add constraint tagging_observations_observation_type_check check (
    observation_type in (
      'browser_dispatch',
      'collector_received',
      'sgtm_ingress',
      'tag_execution'
    )
  ),
  drop constraint if exists tagging_observations_shape_check,
  add constraint tagging_observations_shape_check check (
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
  drop constraint if exists tagging_observations_page_view_identity_check,
  add constraint tagging_observations_page_view_identity_check check (
    edge_request_id is null
    or event_id ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
  );

comment on column ops.tagging_observations.page_view_id is
  'Optional canonical page_view UUID. Required only for current browser-dispatch and collector-receipt funnel rows.';
comment on column ops.tagging_observations.edge_request_id is
  'Optional privacy-safe landing correlation UUID. Raw URLs, query strings, click ids, cookies, IP addresses and user agents are forbidden.';
comment on column ops.tagging_observations.traffic_classification is
  'Bounded traffic class for signed browser-dispatch receipts; collector receipt rows deliberately leave it null.';
comment on table ops.tagging_observations is
  'PII-free browser, collector and server GTM receipts. URLs, query strings, click ids, cookies, client ids, IP addresses, user agents and raw payloads are forbidden.';

create index if not exists tagging_observations_edge_page_view_idx
  on ops.tagging_observations (edge_request_id, page_view_id, observed_at)
  where edge_request_id is not null;

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

alter table ops.tagging_observations enable row level security;
alter table ops.tagging_observations force row level security;
revoke all on table ops.tagging_observations
  from public, anon, authenticated, service_role;
grant usage on schema ops to service_role;
grant select, insert on table ops.tagging_observations to service_role;

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
