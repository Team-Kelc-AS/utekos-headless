create table ops.shopify_checkout_recovery_evidence (
  idempotency_key text primary key,
  payload_sha256 text not null,
  contract_name text not null,
  schema_version integer not null,
  source text not null,
  verification_status text not null,
  event_id text not null,
  event_name text not null,
  event_sequence integer,
  occurred_at timestamptz not null,
  checkout_created_at timestamptz,
  checkout_token text not null,
  begin_checkout_event_id uuid not null,
  recipient_fingerprint text not null,
  buyer_accepts_email_marketing boolean not null,
  buyer_accepts_sms_marketing boolean,
  has_contact_phone boolean,
  has_first_name boolean,
  has_last_name boolean,
  has_address1 boolean,
  has_address2 boolean,
  has_city boolean,
  has_country_code boolean,
  has_postal_code boolean,
  has_shipping_phone boolean,
  shop_domain text,
  observation_count integer not null default 1,
  first_observed_at timestamptz not null default statement_timestamp(),
  last_observed_at timestamptz not null default statement_timestamp(),
  expires_at timestamptz not null,
  created_at timestamptz not null default statement_timestamp(),
  updated_at timestamptz not null default statement_timestamp(),

  constraint shopify_checkout_recovery_evidence_payload_sha256_check
    check (payload_sha256 ~ '^[a-f0-9]{64}$'),
  constraint shopify_checkout_recovery_evidence_contract_check
    check (contract_name = 'utekos.shopify.checkout_recovery_evidence'),
  constraint shopify_checkout_recovery_evidence_schema_check
    check (schema_version in (1, 2)),
  constraint shopify_checkout_recovery_evidence_source_check
    check (
      source in (
        'shopify_app_web_pixel',
        'shopify_checkouts_update_webhook'
      )
    ),
  constraint shopify_checkout_recovery_evidence_verification_check
    check (
      verification_status in (
        'observed',
        'shopify_hmac_verified'
      )
    ),
  constraint shopify_checkout_recovery_evidence_event_id_check
    check (length(event_id) between 1 and 255),
  constraint shopify_checkout_recovery_evidence_event_name_check
    check (
      event_name in (
        'checkout_contact_info_submitted',
        'checkout_address_info_submitted',
        'checkouts/update'
      )
    ),
  constraint shopify_checkout_recovery_evidence_event_sequence_check
    check (
      event_sequence is null
      or event_sequence between 0 and 2147483647
    ),
  constraint shopify_checkout_recovery_evidence_checkout_token_check
    check (length(checkout_token) between 1 and 255),
  constraint shopify_checkout_recovery_evidence_recipient_check
    check (recipient_fingerprint ~ '^[a-f0-9]{64}$'),
  constraint shopify_checkout_recovery_evidence_observation_count_check
    check (observation_count > 0),
  constraint shopify_checkout_recovery_evidence_shop_domain_check
    check (
      shop_domain is null
      or shop_domain ~ '^[a-z0-9][a-z0-9-]*\.myshopify\.com$'
    ),
  constraint shopify_checkout_recovery_evidence_shape_check
    check (
      (
        schema_version = 1
        and source = 'shopify_app_web_pixel'
        and verification_status = 'observed'
        and event_name in (
          'checkout_contact_info_submitted',
          'checkout_address_info_submitted'
        )
        and event_sequence is not null
        and checkout_created_at is null
        and buyer_accepts_sms_marketing is not null
        and has_contact_phone is not null
        and has_first_name is not null
        and has_last_name is not null
        and has_address1 is not null
        and has_address2 is not null
        and has_city is not null
        and has_country_code is not null
        and has_postal_code is not null
        and has_shipping_phone is not null
        and shop_domain is null
      )
      or (
        schema_version = 2
        and source = 'shopify_checkouts_update_webhook'
        and verification_status = 'shopify_hmac_verified'
        and event_name = 'checkouts/update'
        and event_sequence is null
        and checkout_created_at is not null
        and occurred_at >= checkout_created_at
        and buyer_accepts_sms_marketing is null
        and has_contact_phone is null
        and has_first_name is null
        and has_last_name is null
        and has_address1 is null
        and has_address2 is null
        and has_city is null
        and has_country_code is null
        and has_postal_code is null
        and has_shipping_phone is null
        and shop_domain is not null
      )
    ),
  constraint shopify_checkout_recovery_evidence_retention_check
    check (
      expires_at > occurred_at
      and expires_at <= occurred_at + interval '8 days'
    )
);

create index shopify_checkout_recovery_evidence_match_idx
  on ops.shopify_checkout_recovery_evidence (
    begin_checkout_event_id,
    recipient_fingerprint,
    event_sequence desc,
    occurred_at desc
  );

create index shopify_checkout_recovery_evidence_expiry_idx
  on ops.shopify_checkout_recovery_evidence (expires_at);

create index shopify_checkout_recovery_verified_match_idx
  on ops.shopify_checkout_recovery_evidence (
    begin_checkout_event_id,
    recipient_fingerprint,
    occurred_at desc,
    event_id desc
  )
  where schema_version = 2
    and source = 'shopify_checkouts_update_webhook'
    and verification_status = 'shopify_hmac_verified';

alter table ops.shopify_checkout_recovery_evidence
  enable row level security;

revoke all
  on table ops.shopify_checkout_recovery_evidence
  from public, anon, authenticated;

grant select, insert, delete
  on table ops.shopify_checkout_recovery_evidence
  to service_role;

comment on table ops.shopify_checkout_recovery_evidence is
  'Eight-day, service-role-only Shopify checkout recovery evidence. Schema v1 Web Pixel rows are diagnostic observed signals. Only schema v2 HMAC-verified checkouts/update webhook rows can authorize the NOT_SUBSCRIBED exception. Email is stored only as a keyed HMAC fingerprint; raw names, address lines and phone numbers are forbidden.';

comment on column ops.shopify_checkout_recovery_evidence.verification_status is
  'Observed means Shopify emitted the event. It does not claim that a delivery address was positively validated or approved.';

create or replace function
  ops.purge_expired_shopify_checkout_recovery_evidence(
    p_now timestamptz
  )
returns integer
language plpgsql
security invoker
set search_path = pg_catalog
as $function$
declare
  v_deleted integer;
begin
  if p_now is null then
    raise exception using
      errcode = '22023',
      message = 'shopify_checkout_recovery_evidence_purge_input_invalid';
  end if;

  delete from ops.shopify_checkout_recovery_evidence
  where expires_at <= p_now;

  get diagnostics v_deleted = row_count;
  return v_deleted;
end
$function$;

revoke all
  on function ops.purge_expired_shopify_checkout_recovery_evidence(timestamptz)
  from public, anon, authenticated;

grant execute
  on function ops.purge_expired_shopify_checkout_recovery_evidence(timestamptz)
  to service_role;

alter table ops.shopify_checkout_observations
  drop constraint shopify_checkout_observations_shape_check;

alter table ops.shopify_checkout_observations
  add constraint shopify_checkout_observations_shape_check
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
      and alert_type in (
        'CHECKOUT_ERROR',
        'CONTACT_ERROR',
        'DELIVERY_ERROR',
        'PAYMENT_ERROR'
      )
      and checkout_token is null
      and currency_code is null
      and commerce_value is null
      and item_quantity is null
    )
  );
