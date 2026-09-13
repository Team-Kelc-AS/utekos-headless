set lock_timeout = '5s';

create table ops.vercel_runtime_diagnostics (
  vercel_log_id text primary key check (length(vercel_log_id) between 1 and 256),
  project_id text not null check (length(project_id) between 1 and 256),
  deployment_id text not null check (length(deployment_id) between 1 and 256),
  environment text not null check (environment in ('production', 'preview')),
  observed_at timestamptz not null,
  ingested_at timestamptz not null default statement_timestamp(),
  level text not null check (level in ('info', 'warning', 'error', 'fatal')),
  source text not null check (source in ('edge','lambda','static','external','firewall','redirect')),
  request_route text check (request_route ~ '^/[a-zA-Z0-9_:/-]*$' and length(request_route) <= 160),
  context_route text check (context_route ~ '^/[a-zA-Z0-9_:/-]*$' and length(context_route) <= 160),
  method text check (method in ('GET','HEAD','POST','PUT','PATCH','DELETE','OPTIONS')),
  status_code integer check (status_code = -1 or status_code between 100 and 599),
  request_id text check (request_id ~ '^[a-zA-Z0-9_:-]{1,256}$'),
  trace_id text check (trace_id ~ '^[a-f0-9]{32}$'),
  event_name text check (length(event_name) <= 80 and event_name ~ '^[a-z_.]+$'),
  error_name text check (length(error_name) <= 40 and error_name ~ '^[A-Za-z]+$'),
  category text not null check (length(category) <= 40 and category ~ '^[A-Za-z_]+$'),
  message_policy text not null check (message_policy in ('classified_raw_omitted','not_provided')),
  check (level <> 'info' or (status_code is not null and status_code >= 400))
);
comment on table ops.vercel_runtime_diagnostics is
  'Operational diagnostic log entries, not unique errors, requests, visitors or conversions. Raw message, stack, URL queries, headers and advertising identity are deliberately omitted. Classification is heuristic; correlate request_id/trace_id with Vercel for original details. Seven-day retention via existing purge_operational_v1 job.';
create index vercel_runtime_diagnostics_time_idx on ops.vercel_runtime_diagnostics (observed_at desc);
create index vercel_runtime_diagnostics_deployment_idx on ops.vercel_runtime_diagnostics (deployment_id, observed_at desc);
create index vercel_runtime_diagnostics_request_idx on ops.vercel_runtime_diagnostics (request_id) where request_id is not null;
create index vercel_runtime_diagnostics_trace_idx on ops.vercel_runtime_diagnostics (trace_id) where trace_id is not null;
alter table ops.vercel_runtime_diagnostics enable row level security;
alter table ops.vercel_runtime_diagnostics force row level security;
revoke all on ops.vercel_runtime_diagnostics from public, anon, authenticated;
grant select, insert on ops.vercel_runtime_diagnostics to service_role;

create view ops.vercel_runtime_diagnostics_2h with (security_invoker = true) as
select project_id, environment, deployment_id, level, source, request_route, context_route,
  event_name, category, status_code, message_policy,
  count(*) as log_entries,
  count(distinct request_id) as distinct_known_request_ids,
  count(*) filter (where request_id is null) as entries_without_request_id,
  min(observed_at) as first_seen, max(observed_at) as last_seen,
  max(ingested_at) as last_ingested_at
from ops.vercel_runtime_diagnostics
where observed_at >= statement_timestamp() - interval '2 hours'
  and observed_at < statement_timestamp()
group by project_id, environment, deployment_id, level, source, request_route, context_route,
  event_name, category, status_code, message_policy;
revoke all on ops.vercel_runtime_diagnostics_2h from public, anon, authenticated;
grant select on ops.vercel_runtime_diagnostics_2h to service_role;

create or replace function ops.purge_operational_v1()
returns void language plpgsql security definer set search_path = '' as $$
begin
  delete from ops.vercel_runtime_diagnostics observation
  where least(observation.observed_at, observation.ingested_at) < statement_timestamp() - interval '7 days' + interval '1 hour'
    and not ops.has_active_privacy_retention_exception(
      'ops', 'vercel_runtime_diagnostics', observation.vercel_log_id, statement_timestamp()
    );
  delete from ops.vercel_edge_request_observations observation
  where observation.data_policy = 'operational_v1'
    and least(observation.observed_at, observation.ingested_at) < statement_timestamp() - interval '7 days' + interval '1 hour'
    and not ops.has_active_privacy_retention_exception(
      'ops', 'vercel_edge_request_observations', observation.vercel_log_id, statement_timestamp()
    );
  delete from ops.daily_operational_traffic
  where day < (statement_timestamp() at time zone 'Europe/Oslo')::date - 89;
end;
$$;
revoke execute on function ops.purge_operational_v1() from public, anon, authenticated;
grant execute on function ops.purge_operational_v1() to service_role, postgres;
