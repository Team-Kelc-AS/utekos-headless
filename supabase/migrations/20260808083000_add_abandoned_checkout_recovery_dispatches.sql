create table ops.abandoned_checkout_recovery_dispatches (
  id uuid primary key default gen_random_uuid(),

  shopify_abandoned_checkout_id text not null,
  shopify_customer_id text,

  sequence_version smallint not null default 1,
  step smallint not null,

  checkout_created_at timestamptz not null,
  checkout_updated_at timestamptz not null,

  due_at timestamptz not null,
  next_attempt_at timestamptz not null,

  status text not null default 'pending',
  suppression_reason text,

  resend_email_id text,
  attempt_count integer not null default 0,
  last_error text,

  sent_at timestamptz,
  suppressed_at timestamptz,

  created_at timestamptz not null default statement_timestamp(),
  updated_at timestamptz not null default statement_timestamp(),

  constraint abandoned_checkout_recovery_dispatches_checkout_sequence_step_key
    unique (
      shopify_abandoned_checkout_id,
      sequence_version,
      step
    ),

  constraint abandoned_checkout_recovery_dispatches_checkout_id_check
    check (
      length(shopify_abandoned_checkout_id) between 1 and 255
    ),

  constraint abandoned_checkout_recovery_dispatches_customer_id_check
    check (
      shopify_customer_id is null
      or length(shopify_customer_id) between 1 and 255
    ),

  constraint abandoned_checkout_recovery_dispatches_sequence_version_check
    check (
      sequence_version >= 1
    ),

  constraint abandoned_checkout_recovery_dispatches_step_check
    check (
      step >= 1
    ),

  constraint abandoned_checkout_recovery_dispatches_attempt_count_check
    check (
      attempt_count >= 0
    ),

  constraint abandoned_checkout_recovery_dispatches_checkout_window_check
    check (
      checkout_updated_at >= checkout_created_at
      and due_at >= checkout_created_at
      and next_attempt_at >= due_at
    ),

  constraint abandoned_checkout_recovery_dispatches_updated_at_check
    check (
      updated_at >= created_at
    ),

  constraint abandoned_checkout_recovery_dispatches_status_check
    check (
      status in (
        'pending',
        'sent',
        'suppressed',
        'failed'
      )
    ),

  constraint abandoned_checkout_recovery_dispatches_suppression_reason_check
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
        'superseded_by_newer_checkout'
      )
    ),

  constraint abandoned_checkout_recovery_dispatches_customer_required_check
    check (
      shopify_customer_id is not null
      or (
        status = 'suppressed'
        and suppression_reason = 'missing_customer'
      )
    ),

  constraint abandoned_checkout_recovery_dispatches_state_shape_check
    check (
      (
        status = 'pending'
        and resend_email_id is null
        and sent_at is null
        and suppression_reason is null
        and suppressed_at is null
      )
      or
      (
        status = 'sent'
        and resend_email_id is not null
        and sent_at is not null
        and suppression_reason is null
        and suppressed_at is null
        and attempt_count > 0
      )
      or
      (
        status = 'suppressed'
        and resend_email_id is null
        and sent_at is null
        and suppression_reason is not null
        and suppressed_at is not null
      )
      or
      (
        status = 'failed'
        and resend_email_id is null
        and sent_at is null
        and suppression_reason is null
        and suppressed_at is null
        and last_error is not null
        and attempt_count > 0
      )
    )
);

create index abandoned_checkout_recovery_dispatches_pending_idx
  on ops.abandoned_checkout_recovery_dispatches (
    next_attempt_at,
    created_at
  )
  where status = 'pending';

create index abandoned_checkout_recovery_dispatches_customer_checkout_idx
  on ops.abandoned_checkout_recovery_dispatches (
    shopify_customer_id,
    checkout_created_at desc
  )
  where shopify_customer_id is not null;

create index abandoned_checkout_recovery_dispatches_status_idx
  on ops.abandoned_checkout_recovery_dispatches (
    status,
    updated_at desc
  );

alter table ops.abandoned_checkout_recovery_dispatches
  enable row level security;

revoke all
  on table ops.abandoned_checkout_recovery_dispatches
  from anon, authenticated;

grant select, insert, update
  on table ops.abandoned_checkout_recovery_dispatches
  to service_role;

comment on table ops.abandoned_checkout_recovery_dispatches is
  'Durable state for abandoned-checkout recovery. Raw email addresses, checkout recovery URLs, cookies, payment data and arbitrary Shopify payloads are forbidden.';

comment on column ops.abandoned_checkout_recovery_dispatches.shopify_abandoned_checkout_id is
  'Shopify AbandonedCheckout GID.';

comment on column ops.abandoned_checkout_recovery_dispatches.shopify_customer_id is
  'Shopify Customer GID. Nullable only for permanently suppressed checkouts without a customer.';

comment on column ops.abandoned_checkout_recovery_dispatches.sequence_version is
  'Recovery sequence contract version. Version 1 currently contains step 1 only.';

comment on column ops.abandoned_checkout_recovery_dispatches.step is
  'Recovery sequence step number.';

comment on column ops.abandoned_checkout_recovery_dispatches.due_at is
  'Original scheduled execution time for this recovery step.';

comment on column ops.abandoned_checkout_recovery_dispatches.next_attempt_at is
  'Current earliest retry/send time. Initially equal to due_at.';

comment on column ops.abandoned_checkout_recovery_dispatches.suppression_reason is
  'Deterministic reason why a checkout must not enter the send path.';