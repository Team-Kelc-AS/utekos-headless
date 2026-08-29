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

-- STEG 2: Atomic shadow enqueue of qualified Dun leads to PGMQ.
-- Fail-closed: pgmq.send failure aborts the lead INSERT transaction.
create or replace function marketing.enqueue_shopify_dun_waitlist_sync_on_lead_insert()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.source = 'product_waitlist_utekos_dun'
    and new.email is not null
    and btrim(new.email) <> ''
  then
    perform pgmq.send(
      'shopify_dun_waitlist_sync',
      jsonb_build_object(
        'schema_version', 1,
        'lead_id', new.id
      )
    );
  end if;

  return new;
end;
$$;

comment on function marketing.enqueue_shopify_dun_waitlist_sync_on_lead_insert() is
  'STEG 2 shadow enqueue: AFTER INSERT on marketing.leads sends a minimal PGMQ message for qualified Dun waitlist leads. Messages are not consumed yet.';

revoke all on function marketing.enqueue_shopify_dun_waitlist_sync_on_lead_insert()
  from public;

revoke execute on function marketing.enqueue_shopify_dun_waitlist_sync_on_lead_insert()
  from public, anon, authenticated;

drop trigger if exists enqueue_shopify_dun_waitlist_sync_after_insert
  on marketing.leads;

create trigger enqueue_shopify_dun_waitlist_sync_after_insert
after insert on marketing.leads
for each row
execute function marketing.enqueue_shopify_dun_waitlist_sync_on_lead_insert();

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
create table if not exists marketing.provisional_page_view_captures (
  event_id uuid primary key,
  page_view_id uuid not null,
  edge_request_id uuid,
  capture_state text not null
    check (capture_state in ('pending', 'denied', 'granted')),
  payload jsonb not null,
  occurred_at timestamptz not null,
  capture_count integer not null default 1
    check (capture_count >= 1),
  captured_at timestamptz not null default statement_timestamp(),
  updated_at timestamptz not null default statement_timestamp(),
  expires_at timestamptz not null
    default (statement_timestamp() + interval '24 hours'),
  constraint provisional_page_view_captures_payload_identity_check
    check (
      payload ->> 'event_name' = 'page_view'
      and payload ->> 'event_id' = event_id::text
      and payload ->> 'page_view_id' = page_view_id::text
      and (
        edge_request_id is null
        or payload ->> 'edge_request_id' = edge_request_id::text
      )
    ),
  constraint provisional_page_view_captures_retention_check
    check (
      updated_at >= captured_at
      and expires_at > updated_at
      and expires_at <= updated_at + interval '24 hours 5 minutes'
    )
);
comment on table marketing.provisional_page_view_captures is
  'Server-only, 24-hour consent buffer for canonical page_view capture. It may temporarily contain source URLs and advertising click identifiers, but it never creates provider dispatch attempts and is deleted immediately after canonical consented acceptance.';
comment on column marketing.provisional_page_view_captures.capture_state is
  'Cookiebot decision state observed by the browser. pending and denied rows remain provider-ineligible; granted rows are released after canonical acceptance.';
create index if not exists provisional_page_view_captures_state_idx
  on marketing.provisional_page_view_captures (
    capture_state,
    captured_at desc
  );
create index if not exists provisional_page_view_captures_edge_idx
  on marketing.provisional_page_view_captures (
    edge_request_id,
    occurred_at desc
  )
  where edge_request_id is not null;
