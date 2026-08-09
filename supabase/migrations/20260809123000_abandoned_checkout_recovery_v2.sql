do $$
begin
  if to_regclass('ops.abandoned_checkout_recovery_dispatches') is null then
    raise exception using
      errcode = '42P01',
      message = 'ops.abandoned_checkout_recovery_dispatches is missing';
  end if;
end
$$;

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
        'inventory_unavailable'
      )
    );

comment on column ops.abandoned_checkout_recovery_dispatches.sequence_version is
  'Recovery sequence contract version. Version 2 contains steps at +1, +7 and +24 hours.';

create table ops.abandoned_checkout_recovery_resend_events (
  id uuid primary key default gen_random_uuid(),
  resend_event_id text not null unique,
  resend_email_id text not null,
  dispatch_id uuid not null references ops.abandoned_checkout_recovery_dispatches(id),
  event_type text not null,
  occurred_at timestamptz not null,
  received_at timestamptz not null default statement_timestamp(),

  constraint abandoned_checkout_recovery_resend_events_event_id_check
    check (length(resend_event_id) between 1 and 255),
  constraint abandoned_checkout_recovery_resend_events_email_id_check
    check (resend_email_id ~ '^[A-Za-z0-9][A-Za-z0-9_-]{0,254}$'),
  constraint abandoned_checkout_recovery_resend_events_type_check
    check (
      event_type in (
        'email.sent',
        'email.delivered',
        'email.delivery_delayed',
        'email.bounced',
        'email.complained',
        'email.failed',
        'email.suppressed'
      )
    )
);

create index abandoned_checkout_recovery_resend_events_dispatch_idx
  on ops.abandoned_checkout_recovery_resend_events (
    dispatch_id,
    occurred_at,
    id
  );

alter table ops.abandoned_checkout_recovery_resend_events
  enable row level security;

revoke all
  on table ops.abandoned_checkout_recovery_resend_events
  from anon, authenticated;

grant select, insert
  on table ops.abandoned_checkout_recovery_resend_events
  to service_role;

comment on table ops.abandoned_checkout_recovery_resend_events is
  'Append-only PII-free lifecycle events for tagged Resend recovery emails. Raw webhook payloads, addresses, subjects and recovery URLs are forbidden.';

create or replace function
  ops.suppress_abandoned_checkout_recovery_dispatches_for_customer(
    p_shopify_customer_id text,
    p_now timestamptz
  )
returns integer
language plpgsql
security invoker
set search_path = pg_catalog
as $function$
declare
  v_affected integer := 0;
begin
  if p_shopify_customer_id is null
     or p_shopify_customer_id !~ '^gid://shopify/Customer/[0-9]+$'
     or p_now is null then
    raise exception using
      errcode = '22023',
      message = 'abandoned_checkout_recovery_unsubscribe_input_invalid';
  end if;

  update ops.abandoned_checkout_recovery_dispatches as dispatch
  set
    status = 'suppressed',
    suppression_reason = 'not_subscribed',
    suppressed_at = p_now,
    processing_owner = null,
    processing_started_at = null,
    processing_expires_at = null,
    last_error = null,
    updated_at = p_now
  where dispatch.shopify_customer_id = p_shopify_customer_id
    and dispatch.status in ('pending', 'processing');

  get diagnostics v_affected = row_count;
  return v_affected;
end
$function$;

revoke all
on function ops.suppress_abandoned_checkout_recovery_dispatches_for_customer(
  text,
  timestamptz
)
from public, anon, authenticated;

grant execute
on function ops.suppress_abandoned_checkout_recovery_dispatches_for_customer(
  text,
  timestamptz
)
to service_role;
