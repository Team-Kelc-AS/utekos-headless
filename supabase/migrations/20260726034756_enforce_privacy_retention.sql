set lock_timeout = '5s';

create schema if not exists analytics;
create schema if not exists ops;

create table if not exists analytics.daily_privacy_safe_event_metrics (
  metric_date date not null,
  event_name text not null,
  event_count bigint not null check (event_count >= 0),
  first_occurred_at timestamptz not null,
  last_occurred_at timestamptz not null,
  aggregated_at timestamptz not null default statement_timestamp(),
  primary key (metric_date, event_name)
);

comment on table analytics.daily_privacy_safe_event_metrics is
  'Anonymous daily event totals. Direct identifiers, URLs, click ids, consent payloads and dimensions that permit singling out are forbidden.';

alter table analytics.daily_privacy_safe_event_metrics enable row level security;
alter table analytics.daily_privacy_safe_event_metrics force row level security;
revoke all on table analytics.daily_privacy_safe_event_metrics
  from public, anon, authenticated, service_role;
grant select on table analytics.daily_privacy_safe_event_metrics to service_role;

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

alter table ops.privacy_retention_exceptions enable row level security;
alter table ops.privacy_retention_exceptions force row level security;
revoke all on table ops.privacy_retention_exceptions
  from public, anon, authenticated, service_role;
grant select, insert, update, delete
  on table ops.privacy_retention_exceptions
  to service_role;

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

create or replace function ops.purge_expired_privacy_data()
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_now timestamptz := statement_timestamp();
  v_count bigint := 0;
  v_result jsonb := '{}'::jsonb;
