do $$
begin
  if to_regclass(
    'ops.abandoned_checkout_recovery_dispatches'
  ) is null then
    raise exception using
      errcode = '42P01',
      message =
        'ops.abandoned_checkout_recovery_dispatches is missing; apply 20260808083000_add_abandoned_checkout_recovery_dispatches.sql first';
  end if;
end
$$;

alter table ops.abandoned_checkout_recovery_dispatches
  add column if not exists processing_owner text,
  add column if not exists processing_started_at timestamptz,
  add column if not exists processing_expires_at timestamptz;

alter table ops.abandoned_checkout_recovery_dispatches
  drop constraint if exists abandoned_checkout_recovery_dispatches_status_check,
  drop constraint if exists abandoned_checkout_recovery_dispatches_suppression_reason_check,
  drop constraint if exists abandoned_checkout_recovery_dispatches_state_shape_check,
  drop constraint if exists abandoned_checkout_recovery_dispatches_processing_owner_check,
  drop constraint if exists abandoned_checkout_recovery_dispatches_processing_window_check,
  drop constraint if exists abandoned_checkout_recovery_dispatches_last_error_check;

alter table ops.abandoned_checkout_recovery_dispatches
  add constraint abandoned_checkout_recovery_dispatches_status_check
    check (
      status in (
        'pending',
        'processing',
        'sent',
        'suppressed',
        'failed'
      )
    ),

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
        'superseded_by_newer_checkout',
        'draft_order_since_abandonment',
        'shopify_email_already_sent',
        'shopify_email_scheduled',
        'inventory_unavailable'
      )
    ),

  add constraint abandoned_checkout_recovery_dispatches_processing_owner_check
    check (
      processing_owner is null
      or length(processing_owner) between 1 and 255
    ),

  add constraint abandoned_checkout_recovery_dispatches_processing_window_check
    check (
      (
        processing_started_at is null
        and processing_expires_at is null
      )
      or
      (
        processing_started_at is not null
        and processing_expires_at is not null
        and processing_expires_at > processing_started_at
      )
    ),

  add constraint abandoned_checkout_recovery_dispatches_last_error_check
    check (
      last_error is null
      or (
        length(last_error) between 1 and 128
        and last_error ~ '^[a-z0-9_:-]+$'
      )
    ),

  add constraint abandoned_checkout_recovery_dispatches_state_shape_check
    check (
      (
        status = 'pending'
        and resend_email_id is null
        and sent_at is null
        and suppression_reason is null
        and suppressed_at is null
        and processing_owner is null
        and processing_started_at is null
        and processing_expires_at is null
      )
      or
      (
        status = 'processing'
        and resend_email_id is null
        and sent_at is null
        and suppression_reason is null
        and suppressed_at is null
        and processing_owner is not null
        and processing_started_at is not null
        and processing_expires_at is not null
      )
      or
      (
        status = 'sent'
        and resend_email_id is not null
        and sent_at is not null
        and suppression_reason is null
        and suppressed_at is null
        and processing_owner is null
        and processing_started_at is null
        and processing_expires_at is null
        and attempt_count > 0
      )
      or
      (
        status = 'suppressed'
        and resend_email_id is null
        and sent_at is null
        and suppression_reason is not null
        and suppressed_at is not null
        and processing_owner is null
        and processing_started_at is null
        and processing_expires_at is null
      )
      or
      (
        status = 'failed'
        and resend_email_id is null
        and sent_at is null
        and suppression_reason is null
        and suppressed_at is null
        and processing_owner is null
        and processing_started_at is null
        and processing_expires_at is null
        and last_error is not null
        and attempt_count > 0
      )
    );

create index if not exists
  abandoned_checkout_recovery_dispatches_processing_expiry_idx
on ops.abandoned_checkout_recovery_dispatches (
  processing_expires_at
)
where status = 'processing';

comment on column
  ops.abandoned_checkout_recovery_dispatches.processing_owner
is
  'Opaque worker claim identifier. Never contains customer data or email addresses.';

comment on column
  ops.abandoned_checkout_recovery_dispatches.processing_started_at
is
  'Timestamp when the current pre-send worker claimed the dispatch.';

comment on column
  ops.abandoned_checkout_recovery_dispatches.processing_expires_at
is
  'Expiry for a pre-send claim so a crashed worker cannot permanently strand the dispatch.';

comment on column
  ops.abandoned_checkout_recovery_dispatches.last_error
is
  'Bounded machine-readable error code only. Raw Shopify, Supabase or Resend error messages are forbidden.';

create or replace function
  ops.upsert_abandoned_checkout_recovery_dispatches(
    p_rows jsonb
  )
returns integer
language plpgsql
security invoker
set search_path = pg_catalog
as $function$
declare
  v_affected integer := 0;
