create table ops.shopify_transactional_email_deliveries (
  idempotency_key text primary key,
  notification_type text not null,
  shopify_order_id text not null,
  shopify_fulfillment_id text,
  resend_email_id text not null unique,
  sent_at timestamptz not null,
  last_event_type text,
  last_event_occurred_at timestamptz,
  expires_at timestamptz not null,

  constraint shopify_transactional_email_deliveries_key_check
    check (
      idempotency_key ~
        '^shopify-transactional/v1/(order_confirmation|shipping_confirmation|shipment_out_for_delivery|shipment_delivered)/[1-9][0-9]{0,19}$'
    ),
  constraint shopify_transactional_email_deliveries_type_check
    check (
      notification_type in (
        'order_confirmation',
        'shipping_confirmation',
        'shipment_out_for_delivery',
        'shipment_delivered'
      )
    ),
  constraint shopify_transactional_email_deliveries_order_check
    check (
      shopify_order_id ~
        '^gid://shopify/Order/[1-9][0-9]{0,19}$'
    ),
  constraint shopify_transactional_email_deliveries_fulfillment_check
    check (
      (
        notification_type = 'order_confirmation'
        and shopify_fulfillment_id is null
      )
      or (
        notification_type <> 'order_confirmation'
        and shopify_fulfillment_id ~
          '^gid://shopify/Fulfillment/[1-9][0-9]{0,19}$'
      )
    ),
  constraint shopify_transactional_email_deliveries_resend_id_check
    check (
      resend_email_id ~
        '^[A-Za-z0-9][A-Za-z0-9_-]{0,254}$'
    ),
  constraint shopify_transactional_email_deliveries_event_type_check
    check (
      last_event_type is null
      or last_event_type in (
        'email.sent',
        'email.delivered',
        'email.delivery_delayed',
        'email.bounced',
        'email.complained',
        'email.failed',
        'email.suppressed'
      )
    ),
  constraint shopify_transactional_email_deliveries_event_shape_check
    check (
      (last_event_type is null and last_event_occurred_at is null)
      or (last_event_type is not null and last_event_occurred_at is not null)
    ),
  constraint shopify_transactional_email_deliveries_retention_check
    check (expires_at > sent_at)
);

create index shopify_transactional_email_deliveries_expiry_idx
  on ops.shopify_transactional_email_deliveries (expires_at);

create table ops.shopify_transactional_email_resend_events (
  resend_event_id text primary key,
  resend_email_id text not null,
  idempotency_key text not null
    references ops.shopify_transactional_email_deliveries(idempotency_key)
    on delete cascade,
  event_type text not null,
  occurred_at timestamptz not null,
  received_at timestamptz not null,

  constraint shopify_transactional_email_resend_events_event_id_check
    check (length(resend_event_id) between 1 and 255),
  constraint shopify_transactional_email_resend_events_email_id_check
    check (
      resend_email_id ~
        '^[A-Za-z0-9][A-Za-z0-9_-]{0,254}$'
    ),
  constraint shopify_transactional_email_resend_events_type_check
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

create index shopify_transactional_email_resend_events_email_idx
  on ops.shopify_transactional_email_resend_events (resend_email_id);

alter table ops.shopify_transactional_email_deliveries
  enable row level security;

alter table ops.shopify_transactional_email_resend_events
  enable row level security;

revoke all
  on table ops.shopify_transactional_email_deliveries
  from public, anon, authenticated;

revoke all
  on table ops.shopify_transactional_email_resend_events
  from public, anon, authenticated;

grant select, insert, update, delete
  on table ops.shopify_transactional_email_deliveries
  to service_role;

grant select, insert, delete
  on table ops.shopify_transactional_email_resend_events
  to service_role;

comment on table ops.shopify_transactional_email_deliveries is
  'Service-only, PII-free delivery and provider-state audit for Resend messages replacing Shopify order and shipment notifications.';

comment on table ops.shopify_transactional_email_resend_events is
  'Idempotent Resend webhook event audit for Shopify transactional email deliveries. Contains no recipient or order status URL.';

create or replace function
  ops.purge_expired_shopify_transactional_email_audit(
    p_now timestamptz
  )
returns integer
language plpgsql
security invoker
set search_path = pg_catalog
as $function$
declare
  v_deleted integer := 0;
begin
  if p_now is null then
    raise exception using
      errcode = '22023',
      message = 'shopify_transactional_email_audit_purge_input_invalid';
  end if;

  delete from ops.shopify_transactional_email_deliveries
  where expires_at <= p_now;

  get diagnostics v_deleted = row_count;
  return v_deleted;
end
$function$;

revoke all
on function ops.purge_expired_shopify_transactional_email_audit(
  timestamptz
)
from public, anon, authenticated;

grant execute
on function ops.purge_expired_shopify_transactional_email_audit(
  timestamptz
)
to service_role;