begin
  delete from ops.privacy_retention_exceptions exception
  where exception.expires_at <= v_now;
  get diagnostics v_count = row_count;
  v_result := v_result || jsonb_build_object('expired_exceptions_deleted', v_count);

  with aggregate_source as (
    select ledger.id, ledger.event_name, ledger.occurred_at
    from marketing.event_ledger ledger
    where ledger.occurred_at < v_now - interval '14 months'
      and not ops.has_active_privacy_retention_exception(
        'marketing', 'event_ledger', ledger.id::text, v_now
      )
    union all
    select archive.id, archive.event_name, archive.occurred_at
    from analytics.event_ledger_archive archive
    where archive.occurred_at < v_now - interval '14 months'
      and not exists (
        select 1 from marketing.event_ledger ledger where ledger.id = archive.id
      )
      and not ops.has_active_privacy_retention_exception(
        'analytics', 'event_ledger_archive', archive.id::text, v_now
      )
  ),
  daily as (
    select
      occurred_at::date as metric_date,
      event_name,
      count(*)::bigint as event_count,
      min(occurred_at) as first_occurred_at,
      max(occurred_at) as last_occurred_at
    from aggregate_source
    group by occurred_at::date, event_name
  )
  insert into analytics.daily_privacy_safe_event_metrics (
    metric_date,
    event_name,
    event_count,
    first_occurred_at,
    last_occurred_at,
    aggregated_at
  )
  select
    metric_date,
    event_name,
    event_count,
    first_occurred_at,
    last_occurred_at,
    v_now
  from daily
  on conflict (metric_date, event_name) do update
  set
    event_count = analytics.daily_privacy_safe_event_metrics.event_count + excluded.event_count,
    first_occurred_at = least(
      analytics.daily_privacy_safe_event_metrics.first_occurred_at,
      excluded.first_occurred_at
    ),
    last_occurred_at = greatest(
      analytics.daily_privacy_safe_event_metrics.last_occurred_at,
      excluded.last_occurred_at
    ),
    aggregated_at = excluded.aggregated_at;
  get diagnostics v_count = row_count;
  v_result := v_result || jsonb_build_object('daily_metric_rows_upserted', v_count);

  update ops.provider_dispatch_attempts attempt
  set
    payload = '{}'::jsonb,
    response = '{}'::jsonb,
    last_error = null,
    request_id = null,
    updated_at = greatest(attempt.updated_at, v_now)
  where attempt.created_at < v_now - interval '90 days'
    and (
      attempt.payload <> '{}'::jsonb
      or attempt.response <> '{}'::jsonb
      or attempt.last_error is not null
      or attempt.request_id is not null
    )
    and not ops.has_active_privacy_retention_exception(
      'ops', 'provider_dispatch_attempts', attempt.id::text, v_now
    );
  get diagnostics v_count = row_count;
  v_result := v_result || jsonb_build_object('provider_payloads_redacted', v_count);

  update ops.dead_letter_events dead_letter
  set
    payload = '{}'::jsonb,
    metadata = '{}'::jsonb,
    resolution_note = null
  where dead_letter.created_at < v_now - interval '90 days'
    and (
      dead_letter.payload <> '{}'::jsonb
      or dead_letter.metadata <> '{}'::jsonb
      or dead_letter.resolution_note is not null
    )
    and not ops.has_active_privacy_retention_exception(
      'ops', 'dead_letter_events', dead_letter.id::text, v_now
    );
  get diagnostics v_count = row_count;
  v_result := v_result || jsonb_build_object('dead_letter_payloads_redacted', v_count);

  update ops.integration_events integration_event
  set payload = '{}'::jsonb, error_message = null
  where integration_event.created_at < v_now - interval '30 days'
    and (
      integration_event.payload <> '{}'::jsonb
      or integration_event.error_message is not null
    )
    and not ops.has_active_privacy_retention_exception(
      'ops', 'integration_events', integration_event.id::text, v_now
    );
  get diagnostics v_count = row_count;
  v_result := v_result || jsonb_build_object('integration_payloads_redacted', v_count);

  update marketing.meta_quality_snapshots snapshot
  set raw_payload = '{}'::jsonb
  where snapshot.measured_at < v_now - interval '90 days'
    and snapshot.raw_payload <> '{}'::jsonb
    and not ops.has_active_privacy_retention_exception(
      'marketing', 'meta_quality_snapshots', snapshot.id::text, v_now
    );
  get diagnostics v_count = row_count;
  v_result := v_result || jsonb_build_object('meta_quality_payloads_redacted', v_count);

  update marketing.campaign_insights insight
  set raw_payload = '{}'::jsonb
  where insight.fetched_at < v_now - interval '30 days'
    and insight.raw_payload <> '{}'::jsonb
    and not ops.has_active_privacy_retention_exception(
      'marketing', 'campaign_insights', insight.id::text, v_now
    );
  get diagnostics v_count = row_count;
  v_result := v_result || jsonb_build_object('campaign_payloads_redacted', v_count);

  update commerce.shopify_graphql_requests request
  set
    variables = '{}'::jsonb,
    request_body = '{}'::jsonb,
    response_headers = '{}'::jsonb,
    response_body = null,
    graphql_errors = '[]'::jsonb,
    error_message = null,
    updated_at = greatest(request.updated_at, v_now)
  where coalesce(request.collected_at, request.requested_at) < v_now - interval '30 days'
    and (
      request.variables <> '{}'::jsonb
      or request.request_body <> '{}'::jsonb
      or request.response_headers <> '{}'::jsonb
      or request.response_body is not null
      or request.graphql_errors <> '[]'::jsonb
      or request.error_message is not null
    )
    and not ops.has_active_privacy_retention_exception(
      'commerce', 'shopify_graphql_requests', request.id::text, v_now
    );
  get diagnostics v_count = row_count;
  v_result := v_result || jsonb_build_object('shopify_graphql_payloads_redacted', v_count);

  update commerce.shopify_order_snapshots snapshot
  set raw_payload = '{}'::jsonb, updated_at = greatest(snapshot.updated_at, v_now)
  where snapshot.synced_at < v_now - interval '30 days'
    and snapshot.raw_payload <> '{}'::jsonb
    and snapshot.shopify_order_id is not null
    and not ops.has_active_privacy_retention_exception(
      'commerce', 'shopify_order_snapshots', snapshot.id::text, v_now
    );
  get diagnostics v_count = row_count;
  v_result := v_result || jsonb_build_object('shopify_order_payloads_redacted', v_count);

  update commerce.shopify_order_line_items line_item
  set raw_payload = '{}'::jsonb, updated_at = greatest(line_item.updated_at, v_now)
  where line_item.synced_at < v_now - interval '30 days'
    and line_item.raw_payload <> '{}'::jsonb
    and line_item.shopify_line_item_id is not null
    and not ops.has_active_privacy_retention_exception(
      'commerce', 'shopify_order_line_items', line_item.id::text, v_now
    );
  get diagnostics v_count = row_count;
  v_result := v_result || jsonb_build_object('shopify_line_payloads_redacted', v_count);

  update commerce.shopify_order_snapshots snapshot
  set
    custom_attributes = '[]'::jsonb,
    customer_journey_summary = '{}'::jsonb,
    updated_at = greatest(snapshot.updated_at, v_now)
  where snapshot.synced_at < v_now - interval '14 months'
    and (
      snapshot.custom_attributes <> '[]'::jsonb
      or snapshot.customer_journey_summary <> '{}'::jsonb
    )
    and not ops.has_active_privacy_retention_exception(
      'commerce', 'shopify_order_snapshots', snapshot.id::text, v_now
    );
  get diagnostics v_count = row_count;
  v_result := v_result || jsonb_build_object('shopify_attribution_payloads_redacted', v_count);

  update marketing.leads lead
  set
    email = null,
    phone = null,
    first_name = null,
    last_name = null,
    campaign = null,
    medium = null,
    content = null,
    term = null,
    metadata = jsonb_strip_nulls(jsonb_build_object(
      'form_id', lead.metadata ->> 'form_id',
      'lead_type', lead.metadata ->> 'lead_type'
    )),
    updated_at = greatest(lead.updated_at, v_now)
  where lead.created_at < v_now - interval '14 months'
    and coalesce(lead.metadata ->> 'lead_type', '') <> 'product_waitlist'
    and (
      lead.email is not null
      or lead.phone is not null
      or lead.first_name is not null
      or lead.last_name is not null
      or lead.campaign is not null
      or lead.medium is not null
      or lead.content is not null
      or lead.term is not null
      or lead.metadata - 'form_id' - 'lead_type' <> '{}'::jsonb
    )
    and not ops.has_active_privacy_retention_exception(
      'marketing', 'leads', lead.id::text, v_now
    );
  get diagnostics v_count = row_count;
  v_result := v_result || jsonb_build_object('lead_identifiers_redacted', v_count);

  delete from marketing.attribution_events attribution
  where attribution.created_at < v_now - interval '14 months'
    and not ops.has_active_privacy_retention_exception(
      'marketing', 'attribution_events', attribution.id::text, v_now
    );
  get diagnostics v_count = row_count;
  v_result := v_result || jsonb_build_object('attribution_events_deleted', v_count);

  delete from marketing.website_visitor_events visitor_event
  where visitor_event.occurred_at < v_now - interval '14 months'
    and not ops.has_active_privacy_retention_exception(
      'marketing', 'website_visitor_events', visitor_event.id::text, v_now
    );
  get diagnostics v_count = row_count;
  v_result := v_result || jsonb_build_object('visitor_events_deleted', v_count);

  delete from marketing.checkout_attribution_snapshots snapshot
  where snapshot.captured_at < v_now - interval '14 months'
    and not ops.has_active_privacy_retention_exception(
      'marketing', 'checkout_attribution_snapshots', snapshot.id::text, v_now
    );
  get diagnostics v_count = row_count;
  v_result := v_result || jsonb_build_object('checkout_attribution_deleted', v_count);

  delete from marketing.consent_snapshots consent
  where consent.occurred_at < v_now - interval '3 years'
    and not ops.has_active_privacy_retention_exception(
      'marketing', 'consent_snapshots', consent.id::text, v_now
    );
  get diagnostics v_count = row_count;
  v_result := v_result || jsonb_build_object('consent_snapshots_deleted', v_count);

  delete from marketing.leads lead
  where (
      (
        lead.metadata ->> 'lead_type' = 'product_waitlist'
        and lead.created_at < v_now - interval '12 months'
      )
      or (
        coalesce(lead.metadata ->> 'lead_type', '') <> 'product_waitlist'
        and lead.created_at < v_now - interval '3 years'
      )
    )
    and not ops.has_active_privacy_retention_exception(
      'marketing', 'leads', lead.id::text, v_now
    );
  get diagnostics v_count = row_count;
  v_result := v_result || jsonb_build_object('expired_leads_deleted', v_count);

  delete from marketing.meta_high_value_customer_profiles profile
  where profile.refreshed_at < v_now - interval '14 months'
    and not ops.has_active_privacy_retention_exception(
      'marketing', 'meta_high_value_customer_profiles', profile.shopify_customer_id, v_now
    );
  get diagnostics v_count = row_count;
  v_result := v_result || jsonb_build_object('audience_profiles_deleted', v_count);

  delete from marketing.customer_source_meta_2025_raw source_row
  where source_row.imported_at < v_now - interval '30 days'
    and not ops.has_active_privacy_retention_exception(
      'marketing',
      'customer_source_meta_2025_raw',
      source_row.raw_id::text,
      v_now
    );
  get diagnostics v_count = row_count;
  v_result := v_result || jsonb_build_object('raw_audience_source_rows_deleted', v_count);

  delete from marketing.customer_identity_links identity_link
  where identity_link.linked_at < v_now - interval '14 months'
    and not ops.has_active_privacy_retention_exception(
      'marketing',
      'customer_identity_links',
      identity_link.link_id::text,
      v_now
    );
  get diagnostics v_count = row_count;
  v_result := v_result || jsonb_build_object('audience_identity_links_deleted', v_count);

  delete from marketing.customer_source_meta_2025 source_customer
  where source_customer.created_at < v_now - interval '14 months'
    and not ops.has_active_privacy_retention_exception(
      'marketing',
      'customer_source_meta_2025',
      source_customer.source_identity_id::text,
      v_now
    )
    and not exists (
      select 1
      from marketing.customer_identity_links identity_link
      where identity_link.source_identity_id = source_customer.source_identity_id
    );
  get diagnostics v_count = row_count;
  v_result := v_result || jsonb_build_object('normalized_audience_sources_deleted', v_count);

  delete from marketing.canonical_event_source_evidence evidence
  where evidence.source_observed_at < v_now - interval '14 months'
    and not ops.has_active_privacy_retention_exception(
      'marketing', 'canonical_event_source_evidence', evidence.id::text, v_now
    );
  get diagnostics v_count = row_count;
  v_result := v_result || jsonb_build_object('source_evidence_deleted', v_count);

  delete from ops.provider_dispatch_attempts attempt
  where attempt.created_at < v_now - interval '14 months'
    and not ops.has_active_privacy_retention_exception(
      'ops', 'provider_dispatch_attempts', attempt.id::text, v_now
    );
  get diagnostics v_count = row_count;
  v_result := v_result || jsonb_build_object('provider_attempts_deleted', v_count);

  delete from ops.dead_letter_events dead_letter
  where dead_letter.created_at < v_now - interval '14 months'
    and not ops.has_active_privacy_retention_exception(
      'ops', 'dead_letter_events', dead_letter.id::text, v_now
    );
  get diagnostics v_count = row_count;
  v_result := v_result || jsonb_build_object('dead_letters_deleted', v_count);

  delete from ops.integration_events integration_event
  where integration_event.created_at < v_now - interval '14 months'
    and not ops.has_active_privacy_retention_exception(
      'ops', 'integration_events', integration_event.id::text, v_now
    );
  get diagnostics v_count = row_count;
  v_result := v_result || jsonb_build_object('integration_events_deleted', v_count);

  delete from ops.web_vitals vital
  where vital.reported_at < v_now - interval '30 days'
    and not ops.has_active_privacy_retention_exception(
      'ops', 'web_vitals', vital.id::text, v_now
    );
  get diagnostics v_count = row_count;
  v_result := v_result || jsonb_build_object('web_vitals_deleted', v_count);

  delete from ops.tagging_observations observation
  where observation.observed_at < v_now - interval '14 months'
    and not ops.has_active_privacy_retention_exception(
      'ops', 'tagging_observations', observation.id::text, v_now
    );
  get diagnostics v_count = row_count;
  v_result := v_result || jsonb_build_object('tagging_observations_deleted', v_count);

  delete from analytics.event_ledger_archive archive
  where archive.occurred_at < v_now - interval '14 months'
    and not ops.has_active_privacy_retention_exception(
      'analytics', 'event_ledger_archive', archive.id::text, v_now
    );
  get diagnostics v_count = row_count;
  v_result := v_result || jsonb_build_object('ledger_archive_deleted', v_count);

  delete from marketing.event_ledger ledger
  where ledger.occurred_at < v_now - interval '14 months'
    and not ops.has_active_privacy_retention_exception(
      'marketing', 'event_ledger', ledger.id::text, v_now
    )
    and not exists (
      select 1
      from marketing.canonical_event_source_evidence evidence
      where evidence.canonical_idempotency_key = ledger.idempotency_key
    );
  get diagnostics v_count = row_count;
  v_result := v_result || jsonb_build_object('event_ledger_deleted', v_count);

  with expired_orders as (
    select snapshot.shop_domain, snapshot.shopify_order_id
    from commerce.shopify_order_snapshots snapshot
    where coalesce(snapshot.created_at_shopify, snapshot.created_at)
      < date_trunc('year', v_now) - interval '5 years'
      and not ops.has_active_privacy_retention_exception(
        'commerce', 'shopify_order_snapshots', snapshot.id::text, v_now
      )
  )
  delete from commerce.shopify_order_line_items line_item
  using expired_orders expired
  where line_item.shop_domain = expired.shop_domain
    and line_item.shopify_order_id = expired.shopify_order_id
    and not ops.has_active_privacy_retention_exception(
      'commerce', 'shopify_order_line_items', line_item.id::text, v_now
    );
  get diagnostics v_count = row_count;
  v_result := v_result || jsonb_build_object('expired_order_lines_deleted', v_count);

  delete from commerce.shopify_order_snapshots snapshot
  where coalesce(snapshot.created_at_shopify, snapshot.created_at)
      < date_trunc('year', v_now) - interval '5 years'
    and not ops.has_active_privacy_retention_exception(
      'commerce', 'shopify_order_snapshots', snapshot.id::text, v_now
    );
  get diagnostics v_count = row_count;
  v_result := v_result || jsonb_build_object('expired_orders_deleted', v_count);

  delete from marketing.shopify_customers customer
  where coalesce(customer.shopify_updated_at, customer.shopify_created_at)
      < date_trunc('year', v_now) - interval '5 years'
    and not ops.has_active_privacy_retention_exception(
      'marketing', 'shopify_customers', customer.shopify_customer_id, v_now
    )
    and not exists (
      select 1
      from marketing.customer_identity_links identity_link
      where identity_link.shopify_customer_id = customer.shopify_customer_id
    );
  get diagnostics v_count = row_count;
  v_result := v_result || jsonb_build_object('expired_customer_mirrors_deleted', v_count);

  return v_result;
