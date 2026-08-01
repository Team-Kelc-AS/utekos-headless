create table if not exists marketing.leads (
  id uuid primary key default gen_random_uuid(),
  email text,
  phone text,
  first_name text,
  last_name text,
  source text not null default 'unknown',
  campaign text,
  medium text,
  content text,
  term text,
  consent_marketing boolean not null default false,
  consent_source text,
  consented_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists leads_created_at_idx on marketing.leads (created_at desc);
create index if not exists leads_email_idx on marketing.leads (email)
where email is not null;
create table if not exists marketing.attribution_events (
  id uuid primary key default gen_random_uuid(),
  anonymous_id text,
  lead_id uuid references marketing.leads(id) on delete
  set null,
    source text,
    medium text,
    campaign text,
    content text,
    term text,
    landing_path text,
    referrer text,
    user_agent text,
    metadata jsonb not null default '{}'::jsonb,
    created_at timestamptz not null default now()
);
create index if not exists attribution_events_created_at_idx on marketing.attribution_events (created_at desc);
create index if not exists attribution_events_anonymous_id_idx on marketing.attribution_events (anonymous_id)
where anonymous_id is not null;
create index if not exists attribution_events_lead_id_idx on marketing.attribution_events (lead_id)
where lead_id is not null;
create table if not exists marketing.website_visitor_events (
  id uuid primary key default gen_random_uuid(),
  source_project text not null default 'utekos-headless',
  visitor_id text not null,
  session_id text,
  pathname text,
  referrer text,
  user_agent text,
  occurred_at timestamptz not null,
  created_at timestamptz not null default now()
);
create index if not exists website_visitor_events_visitor_idx on marketing.website_visitor_events (visitor_id, occurred_at desc);
create index if not exists website_visitor_events_session_idx on marketing.website_visitor_events (session_id, occurred_at desc)
where session_id is not null;
create index if not exists website_visitor_events_pathname_idx on marketing.website_visitor_events (pathname, occurred_at desc)
where pathname is not null;
create table if not exists marketing.consent_snapshots (
  id uuid primary key default gen_random_uuid(),
  anonymous_id text,
  external_id text,
  categories jsonb not null default '{}'::jsonb,
  source text not null default 'website',
  occurred_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);
create index if not exists consent_snapshots_anonymous_id_idx on marketing.consent_snapshots (anonymous_id, occurred_at desc)
where anonymous_id is not null;
create index if not exists consent_snapshots_external_id_idx on marketing.consent_snapshots (external_id, occurred_at desc)
where external_id is not null;
create table if not exists marketing.event_ledger (
  id uuid primary key default gen_random_uuid(),
  event_id text not null,
  event_name text not null,
  idempotency_key text not null unique,
  anonymous_id text,
  external_id text,
  source_url text,
  consent jsonb not null default '{}'::jsonb,
  user_data_quality jsonb not null default '{}'::jsonb,
  payload jsonb not null default '{}'::jsonb,
  occurred_at timestamptz not null,
  created_at timestamptz not null default now()
);
create index if not exists event_ledger_event_id_idx on marketing.event_ledger (event_id);
create index if not exists event_ledger_event_name_idx on marketing.event_ledger (event_name, occurred_at desc);
create index if not exists event_ledger_created_at_idx on marketing.event_ledger (created_at desc);
create table if not exists marketing.canonical_event_source_evidence (
  id uuid primary key default gen_random_uuid(),
  canonical_event_id text not null,
  canonical_event_name text not null,
  canonical_idempotency_key text not null,
  observation_key text not null unique,
  source_system text not null,
  source_method text not null,
  source_object_type text not null,
  source_object_id text not null,
  source_topic text not null,
  source_delivery_id text,
  source_event_id text,
  source_api_version text not null,
  source_triggered_at timestamptz not null,
  source_observed_at timestamptz not null,
  observation_count integer not null default 1
    check (observation_count >= 1),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint canonical_event_source_evidence_ledger_fkey
    foreign key (canonical_idempotency_key)
    references marketing.event_ledger(idempotency_key)
    on delete restrict
);
comment on table marketing.canonical_event_source_evidence is
  'Provider-neutral commerce source correlation. Raw bodies, authentication material and customer data are forbidden.';
create index if not exists canonical_event_source_evidence_event_idx
  on marketing.canonical_event_source_evidence (
    canonical_event_id,
    source_observed_at desc
  );
create index if not exists canonical_event_source_evidence_object_idx
  on marketing.canonical_event_source_evidence (
    source_system,
    source_object_type,
    source_object_id,
    source_observed_at desc
  );
create index if not exists canonical_event_source_evidence_source_event_idx
  on marketing.canonical_event_source_evidence (
    source_system,
    source_event_id
  )
  where source_event_id is not null;
create table if not exists marketing.meta_quality_snapshots (
  id uuid primary key default gen_random_uuid(),
  dataset_id text not null,
  event_name text,
  event_match_quality numeric,
  event_coverage numeric,
  dedup_key_feedback jsonb not null default '{}'::jsonb,
  data_freshness jsonb not null default '{}'::jsonb,
  raw_payload jsonb not null default '{}'::jsonb,
  measured_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);
create index if not exists meta_quality_snapshots_dataset_idx on marketing.meta_quality_snapshots (dataset_id, measured_at desc);
create table if not exists marketing.campaign_insights (
  id uuid primary key default gen_random_uuid(),
  campaign_id text not null,
  campaign_name text,
  adset_id text,
  adset_name text,
  ad_id text,
  ad_name text,
  date_start date not null,
  date_stop date not null,
  impressions integer not null default 0,
  clicks integer not null default 0,
  spend numeric not null default 0,
  cpc numeric,
  ctr numeric,
  roas numeric,
  demographics jsonb not null default '{}'::jsonb,
  raw_payload jsonb not null default '{}'::jsonb,
  fetched_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique(
    campaign_id,
    adset_id,
    ad_id,
    date_start,
    date_stop
  )
);
create index if not exists campaign_insights_campaign_date_idx on marketing.campaign_insights (campaign_id, date_start desc);
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
create table if not exists marketing.checkout_attribution_snapshots (
  id uuid primary key default gen_random_uuid(),
  idempotency_key text not null unique,
  primary_storage_token text,
  storage_tokens text[] not null default '{}'::text[],
  cart_id text,
  checkout_url text,
  event_id text,
  ga_client_id text,
  ga_session_id text,
  gclid text,
  gbraid text,
  wbraid text,
  msclkid text,
  dclid text,
  fbp text,
  fbc text,
  external_id text,
  email_hash text,
  client_ip_address text,
  client_user_agent text,
  user_data_quality jsonb not null default '{}'::jsonb,
  user_data jsonb not null default '{}'::jsonb,
  raw_payload jsonb not null default '{}'::jsonb,
  captured_at timestamptz not null,
  first_seen_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint checkout_attribution_snapshots_storage_tokens_check
    check (cardinality(storage_tokens) > 0)
);
create unique index if not exists checkout_attribution_snapshots_event_id_idx on marketing.checkout_attribution_snapshots (event_id)
where event_id is not null;
create index if not exists checkout_attribution_snapshots_cart_id_idx on marketing.checkout_attribution_snapshots (cart_id, updated_at desc)
where cart_id is not null;
create index if not exists checkout_attribution_snapshots_ga_client_idx on marketing.checkout_attribution_snapshots (ga_client_id, updated_at desc)
where ga_client_id is not null;
create index if not exists checkout_attribution_snapshots_paid_click_idx on marketing.checkout_attribution_snapshots (gclid, gbraid, wbraid, msclkid, dclid)
where gclid is not null
  or gbraid is not null
  or wbraid is not null
  or msclkid is not null
  or dclid is not null;
create table if not exists marketing.checkout_attribution_lookup_tokens (
  token text primary key,
  snapshot_id uuid not null references marketing.checkout_attribution_snapshots(id) on delete cascade,
  token_kind text not null default 'unknown'
    check (token_kind in ('checkout_key', 'checkout_token', 'cart_token', 'cart_id', 'unknown')),
  first_seen_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists checkout_attribution_lookup_tokens_snapshot_idx on marketing.checkout_attribution_lookup_tokens (snapshot_id, updated_at desc);
revoke all on table marketing.checkout_attribution_snapshots from anon, authenticated;
revoke all on table marketing.checkout_attribution_lookup_tokens from anon, authenticated;
revoke all on table marketing.canonical_event_source_evidence from public, anon, authenticated, service_role;
grant usage on schema marketing to service_role;
grant select, insert, update on marketing.checkout_attribution_snapshots to service_role;
grant select, insert, update on marketing.checkout_attribution_lookup_tokens to service_role;
grant select, insert, update on marketing.canonical_event_source_evidence to service_role;
