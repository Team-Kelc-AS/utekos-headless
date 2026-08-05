create or replace view ops.meta_landing_edge_health
with (security_invoker = true)
as
with keyed_edge as (
  select
    edge.*,
    concat_ws(
      ':',
      edge.project_id,
      edge.deployment_id,
      coalesce(
        'request:' || edge.request_id,
        'edge:' || edge.edge_request_id::text,
        'trace:' || edge.trace_id,
        'log:' || edge.vercel_log_id
      )
    ) as request_partition_key
  from ops.vercel_edge_request_observations edge
),
ranked_edge as (
  select
    edge.*,
    (
      max(edge.edge_request_id::text) over (
        partition by edge.request_partition_key
      )
    )::uuid as resolved_edge_request_id,
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
        partition by edge.project_id, edge.fbclid_hmac
        order by edge.observed_at, edge.vercel_log_id
        rows between unbounded preceding and current row
      )
      else null
    end as fbclid_document_observation_rank
  from keyed_edge edge
)
select
  edge.observed_at,
  edge.environment,
  edge.observation_type,
  edge.status_code,
  edge.automation_class,
  edge.fbclid_present,
  edge.utm_source,
  edge.meta_ad_id,
  edge.request_observation_rank = 1
    as is_primary_request_observation,
  coalesce(
    edge.fbclid_document_observation_rank = 1,
    false
  ) as is_first_fbclid_observation,
  consent.traffic_classification
from ranked_edge edge
left join ops.landing_consent_observations consent
  on consent.edge_request_id = edge.resolved_edge_request_id;

comment on view ops.meta_landing_edge_health is
  'Lightweight, security-invoker Meta edge health read model. It ranks Vercel observations by stable request_id with privacy-safe fallbacks and deduplicates HMAC-protected fbclid document observations without evaluating the full page-view funnel joins.';

revoke all on table ops.meta_landing_edge_health
  from public, anon, authenticated, service_role;
grant select on table ops.meta_landing_edge_health to service_role;