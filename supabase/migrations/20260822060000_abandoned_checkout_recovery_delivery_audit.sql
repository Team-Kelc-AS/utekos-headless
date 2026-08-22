do $$
begin
  if to_regclass('ops.abandoned_checkout_recovery_dispatches') is null
     or to_regclass('ops.abandoned_checkout_recovery_resend_events') is null then
    raise exception using
      errcode = '42P01',
      message = 'abandoned checkout recovery v2 tables are missing';
  end if;
end
$$;

comment on column ops.abandoned_checkout_recovery_dispatches.sequence_version is
  'Recovery sequence contract version. Version 2 is historical +1/+7/+24 hours; version 3 is +4/+24/+72 hours.';

create table ops.abandoned_checkout_recovery_delivery_audit (
  dispatch_id uuid primary key
    references ops.abandoned_checkout_recovery_dispatches(id)
    on delete cascade,
  resend_email_id text not null unique,
  recipient_ciphertext text not null,
  recipient_fingerprint text not null,
  recovery_url_ciphertext text not null,
  recovery_url_fingerprint text not null,
  recorded_at timestamptz not null,
  expires_at timestamptz not null,

  constraint abandoned_checkout_recovery_delivery_audit_email_id_check
    check (resend_email_id ~ '^[A-Za-z0-9][A-Za-z0-9_-]{0,254}$'),
  constraint abandoned_checkout_recovery_delivery_audit_recipient_ciphertext_check
    check (
      length(recipient_ciphertext) between 45 and 1024
      and recipient_ciphertext ~ '^v1\.[A-Za-z0-9_-]{16}\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]{22}$'
    ),
  constraint abandoned_checkout_recovery_delivery_audit_recipient_fingerprint_check
    check (recipient_fingerprint ~ '^[a-f0-9]{64}$'),
  constraint abandoned_checkout_recovery_delivery_audit_recovery_url_ciphertext_check
    check (
      length(recovery_url_ciphertext) between 56 and 6144
      and recovery_url_ciphertext ~ '^v1\.[A-Za-z0-9_-]{16}\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]{22}$'
    ),
  constraint abandoned_checkout_recovery_delivery_audit_recovery_url_fingerprint_check
    check (recovery_url_fingerprint ~ '^[a-f0-9]{64}$'),
  constraint abandoned_checkout_recovery_delivery_audit_retention_check
    check (expires_at > recorded_at)
);

create index abandoned_checkout_recovery_delivery_audit_expiry_idx
  on ops.abandoned_checkout_recovery_delivery_audit (expires_at);

alter table ops.abandoned_checkout_recovery_delivery_audit
  enable row level security;

revoke all
  on table ops.abandoned_checkout_recovery_delivery_audit
  from public, anon, authenticated;

grant select, insert, delete
  on table ops.abandoned_checkout_recovery_delivery_audit
  to service_role;

comment on table ops.abandoned_checkout_recovery_delivery_audit is
  'Service-role-only, 90-day recovery delivery audit. Recipient and Shopify recovery capability URL must be application-encrypted before insertion. Plaintext values are forbidden in database, Workflow, logs and Sentry.';

comment on column ops.abandoned_checkout_recovery_delivery_audit.recipient_fingerprint is
  'Keyed HMAC fingerprint for equality diagnostics; it is not a plaintext address or an unkeyed hash.';

comment on column ops.abandoned_checkout_recovery_delivery_audit.recovery_url_fingerprint is
  'Keyed HMAC fingerprint for equality diagnostics; it is not the Shopify recovery capability URL.';

alter table ops.abandoned_checkout_recovery_dispatches
  drop constraint if exists abandoned_checkout_recovery_dispatches_suppression_reason_check;

alter table ops.abandoned_checkout_recovery_dispatches
  add constraint abandoned_checkout_recovery_dispatches_suppression_reason_check
    check (
      suppression_reason is null
      or suppression_reason in (
        'recovered',
        'customer_has_orders',
        'unknown_order_count',
        'missing_customer',
        'missing_email',
        'invalid_email',
        'not_subscribed',
        'outside_window',
        'future_checkout_timestamp',
        'before_activation',
        'superseded_by_newer_checkout',
        'draft_order_since_abandonment',
        'shopify_email_already_sent',
        'shopify_email_scheduled',
        'inventory_unavailable',
        'delivery_bounced',
        'delivery_complained',
        'delivery_suppressed'
      )
    );

