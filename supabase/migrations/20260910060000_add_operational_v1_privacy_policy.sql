set lock_timeout = '5s';

alter table ops.vercel_edge_request_observations
  add column data_policy text not null default 'legacy'
  check (data_policy in ('legacy', 'operational_v1'));

alter table ops.vercel_edge_request_observations
  add constraint operational_v1_no_attribution check (
    data_policy <> 'operational_v1' or (
      edge_request_id is null and not fbclid_present and fbclid_hmac is null
      and utm_source is null and utm_medium is null and utm_campaign is null
      and utm_content is null and utm_term is null
      and meta_campaign_id is null and meta_adset_id is null and meta_ad_id is null
      and meta_placement is null and meta_site_source_name is null
      and referrer_host is null and in_app_browser = 'unknown'
      and device_class = 'unknown' and os_class = 'unknown'
    )
  );

create table ops.operational_statistics_control (
  singleton boolean primary key default true check (singleton),
  enabled boolean not null default false,
  approved_at timestamptz,
  approved_by text,
  check (not enabled or (approved_at is not null and approved_by is not null))
);
insert into ops.operational_statistics_control (enabled) values (false);
alter table ops.operational_statistics_control enable row level security;
revoke all on ops.operational_statistics_control from public, anon, authenticated, service_role;

create table ops.daily_operational_traffic (
  day date not null,
  project_id text not null,
  environment text not null,
  route text not null,
  source text not null,
  status_code integer not null,
  observations bigint not null check (observations >= 0),
  response_bytes bigint not null check (response_bytes >= 0),
  primary key (day, project_id, environment, route, source, status_code)
);
comment on table ops.daily_operational_traffic is
  'Vercel log observations, not unique visitors, sessions, LPV or deduplicated HTTP requests. Contains no visitor, ad, request or trace identifiers. Aggregation disabled until controller approval.';
alter table ops.daily_operational_traffic enable row level security;
revoke all on ops.daily_operational_traffic from public, anon, authenticated;
grant select on ops.daily_operational_traffic to service_role;

create function ops.aggregate_operational_v1_insert()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if new.data_policy <> 'operational_v1' or not exists (
    select 1 from ops.operational_statistics_control where enabled
  ) then return new; end if;
  insert into ops.daily_operational_traffic
    (day, project_id, environment, route, source, status_code, observations, response_bytes)
  values
    ((least(new.observed_at, new.ingested_at) at time zone 'Europe/Oslo')::date, new.project_id,
      new.environment, new.route_pathname, new.source, new.status_code, 1, coalesce(new.response_bytes, 0))
  on conflict (day, project_id, environment, route, source, status_code)
  do update set observations = ops.daily_operational_traffic.observations + 1,
    response_bytes = ops.daily_operational_traffic.response_bytes + excluded.response_bytes;
  return new;
end;
$$;
revoke execute on function ops.aggregate_operational_v1_insert() from public, anon, authenticated;
create trigger aggregate_operational_v1_insert after insert on ops.vercel_edge_request_observations
for each row execute function ops.aggregate_operational_v1_insert();

create function ops.purge_operational_v1()
returns void language plpgsql security definer set search_path = '' as $$
begin
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
select cron.schedule('purge_operational_v1', '35 * * * *', 'select ops.purge_operational_v1();');
