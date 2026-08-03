set lock_timeout = '5s';

create table if not exists ops.shopify_checkout_observations (
  id uuid primary key default gen_random_uuid(),
  idempotency_key text not null unique,
  payload_sha256 text not null,
  contract_name text not null
    default 'utekos.shopify.checkout_observation'
    check (contract_name = 'utekos.shopify.checkout_observation'),
  schema_version smallint not null default 1
    check (schema_version = 1),
  source text not null default 'shopify_app_web_pixel'
    check (source = 'shopify_app_web_pixel'),
  verification_status text not null default 'observed'
    check (verification_status = 'observed'),
  event_name text not null
    check (
      event_name in (
        'checkout_shipping_info_submitted',
        'payment_info_submitted',
        'alert_displayed'
      )
    ),
  event_id text not null,
  event_sequence integer not null
    check (event_sequence between 0 and 2147483647),
  occurred_at timestamptz not null,
  analytics_processing_allowed boolean not null,
  marketing_allowed boolean not null,
  preferences_processing_allowed boolean not null,
  sale_of_data_allowed boolean not null,
  checkout_token text,
  currency_code text,
  commerce_value double precision,
  item_quantity integer,
  alert_type text,
  first_observed_at timestamptz not null default statement_timestamp(),
  last_observed_at timestamptz not null default statement_timestamp(),
  observation_count integer not null default 1
    check (observation_count >= 1),
  created_at timestamptz not null default statement_timestamp(),
  updated_at timestamptz not null default statement_timestamp(),
  constraint shopify_checkout_observations_idempotency_key_check
    check (
      idempotency_key = concat_ws(
        ':',
        contract_name,
        schema_version::text,
        source,
        event_name,
        event_id
      )
      and length(idempotency_key) between 1 and 1024
    ),
  constraint shopify_checkout_observations_payload_sha256_check
    check (payload_sha256 ~ '^[a-f0-9]{64}$'),
  constraint shopify_checkout_observations_event_id_check
    check (length(event_id) between 1 and 255),
  constraint shopify_checkout_observations_checkout_token_check
    check (
      checkout_token is null
      or length(checkout_token) between 1 and 255
    ),
  constraint shopify_checkout_observations_currency_check
    check (currency_code is null or currency_code ~ '^[A-Z]{3}$'),
  constraint shopify_checkout_observations_value_check
    check (
      commerce_value is null
      or (
        commerce_value >= 0
        and commerce_value::text not in ('NaN', 'Infinity', '-Infinity')
      )
    ),
  constraint shopify_checkout_observations_quantity_check
    check (
      item_quantity is null
      or item_quantity between 0 and 1000000
    ),
  constraint shopify_checkout_observations_shape_check
    check (
      (
        event_name in (
          'checkout_shipping_info_submitted',
          'payment_info_submitted'
        )
        and checkout_token is not null
        and item_quantity is not null
        and alert_type is null
        and (commerce_value is null or currency_code is not null)
      )
      or (
        event_name = 'alert_displayed'
        and alert_type in ('CHECKOUT_ERROR', 'PAYMENT_ERROR')
        and checkout_token is null
        and currency_code is null
        and commerce_value is null
        and item_quantity is null
      )
    ),
  constraint shopify_checkout_observations_observation_window_check
    check (last_observed_at >= first_observed_at),
  constraint shopify_checkout_observations_update_window_check
    check (updated_at >= created_at)
);

comment on table ops.shopify_checkout_observations is
  'Thirty-day, PII-free Shopify Web Pixel checkout observations. Rows are public browser observations only: they are not canonical events, payment truth, provider outbox entries or delivery evidence. Raw payloads, names, email, phone, addresses, URLs, query strings, cookies, click ids, client ids, user agents, line items, payment methods, gateways, alert text and provider data are forbidden.';
comment on column ops.shopify_checkout_observations.idempotency_key is
  'Versioned source identity. A matching payload hash is an identical replay; a different hash is an idempotency conflict and must never overwrite the first observation.';
comment on column ops.shopify_checkout_observations.payload_sha256 is
  'SHA-256 of the strictly validated v1 observation used only for replay equality and conflict detection.';
comment on column ops.shopify_checkout_observations.checkout_token is
  'Pseudonymous Shopify checkout correlation token from the allowlisted contract; customer and payment data are forbidden.';
comment on column ops.shopify_checkout_observations.verification_status is
  'Always observed. This table cannot represent canonical acceptance or provider delivery.';