create or replace function
  ops.complete_abandoned_checkout_recovery_dispatch_v3(
    p_id uuid,
    p_processing_owner text,
    p_resend_email_id text,
    p_recipient_ciphertext text,
    p_recipient_fingerprint text,
    p_recovery_url_ciphertext text,
    p_recovery_url_fingerprint text,
    p_now timestamptz
  )
returns boolean
language plpgsql
security invoker
set search_path = pg_catalog
as $function$
declare
  v_updated boolean := false;
begin
  if p_id is null
     or p_processing_owner is null
     or p_processing_owner !~ '^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$'
     or p_resend_email_id is null
     or p_resend_email_id !~ '^[A-Za-z0-9][A-Za-z0-9_-]{0,254}$'
     or p_recipient_ciphertext is null
     or p_recipient_ciphertext !~ '^v1\.[A-Za-z0-9_-]{16}\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]{22}$'
     or p_recipient_fingerprint is null
     or p_recipient_fingerprint !~ '^[a-f0-9]{64}$'
     or p_recovery_url_ciphertext is null
     or p_recovery_url_ciphertext !~ '^v1\.[A-Za-z0-9_-]{16}\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]{22}$'
     or p_recovery_url_fingerprint is null
     or p_recovery_url_fingerprint !~ '^[a-f0-9]{64}$'
     or p_now is null then
    raise exception using
      errcode = '22023',
      message = 'abandoned_checkout_recovery_complete_v3_input_invalid';
  end if;

  update ops.abandoned_checkout_recovery_dispatches as dispatch
  set
    status = 'sent',
    resend_email_id = p_resend_email_id,
    attempt_count = dispatch.attempt_count + 1,
    sent_at = p_now,
    processing_owner = null,
    processing_started_at = null,
    processing_expires_at = null,
    last_error = null,
    updated_at = p_now
  where dispatch.id = p_id
    and dispatch.status = 'processing'
    and dispatch.processing_owner = p_processing_owner
    and dispatch.processing_expires_at > p_now
  returning true into v_updated;

  if coalesce(v_updated, false) then
    insert into ops.abandoned_checkout_recovery_delivery_audit (
      dispatch_id,
      resend_email_id,
      recipient_ciphertext,
      recipient_fingerprint,
      recovery_url_ciphertext,
      recovery_url_fingerprint,
      recorded_at,
      expires_at
    ) values (
      p_id,
      p_resend_email_id,
      p_recipient_ciphertext,
      p_recipient_fingerprint,
      p_recovery_url_ciphertext,
      p_recovery_url_fingerprint,
      p_now,
      p_now + interval '90 days'
    );
  end if;

  return coalesce(v_updated, false);
end
$function$;

create or replace function
  ops.record_abandoned_checkout_recovery_resend_event(
    p_resend_event_id text,
    p_resend_email_id text,
    p_event_type text,
    p_occurred_at timestamptz,
    p_received_at timestamptz
  )
returns boolean
language plpgsql
security invoker
set search_path = pg_catalog
as $function$
declare
  v_dispatch_id uuid;
  v_shopify_customer_id text;
  v_suppression_reason text;
  v_inserted boolean := false;
