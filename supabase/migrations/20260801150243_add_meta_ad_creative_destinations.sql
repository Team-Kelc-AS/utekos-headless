create table if not exists marketing.meta_ad_creative_destinations (
  id uuid primary key default gen_random_uuid(),
  account_id text not null check (account_id ~ '^[0-9]+$'),
  ad_id text not null check (ad_id ~ '^[0-9]+$'),
  creative_id text not null check (creative_id ~ '^[0-9]+$'),
  api_version text not null default 'v26.0' check (api_version = 'v26.0'),
  ad_created_time timestamptz not null,
  ad_updated_time timestamptz not null,
  effective_status text not null check (
    char_length(btrim(effective_status)) between 1 and 120
  ),
  destination_url text check (
    destination_url is null
    or char_length(destination_url) between 1 and 8192
  ),
  normalized_destination_url text check (
    normalized_destination_url is null
    or char_length(normalized_destination_url) between 1 and 8192
  ),
  url_tags text check (
    url_tags is null
    or char_length(url_tags) between 0 and 8192
  ),
  source_kind text not null check (
    source_kind in (
      'asset_feed_link_url',
      'object_story_link_data',
      'object_story_template_data',
      'object_story_video_call_to_action',
      'object_url',
      'template_url_spec_web',
      'catalog_product_set',
      'unresolved'
    )
  ),
  source_path text not null check (
    char_length(btrim(source_path)) between 1 and 512
  ),
  dynamic_resolution_status text not null check (
    dynamic_resolution_status in (
      'static',
      'template',
      'deeplink',
      'catalog_dynamic',
      'unresolved'
    )
  ),
  destination_fingerprint text not null check (
    destination_fingerprint ~ '^[0-9a-f]{64}$'
  ),
  observed_version text not null check (
    observed_version ~ '^[0-9a-f]{64}$'
  ),
  observed_from timestamptz not null,
  observed_through timestamptz not null,
  observed_until timestamptz,
  effective_from timestamptz,
  effective_until timestamptz,
  effective_period_basis text not null default 'unknown' check (
    effective_period_basis in ('unknown', 'meta_activity')
  ),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint meta_ad_creative_destinations_ad_time_check check (
    ad_updated_time >= ad_created_time
  ),
  constraint meta_ad_creative_destinations_url_resolution_check check (
    (
      dynamic_resolution_status in ('static', 'template', 'deeplink')
      and destination_url is not null
      and normalized_destination_url is not null
    )
    or (
      dynamic_resolution_status in ('catalog_dynamic', 'unresolved')
      and destination_url is null
      and normalized_destination_url is null
    )
  ),
  constraint meta_ad_creative_destinations_source_resolution_check check (
    (
      source_kind = 'catalog_product_set'
      and dynamic_resolution_status = 'catalog_dynamic'
    )
    or (
      source_kind = 'unresolved'
      and dynamic_resolution_status = 'unresolved'
    )
    or (
      source_kind not in ('catalog_product_set', 'unresolved')
      and dynamic_resolution_status in ('static', 'template', 'deeplink')
    )
  ),
  constraint meta_ad_creative_destinations_observed_period_check check (
    observed_from <= observed_through
    and (observed_until is null or observed_through <= observed_until)
  ),
  constraint meta_ad_creative_destinations_effective_period_check check (
    (
      effective_period_basis = 'unknown'
      and effective_from is null
      and effective_until is null
    )
    or (
      effective_period_basis = 'meta_activity'
      and effective_from is not null
      and (effective_until is null or effective_from <= effective_until)
    )
  ),
  unique (
    account_id,
    ad_id,
    creative_id,
    observed_version,
    destination_fingerprint
  )
);

comment on table marketing.meta_ad_creative_destinations is
  'Read-only Meta Marketing API v25 creative-destination observations. Observed periods prove configuration visibility, not the exact URL delivered for an impression or click.';

comment on column marketing.meta_ad_creative_destinations.effective_period_basis is
  'unknown leaves effective timestamps null; meta_activity requires a provider activity event as the effective boundary.';

create index if not exists meta_ad_creative_destinations_ad_observed_idx
  on marketing.meta_ad_creative_destinations (
    account_id,
    ad_id,
    observed_from desc
  );

create index if not exists meta_ad_creative_destinations_url_observed_idx
  on marketing.meta_ad_creative_destinations (
    normalized_destination_url,
    observed_from desc
  )
  where normalized_destination_url is not null;

create index if not exists meta_ad_creative_destinations_open_version_idx
  on marketing.meta_ad_creative_destinations (
    account_id,
    ad_id,
    observed_version
  )
  where observed_until is null;

alter table marketing.meta_ad_creative_destinations enable row level security;

revoke all on table marketing.meta_ad_creative_destinations
  from public, anon, authenticated, service_role;

create or replace function ops.purge_expired_meta_ad_creative_destinations()
returns bigint
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_deleted bigint;
  v_now timestamptz := now();
begin
  delete from marketing.meta_ad_creative_destinations destination
  where destination.observed_through < v_now - interval '14 months'
    and not ops.has_active_privacy_retention_exception(
      'marketing',
      'meta_ad_creative_destinations',
      destination.id::text,
      v_now
    );

  get diagnostics v_deleted = row_count;
  return v_deleted;
end;
$$;

comment on function ops.purge_expired_meta_ad_creative_destinations() is
  'Deletes Meta creative-destination observations 14 months after their last observation unless a documented exception is active.';

revoke execute on function ops.purge_expired_meta_ad_creative_destinations()
  from public, anon, authenticated, service_role;
grant execute on function ops.purge_expired_meta_ad_creative_destinations()
  to postgres;

do $schedule_meta_ad_creative_destination_retention$
declare
  v_job_exists boolean;
begin
  if to_regclass('cron.job') is null then
    raise exception using
      errcode = '55000',
      message = 'pg_cron cron.job is required for Meta creative-destination retention';
  end if;

  execute $query$
    select exists (
      select 1
      from cron.job
      where jobname = 'purge_expired_meta_ad_creative_destinations'
    )
  $query$
    into v_job_exists;

  if not v_job_exists then
    execute $query$
      select cron.schedule($1, $2, $3)
    $query$
      using
        'purge_expired_meta_ad_creative_destinations',
        '50 3 * * *',
        'select ops.purge_expired_meta_ad_creative_destinations();';
  end if;
end
$schedule_meta_ad_creative_destination_retention$;
