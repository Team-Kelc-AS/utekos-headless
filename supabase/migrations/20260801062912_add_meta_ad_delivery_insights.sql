create table if not exists marketing.meta_ad_delivery_insights (
  id uuid primary key default gen_random_uuid(),
  account_id text not null check (account_id ~ '^[0-9]+$'),
  account_timezone text not null,
  api_version text not null check (api_version ~ '^v[0-9]+\.[0-9]+$'),
  action_report_time text not null check (action_report_time in ('impression', 'conversion', 'mixed')),
  attribution_setting text not null check (attribution_setting = 'account'),
  campaign_id text not null check (campaign_id ~ '^[0-9]+$'),
  campaign_name text,
  adset_id text not null check (adset_id ~ '^[0-9]+$'),
  adset_name text,
  ad_id text not null check (ad_id ~ '^[0-9]+$'),
  ad_name text,
  insight_date date not null,
  breakdown_kind text not null check (
    breakdown_kind in (
      'overall',
      'publisher_platform',
      'platform_position',
      'device_platform',
      'impression_device'
    )
  ),
  dimension_key text not null,
  publisher_platform text,
  platform_position text,
  device_platform text,
  impression_device text,
  impressions numeric check (impressions is null or impressions >= 0),
  clicks numeric check (clicks is null or clicks >= 0),
  link_clicks numeric check (link_clicks is null or link_clicks >= 0),
  outbound_clicks numeric check (outbound_clicks is null or outbound_clicks >= 0),
  landing_page_views numeric check (landing_page_views is null or landing_page_views >= 0),
  metric_availability jsonb not null,
  fetched_at timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint meta_ad_delivery_insights_metric_availability_object_check
    check (
      jsonb_typeof(metric_availability) = 'object'
      and metric_availability ->> 'impressions' in ('available', 'unavailable')
      and metric_availability ->> 'clicks' in ('available', 'unavailable')
      and metric_availability ->> 'link_clicks' in ('available', 'unavailable')
      and metric_availability ->> 'outbound_clicks' in ('available', 'unavailable')
      and metric_availability ->> 'landing_page_views' in ('available', 'unavailable')
    ),
  constraint meta_ad_delivery_insights_dimension_grain_check check (
    (
      breakdown_kind = 'overall'
      and dimension_key = 'all'
      and publisher_platform is null
      and platform_position is null
      and device_platform is null
      and impression_device is null
    )
    or (
      breakdown_kind = 'publisher_platform'
      and publisher_platform is not null
      and dimension_key = 'publisher_platform:' || publisher_platform
      and platform_position is null
      and device_platform is null
      and impression_device is null
    )
    or (
      breakdown_kind = 'platform_position'
      and publisher_platform is not null
      and platform_position is not null
      and dimension_key = 'platform_position:' || publisher_platform || ':' || platform_position
      and device_platform is null
      and impression_device is null
    )
    or (
      breakdown_kind = 'device_platform'
      and publisher_platform is null
      and platform_position is null
      and device_platform is not null
      and dimension_key = 'device_platform:' || device_platform
      and impression_device is null
    )
    or (
      breakdown_kind = 'impression_device'
      and publisher_platform is null
      and platform_position is null
      and device_platform is null
      and impression_device is not null
      and dimension_key = 'impression_device:' || impression_device
    )
  ),
  unique (
    account_id,
    ad_id,
    insight_date,
    breakdown_kind,
    dimension_key
  )
);

comment on table marketing.meta_ad_delivery_insights is
  'Read-only Meta Ads daily delivery aggregates. API receipt and stored insight rows do not prove provider attribution finality.';

create index if not exists meta_ad_delivery_insights_ad_date_idx
  on marketing.meta_ad_delivery_insights (ad_id, insight_date desc);

create index if not exists meta_ad_delivery_insights_date_breakdown_idx
  on marketing.meta_ad_delivery_insights (insight_date desc, breakdown_kind);

alter table marketing.meta_ad_delivery_insights enable row level security;

revoke all on table marketing.meta_ad_delivery_insights
  from public, anon, authenticated, service_role;

create or replace function ops.purge_expired_meta_ad_delivery_insights()
returns bigint
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_deleted bigint;
  v_now timestamptz := now();
begin
  delete from marketing.meta_ad_delivery_insights insight
  where insight.insight_date
      < (v_now at time zone 'UTC')::date - interval '14 months'
    and not ops.has_active_privacy_retention_exception(
      'marketing',
      'meta_ad_delivery_insights',
      insight.id::text,
      v_now
    );

  get diagnostics v_deleted = row_count;
  return v_deleted;
end;
$$;

comment on function ops.purge_expired_meta_ad_delivery_insights() is
  'Deletes Meta ad delivery aggregates after the approved 14-month analytics retention boundary unless a documented exception is active.';

revoke execute on function ops.purge_expired_meta_ad_delivery_insights()
  from public, anon, authenticated, service_role;
grant execute on function ops.purge_expired_meta_ad_delivery_insights()
  to postgres;

do $schedule_meta_ad_delivery_retention$
declare
  v_job_exists boolean;
begin
  if to_regclass('cron.job') is null then
    raise exception using
      errcode = '55000',
      message = 'pg_cron cron.job is required for Meta delivery retention';
  end if;

  execute $query$
    select exists (
      select 1
      from cron.job
      where jobname = 'purge_expired_meta_ad_delivery_insights'
    )
  $query$
    into v_job_exists;

  if not v_job_exists then
    execute $query$
      select cron.schedule($1, $2, $3)
    $query$
      using
        'purge_expired_meta_ad_delivery_insights',
        '45 3 * * *',
        'select ops.purge_expired_meta_ad_delivery_insights();';
  end if;
end
$schedule_meta_ad_delivery_retention$;