begin
  if p_rows is null
     or jsonb_typeof(p_rows) <> 'array' then
    raise exception using
      errcode = '22023',
      message =
        'abandoned_checkout_recovery_rows_must_be_array';
  end if;

  if jsonb_array_length(p_rows) = 0 then
    return 0;
  end if;

  if exists (
    select 1
    from jsonb_to_recordset(p_rows) as incoming (
      shopify_abandoned_checkout_id text,
      shopify_customer_id text,
      sequence_version smallint,
      step smallint,
      checkout_created_at timestamptz,
      checkout_updated_at timestamptz,
      due_at timestamptz,
      next_attempt_at timestamptz,
      status text,
      suppression_reason text,
      suppressed_at timestamptz
    )
    group by
      shopify_abandoned_checkout_id,
      sequence_version,
      step
    having count(*) > 1
  ) then
    raise exception using
      errcode = '22023',
      message =
        'abandoned_checkout_recovery_duplicate_input_key';
  end if;

  if exists (
    select 1
    from jsonb_to_recordset(p_rows) as incoming (
      shopify_abandoned_checkout_id text,
      shopify_customer_id text,
      sequence_version smallint,
      step smallint,
      checkout_created_at timestamptz,
      checkout_updated_at timestamptz,
      due_at timestamptz,
      next_attempt_at timestamptz,
      status text,
      suppression_reason text,
      suppressed_at timestamptz
    )
    where status not in (
      'pending',
      'suppressed'
    )
  ) then
    raise exception using
      errcode = '22023',
      message =
        'abandoned_checkout_recovery_invalid_discovery_status';
  end if;

  /*
   * A rediscovery may refresh a pending row or suppress it,
   * but the stable identity of an already pending dispatch
   * must never mutate silently.
   */
  if exists (
    select 1
    from jsonb_to_recordset(p_rows) as incoming (
      shopify_abandoned_checkout_id text,
      shopify_customer_id text,
      sequence_version smallint,
      step smallint,
      checkout_created_at timestamptz,
      checkout_updated_at timestamptz,
      due_at timestamptz,
      next_attempt_at timestamptz,
      status text,
      suppression_reason text,
      suppressed_at timestamptz
    )
    join ops.abandoned_checkout_recovery_dispatches
      as existing
      on existing.shopify_abandoned_checkout_id =
           incoming.shopify_abandoned_checkout_id
     and existing.sequence_version =
           incoming.sequence_version
     and existing.step =
           incoming.step
    where
      existing.status = 'pending'
      and (
        existing.shopify_customer_id
          is distinct from
          incoming.shopify_customer_id
        or existing.checkout_created_at
          <> incoming.checkout_created_at
        or existing.due_at
          <> incoming.due_at
      )
  ) then
    raise exception using
      errcode = '23514',
      message =
        'abandoned_checkout_recovery_identity_conflict';
  end if;

  with incoming as (
    select
      shopify_abandoned_checkout_id,
      shopify_customer_id,
      sequence_version,
      step,
      checkout_created_at,
      checkout_updated_at,
      due_at,
      next_attempt_at,
      status,
      suppression_reason,
      suppressed_at
    from jsonb_to_recordset(p_rows) as row_data (
      shopify_abandoned_checkout_id text,
      shopify_customer_id text,
      sequence_version smallint,
      step smallint,
      checkout_created_at timestamptz,
      checkout_updated_at timestamptz,
      due_at timestamptz,
      next_attempt_at timestamptz,
      status text,
      suppression_reason text,
      suppressed_at timestamptz
    )
  )
  insert into ops.abandoned_checkout_recovery_dispatches
    as target (
      shopify_abandoned_checkout_id,
      shopify_customer_id,
      sequence_version,
      step,
      checkout_created_at,
      checkout_updated_at,
      due_at,
      next_attempt_at,
      status,
      suppression_reason,
      suppressed_at
    )
  select
    incoming.shopify_abandoned_checkout_id,
    incoming.shopify_customer_id,
    incoming.sequence_version,
    incoming.step,
    incoming.checkout_created_at,
    incoming.checkout_updated_at,
    incoming.due_at,
    incoming.next_attempt_at,
    incoming.status,
    incoming.suppression_reason,
    incoming.suppressed_at
  from incoming
  on conflict (
    shopify_abandoned_checkout_id,
    sequence_version,
    step
  )
  do update
  set
    checkout_updated_at =
      greatest(
        target.checkout_updated_at,
        excluded.checkout_updated_at
      ),

    status =
      excluded.status,

    suppression_reason =
      excluded.suppression_reason,

    suppressed_at =
      excluded.suppressed_at,

    updated_at =
      statement_timestamp()

  where
    /*
     * Discovery may only mutate pending work.
     *
     * sent       -> immutable
     * suppressed -> immutable
     * failed     -> immutable
     * processing -> owned by pre-send worker
     */
    target.status = 'pending'
    and target.shopify_customer_id
      is not distinct from
      excluded.shopify_customer_id
    and target.checkout_created_at =
      excluded.checkout_created_at
    and target.due_at =
      excluded.due_at;

  get diagnostics
    v_affected = row_count;

  return v_affected;
end
$function$;

revoke all
on function
  ops.upsert_abandoned_checkout_recovery_dispatches(jsonb)
from public;

revoke all
on function
  ops.upsert_abandoned_checkout_recovery_dispatches(jsonb)
from anon, authenticated;

grant usage
on schema ops
to service_role;

grant execute
on function
  ops.upsert_abandoned_checkout_recovery_dispatches(jsonb)
to service_role;