begin
  if p_resend_event_id is null
     or length(p_resend_event_id) not between 1 and 255
     or p_resend_email_id is null
     or p_resend_email_id !~ '^[A-Za-z0-9][A-Za-z0-9_-]{0,254}$'
     or p_event_type is null
     or p_event_type not in (
       'email.sent',
       'email.delivered',
       'email.delivery_delayed',
       'email.bounced',
       'email.complained',
       'email.failed',
       'email.suppressed'
     )
     or p_occurred_at is null
     or p_received_at is null then
    raise exception using
      errcode = '22023',
      message = 'abandoned_checkout_recovery_resend_event_input_invalid';
  end if;

  select dispatch.id, dispatch.shopify_customer_id
  into v_dispatch_id, v_shopify_customer_id
  from ops.abandoned_checkout_recovery_delivery_audit as audit
  join ops.abandoned_checkout_recovery_dispatches as dispatch
    on dispatch.id = audit.dispatch_id
  where audit.resend_email_id = p_resend_email_id;

  if v_dispatch_id is null then
    return false;
  end if;

  insert into ops.abandoned_checkout_recovery_resend_events (
    resend_event_id,
    resend_email_id,
    dispatch_id,
    event_type,
    occurred_at,
    received_at
  ) values (
    p_resend_event_id,
    p_resend_email_id,
    v_dispatch_id,
    p_event_type,
    p_occurred_at,
    p_received_at
  )
  on conflict (resend_event_id) do nothing
  returning true into v_inserted;

  if not coalesce(v_inserted, false) then
    return true;
  end if;

  v_suppression_reason := case p_event_type
    when 'email.bounced' then 'delivery_bounced'
    when 'email.complained' then 'delivery_complained'
    when 'email.suppressed' then 'delivery_suppressed'
    else null
  end;

  if v_suppression_reason is not null
     and v_shopify_customer_id is not null then
    update ops.abandoned_checkout_recovery_dispatches as dispatch
    set
      status = 'suppressed',
      suppression_reason = v_suppression_reason,
      suppressed_at = p_received_at,
      processing_owner = null,
      processing_started_at = null,
      processing_expires_at = null,
      last_error = null,
      updated_at = p_received_at
    where dispatch.shopify_customer_id = v_shopify_customer_id
      and dispatch.status in ('pending', 'processing');
  end if;

  return true;
end
$function$;

create or replace function
  ops.purge_expired_abandoned_checkout_recovery_delivery_audit(
    p_now timestamptz
  )
returns integer
language plpgsql
security invoker
set search_path = pg_catalog
as $function$
declare
  v_audit_deleted integer := 0;
  v_events_deleted integer := 0;
  v_dispatches_deleted integer := 0;
begin
  if p_now is null then
    raise exception using
      errcode = '22023',
      message = 'abandoned_checkout_recovery_audit_purge_input_invalid';
  end if;

  delete from ops.abandoned_checkout_recovery_resend_events
  where received_at <= p_now - interval '14 months';

  get diagnostics v_events_deleted = row_count;

  delete from ops.abandoned_checkout_recovery_delivery_audit
  where expires_at <= p_now;

  get diagnostics v_audit_deleted = row_count;

  delete from ops.abandoned_checkout_recovery_dispatches as dispatch
  where dispatch.status in ('sent', 'suppressed', 'failed')
    and dispatch.updated_at <= p_now - interval '14 months'
    and not exists (
      select 1
      from ops.abandoned_checkout_recovery_resend_events as event
      where event.dispatch_id = dispatch.id
    );

  get diagnostics v_dispatches_deleted = row_count;

  return
    v_audit_deleted
    + v_events_deleted
    + v_dispatches_deleted;
end
$function$;

revoke all
on function ops.complete_abandoned_checkout_recovery_dispatch_v3(
  uuid, text, text, text, text, text, text, timestamptz
)
from public, anon, authenticated;

revoke all
on function ops.record_abandoned_checkout_recovery_resend_event(
  text, text, text, timestamptz, timestamptz
)
from public, anon, authenticated;

revoke all
on function ops.purge_expired_abandoned_checkout_recovery_delivery_audit(
  timestamptz
)
from public, anon, authenticated;

grant execute
on function ops.complete_abandoned_checkout_recovery_dispatch_v3(
  uuid, text, text, text, text, text, text, timestamptz
)
to service_role;

grant execute
on function ops.record_abandoned_checkout_recovery_resend_event(
  text, text, text, timestamptz, timestamptz
)
to service_role;

grant execute
on function ops.purge_expired_abandoned_checkout_recovery_delivery_audit(
  timestamptz
)
to service_role;