end;
$$;

comment on function ops.purge_expired_privacy_data() is
  'Aggregates anonymous daily counts, redacts payloads at 30/90-day boundaries, and deletes personal data at documented retention limits in FK-safe order.';

revoke execute on function ops.purge_expired_privacy_data()
  from public, anon, authenticated;
grant execute on function ops.purge_expired_privacy_data()
  to service_role, postgres;

revoke execute on function marketing.refresh_meta_high_value_customer_audience()
  from service_role;
revoke select on table marketing.meta_high_value_customer_audience_export
  from service_role;
revoke select on table marketing.meta_customer_audience
  from service_role;

comment on function marketing.refresh_meta_high_value_customer_audience() is
  'Fail-closed for application roles until a verified marketing-consent join and documented audience refresh authorization are implemented.';

do $schedule_privacy_purge$
begin
  if exists (select 1 from pg_extension where extname = 'pg_cron')
    and not exists (
      select 1 from cron.job where jobname = 'purge_expired_privacy_data'
    ) then
    perform cron.schedule(
      'purge_expired_privacy_data',
      '35 3 * * *',
      $cron$select ops.purge_expired_privacy_data();$cron$
    );
  end if;
exception
  when others then
    raise notice 'purge_expired_privacy_data cron schedule skipped: %', sqlerrm;
end
$schedule_privacy_purge$;
