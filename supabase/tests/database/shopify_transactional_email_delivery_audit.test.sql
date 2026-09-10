begin;

create extension if not exists pgtap with schema extensions;

select extensions.plan(12);

select extensions.has_table(
  'ops',
  'shopify_transactional_email_deliveries',
  'creates the transactional delivery audit table'
);

select extensions.has_table(
  'ops',
  'shopify_transactional_email_resend_events',
  'creates the transactional Resend event audit table'
);

select extensions.ok(
  to_regprocedure(
    'ops.purge_expired_shopify_transactional_email_audit(timestamp with time zone)'
  ) is not null,
  'creates the transactional audit retention function'
);

select extensions.ok(
  (
    select relrowsecurity
    from pg_class
    where oid =
      'ops.shopify_transactional_email_deliveries'::regclass
  )
  and (
    select relrowsecurity
    from pg_class
    where oid =
      'ops.shopify_transactional_email_resend_events'::regclass
  ),
  'enables row level security on both audit tables'
);

select extensions.ok(
  not has_table_privilege(
    'anon',
    'ops.shopify_transactional_email_deliveries',
    'select'
  )
  and not has_table_privilege(
    'authenticated',
    'ops.shopify_transactional_email_deliveries',
    'select'
  )
  and not has_table_privilege(
    'anon',
    'ops.shopify_transactional_email_resend_events',
    'select'
  )
  and not has_table_privilege(
    'authenticated',
    'ops.shopify_transactional_email_resend_events',
    'select'
  ),
  'denies public roles access to both audit tables'
);

select extensions.ok(
  has_table_privilege(
    'service_role',
    'ops.shopify_transactional_email_deliveries',
    'select, insert, update, delete'
  )
  and has_table_privilege(
    'service_role',
    'ops.shopify_transactional_email_resend_events',
    'select, insert, delete'
  )
  and not has_table_privilege(
    'service_role',
    'ops.shopify_transactional_email_resend_events',
    'update'
  ),
  'grants service_role only the required table operations'
);

select extensions.lives_ok(
  $sql$
    insert into ops.shopify_transactional_email_deliveries (
      idempotency_key,
      notification_type,
      shopify_order_id,
      shopify_fulfillment_id,
      resend_email_id,
      sent_at,
      expires_at
    ) values (
      'shopify-transactional/v1/order_confirmation/6252199051413',
      'order_confirmation',
      'gid://shopify/Order/6252199051413',
      null,
      'resend-order-123',
      '2026-09-10T12:00:00Z',
      '2027-11-04T12:00:00Z'
    )
  $sql$,
  'accepts a PII-free transactional delivery record'
);

select extensions.lives_ok(
  $sql$
    with inserted_event as (
      insert into ops.shopify_transactional_email_resend_events (
        resend_event_id,
        resend_email_id,
        idempotency_key,
        event_type,
        occurred_at,
        received_at
      ) values (
        'resend-event-delivered-1',
        'resend-order-123',
        'shopify-transactional/v1/order_confirmation/6252199051413',
        'email.delivered',
        '2026-09-10T12:01:00Z',
        '2026-09-10T12:02:00Z'
      )
      returning resend_email_id, event_type, occurred_at
    )
    update ops.shopify_transactional_email_deliveries as delivery
    set
      last_event_type = event.event_type,
      last_event_occurred_at = event.occurred_at
    from inserted_event as event
    where delivery.resend_email_id = event.resend_email_id
  $sql$,
  'records a Resend delivery event and advances provider state'
);

select extensions.is(
  (
    select last_event_type
    from ops.shopify_transactional_email_deliveries
    where resend_email_id = 'resend-order-123'
  ),
  'email.delivered',
  'stores the latest provider delivery state'
);

select extensions.is(
  (
    select count(*)
    from ops.shopify_transactional_email_resend_events
    where resend_email_id = 'resend-order-123'
  ),
  1::bigint,
  'stores the provider event exactly once'
);

select extensions.is(
  ops.purge_expired_shopify_transactional_email_audit(
    '2027-11-05T12:00:00Z'
  ),
  1,
  'purges the expired delivery record'
);

select extensions.is(
  (
    select count(*)
    from ops.shopify_transactional_email_resend_events
    where resend_email_id = 'resend-order-123'
  ),
  0::bigint,
  'cascades retention deletion to provider events'
);

select * from extensions.finish();

rollback;