create index if not exists shopify_checkout_observations_event_idx
  on ops.shopify_checkout_observations (event_name, occurred_at desc);
create index if not exists shopify_checkout_observations_checkout_idx
  on ops.shopify_checkout_observations (checkout_token, occurred_at desc)
  where checkout_token is not null;
create index if not exists shopify_checkout_observations_last_observed_idx
  on ops.shopify_checkout_observations (last_observed_at desc);

create or replace function ops.enforce_shopify_checkout_observation_replay()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if row(
    new.id,
    new.idempotency_key,
    new.payload_sha256,
    new.contract_name,
    new.schema_version,
    new.source,
    new.verification_status,
    new.event_name,
    new.event_id,
    new.event_sequence,
    new.occurred_at,
    new.analytics_processing_allowed,
    new.marketing_allowed,
    new.preferences_processing_allowed,
    new.sale_of_data_allowed,
    new.checkout_token,
    new.currency_code,
    new.commerce_value,
    new.item_quantity,
    new.alert_type,
    new.first_observed_at,
    new.created_at
  ) is distinct from row(
    old.id,
    old.idempotency_key,
    old.payload_sha256,
    old.contract_name,
    old.schema_version,
    old.source,
    old.verification_status,
    old.event_name,
    old.event_id,
    old.event_sequence,
    old.occurred_at,
    old.analytics_processing_allowed,
    old.marketing_allowed,
    old.preferences_processing_allowed,
    old.sale_of_data_allowed,
    old.checkout_token,
    old.currency_code,
    old.commerce_value,
    old.item_quantity,
    old.alert_type,
    old.first_observed_at,
    old.created_at
  ) then
    raise exception using
      errcode = '23514',
      message = 'Shopify checkout observation identity and payload are immutable';
  end if;

  if new.observation_count <> old.observation_count + 1
    or new.last_observed_at < old.last_observed_at
    or new.updated_at < old.updated_at then
    raise exception using
      errcode = '23514',
      message = 'Shopify checkout observation replay counters must advance monotonically';
  end if;

  return new;
end;
$$;

comment on function ops.enforce_shopify_checkout_observation_replay() is
  'Allows only monotonic replay bookkeeping updates. The first validated observation, its idempotency identity and its payload hash are immutable.';

revoke execute on function ops.enforce_shopify_checkout_observation_replay()
  from public, anon, authenticated;

drop trigger if exists enforce_shopify_checkout_observation_replay
  on ops.shopify_checkout_observations;
create trigger enforce_shopify_checkout_observation_replay
before update on ops.shopify_checkout_observations
for each row
execute function ops.enforce_shopify_checkout_observation_replay();

alter table ops.shopify_checkout_observations enable row level security;
alter table ops.shopify_checkout_observations force row level security;
revoke all on table ops.shopify_checkout_observations
  from public, anon, authenticated, service_role;
grant usage on schema ops to service_role;
grant select, insert, update on table ops.shopify_checkout_observations
  to service_role;

create or replace function ops.purge_expired_shopify_checkout_observations()
returns bigint
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_deleted bigint := 0;
  v_now timestamptz := statement_timestamp();
begin
  delete from ops.shopify_checkout_observations observation
  where observation.last_observed_at < v_now - interval '30 days'
    and not ops.has_active_privacy_retention_exception(
      'ops',
      'shopify_checkout_observations',
      observation.id::text,
      v_now
    );

  get diagnostics v_deleted = row_count;
  return v_deleted;
end;
$$;

comment on function ops.purge_expired_shopify_checkout_observations() is
  'Deletes PII-free Shopify checkout observations after 30 days unless a time-limited retention exception is active.';

revoke execute on function ops.purge_expired_shopify_checkout_observations()
  from public, anon, authenticated;
grant execute on function ops.purge_expired_shopify_checkout_observations()
  to service_role, postgres;

do $schedule_shopify_checkout_observation_purge$
declare
  v_job_exists boolean;
begin
  if to_regclass('cron.job') is null then
    raise exception using
      errcode = '55000',
      message = 'pg_cron cron.job is required for Shopify checkout observation retention';
  end if;

  execute $query$
    select exists (
      select 1
      from cron.job
      where jobname = 'purge_expired_shopify_checkout_observations'
    )
  $query$ into v_job_exists;

  if not v_job_exists then
    perform cron.schedule(
      'purge_expired_shopify_checkout_observations',
      '47 3 * * *',
      'select ops.purge_expired_shopify_checkout_observations();'
    );
  end if;
end;
$schedule_shopify_checkout_observation_purge$;