create index if not exists provisional_page_view_captures_expiry_idx
  on marketing.provisional_page_view_captures (expires_at);
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
create table if not exists marketing.meta_ad_creative_destinations (
  id uuid primary key default gen_random_uuid(),
  account_id text not null check (account_id ~ '^[0-9]+$'),
  ad_id text not null check (ad_id ~ '^[0-9]+$'),
  creative_id text not null check (creative_id ~ '^[0-9]+$'),
  api_version text not null default 'v26.0' check (api_version ~ '^v[0-9]+\.[0-9]+$'),
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
  on marketing.meta_ad_creative_destinations (account_id, ad_id, observed_from desc);
create index if not exists meta_ad_creative_destinations_url_observed_idx
  on marketing.meta_ad_creative_destinations (normalized_destination_url, observed_from desc)
  where normalized_destination_url is not null;
create index if not exists meta_ad_creative_destinations_open_version_idx
  on marketing.meta_ad_creative_destinations (account_id, ad_id, observed_version)
  where observed_until is null;
create table if not exists marketing.facebook_login_identities (
  id uuid primary key default gen_random_uuid(),
  app_id text not null
    check (app_id ~ '^[0-9]{1,64}$'),
  facebook_login_id text not null
    check (facebook_login_id ~ '^[0-9]{1,64}$'),
  external_id text not null
    check (
      external_id ~ '^anon_[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
    ),
  email_ciphertext text
    check (
      email_ciphertext is null
      or email_ciphertext ~ '^v1\.[A-Za-z0-9_-]{16}\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]{22}$'
    ),
  email_sha256 text
    check (
      email_sha256 is null
      or email_sha256 ~ '^[a-f0-9]{64}$'
    ),
  phone_ciphertext text
    check (
      phone_ciphertext is null
      or phone_ciphertext ~ '^v1\.[A-Za-z0-9_-]{16}\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]{22}$'
    ),
  phone_sha256 text
    check (
      phone_sha256 is null
      or phone_sha256 ~ '^[a-f0-9]{64}$'
    ),
  email_permission_granted boolean not null default false,
  fbclid text check (fbclid is null or length(fbclid) between 1 and 500),
  fbc text check (fbc is null or length(fbc) between 1 and 500),
  campaign_id text check (campaign_id is null or length(campaign_id) between 1 and 500),
  campaign_name text check (campaign_name is null or length(campaign_name) between 1 and 500),
  adset_id text check (adset_id is null or length(adset_id) between 1 and 500),
  adset_name text check (adset_name is null or length(adset_name) between 1 and 500),
  ad_id text check (ad_id is null or length(ad_id) between 1 and 500),
  ad_name text check (ad_name is null or length(ad_name) between 1 and 500),
  login_count integer not null default 1 check (login_count >= 1),
  first_login_at timestamptz not null default statement_timestamp(),
  last_login_at timestamptz not null default statement_timestamp(),
  contact_updated_at timestamptz,
  created_at timestamptz not null default statement_timestamp(),
  updated_at timestamptz not null default statement_timestamp(),
  expires_at timestamptz not null
    default (statement_timestamp() + interval '180 days'),
  unique (app_id, facebook_login_id),
  constraint facebook_login_identities_email_pair_check
    check ((email_ciphertext is null) = (email_sha256 is null)),
  constraint facebook_login_identities_phone_pair_check
    check ((phone_ciphertext is null) = (phone_sha256 is null)),
  constraint facebook_login_identities_retention_check
    check (
      last_login_at >= first_login_at
      and updated_at >= created_at
      and expires_at > updated_at
      and expires_at <= updated_at + interval '180 days 5 minutes'
    )
);
comment on table marketing.facebook_login_identities is
  'Service-role-only Facebook Login identity bridge for voluntary Meta-origin login. Stores app-scoped ID, encrypted contact data, provider-ready hashes and acquisition identifiers. Never stores Facebook access tokens and never creates Shopify customers.';
comment on column marketing.facebook_login_identities.email_ciphertext is
  'AES-256-GCM application-encrypted normalized email. Plaintext email is forbidden.';
comment on column marketing.facebook_login_identities.phone_ciphertext is
  'AES-256-GCM application-encrypted E.164 phone. Plaintext phone is forbidden.';
create index if not exists facebook_login_identities_external_id_idx
  on marketing.facebook_login_identities (external_id, last_login_at desc);
create index if not exists facebook_login_identities_email_sha256_idx
  on marketing.facebook_login_identities (email_sha256)
  where email_sha256 is not null;
create index if not exists facebook_login_identities_phone_sha256_idx
  on marketing.facebook_login_identities (phone_sha256)
  where phone_sha256 is not null;
create index if not exists facebook_login_identities_expires_at_idx
  on marketing.facebook_login_identities (expires_at);
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
