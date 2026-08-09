do $$
begin
  if to_regclass(
    'ops.abandoned_checkout_recovery_dispatches'
  ) is null then
    raise exception using
      errcode = '42P01',
      message =
        'ops.abandoned_checkout_recovery_dispatches is missing; apply recovery discovery migrations first';
  end if;
end
$$;

create or replace function
  ops.claim_abandoned_checkout_recovery_dispatches(
    p_processing_owner text,
    p_limit integer,
    p_lease_seconds integer,
    p_now timestamptz
  )
returns table (
  id uuid,
  shopify_abandoned_checkout_id text,
  shopify_customer_id text,
  sequence_version smallint,
  step smallint,
  checkout_created_at timestamptz,
  checkout_updated_at timestamptz,
  due_at timestamptz,
  attempt_count integer,
  processing_expires_at timestamptz
)
language plpgsql
security invoker
set search_path = pg_catalog
as $function$
begin
  if p_processing_owner is null
     or p_processing_owner !~
       '^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$' then
    raise exception using
      errcode = '22023',
      message =
        'abandoned_checkout_recovery_processing_owner_invalid';
  end if;

  if p_limit is null
     or p_limit < 1
     or p_limit > 25 then
    raise exception using
      errcode = '22023',
      message = 'abandoned_checkout_recovery_claim_limit_invalid';
  end if;

  if p_lease_seconds is null
     or p_lease_seconds < 30
     or p_lease_seconds > 900 then
    raise exception using
      errcode = '22023',
      message = 'abandoned_checkout_recovery_lease_invalid';
  end if;

  if p_now is null then
    raise exception using
      errcode = '22023',
      message = 'abandoned_checkout_recovery_claim_time_invalid';
  end if;

  return query
  with candidates as (
    select dispatch.id
    from ops.abandoned_checkout_recovery_dispatches as dispatch
    where
      (
        dispatch.status = 'pending'
        and dispatch.next_attempt_at <= p_now
      )
      or
      (
        dispatch.status = 'processing'
        and dispatch.processing_expires_at <= p_now
      )
    order by
      least(
        dispatch.next_attempt_at,
        coalesce(
          dispatch.processing_expires_at,
          dispatch.next_attempt_at
        )
      ),
      dispatch.created_at,
      dispatch.id
    for update skip locked
    limit p_limit
  ),
  claimed as (
    update ops.abandoned_checkout_recovery_dispatches as dispatch
    set
      status = 'processing',
      processing_owner = p_processing_owner,
      processing_started_at = p_now,
      processing_expires_at =
        p_now + make_interval(secs => p_lease_seconds),
      updated_at = p_now
    from candidates
    where dispatch.id = candidates.id
    returning
      dispatch.id,
      dispatch.shopify_abandoned_checkout_id,
      dispatch.shopify_customer_id,
      dispatch.sequence_version,
      dispatch.step,
      dispatch.checkout_created_at,
      dispatch.checkout_updated_at,
      dispatch.due_at,
      dispatch.attempt_count,
      dispatch.processing_expires_at,
      dispatch.next_attempt_at
  )
  select
    claimed.id,
    claimed.shopify_abandoned_checkout_id,
    claimed.shopify_customer_id,
    claimed.sequence_version,
    claimed.step,
    claimed.checkout_created_at,
    claimed.checkout_updated_at,
    claimed.due_at,
    claimed.attempt_count,
    claimed.processing_expires_at
  from claimed
  order by claimed.next_attempt_at, claimed.id;
end
$function$;

create or replace function
  ops.renew_abandoned_checkout_recovery_dispatch_lease(
    p_id uuid,
    p_processing_owner text,
    p_lease_seconds integer,
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
     or p_processing_owner !~
       '^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$'
     or p_lease_seconds is null
     or p_lease_seconds < 30
     or p_lease_seconds > 900
     or p_now is null then
    raise exception using
      errcode = '22023',
      message =
        'abandoned_checkout_recovery_renew_input_invalid';
  end if;

  update ops.abandoned_checkout_recovery_dispatches as dispatch
  set
    processing_expires_at =
      p_now + make_interval(secs => p_lease_seconds),
    updated_at = p_now
  where
    dispatch.id = p_id
    and dispatch.status = 'processing'
    and dispatch.processing_owner = p_processing_owner
    and dispatch.processing_expires_at > p_now
  returning true into v_updated;

  return coalesce(v_updated, false);
end
$function$;

create or replace function
  ops.suppress_abandoned_checkout_recovery_dispatch(
    p_id uuid,
    p_processing_owner text,
    p_suppression_reason text,
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
     or p_processing_owner !~
       '^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$'
     or p_suppression_reason is null
     or p_suppression_reason not in (
       'recovered',
       'customer_has_orders',
       'draft_order_since_abandonment',
       'superseded_by_newer_checkout',
       'inventory_unavailable',
       'shopify_email_already_sent',
       'shopify_email_scheduled',
       'missing_email',
       'invalid_email',
       'not_subscribed'
     )
     or p_now is null then
    raise exception using
      errcode = '22023',
      message =
        'abandoned_checkout_recovery_suppress_input_invalid';
  end if;

  update ops.abandoned_checkout_recovery_dispatches as dispatch
  set
    status = 'suppressed',
    suppression_reason = p_suppression_reason,
    suppressed_at = p_now,
    processing_owner = null,
    processing_started_at = null,
    processing_expires_at = null,
    last_error = null,
    updated_at = p_now
  where
    dispatch.id = p_id
    and dispatch.status = 'processing'
    and dispatch.processing_owner = p_processing_owner
    and dispatch.processing_expires_at > p_now
  returning true into v_updated;

  return coalesce(v_updated, false);
end
$function$;

create or replace function
  ops.complete_abandoned_checkout_recovery_dispatch(
    p_id uuid,
    p_processing_owner text,
    p_resend_email_id text,
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
     or p_processing_owner !~
       '^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$'
     or p_resend_email_id is null
     or p_resend_email_id !~
       '^[A-Za-z0-9][A-Za-z0-9_-]{0,254}$'
     or p_now is null then
    raise exception using
      errcode = '22023',
      message =
        'abandoned_checkout_recovery_complete_input_invalid';
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
  where
    dispatch.id = p_id
    and dispatch.status = 'processing'
    and dispatch.processing_owner = p_processing_owner
    and dispatch.processing_expires_at > p_now
  returning true into v_updated;

  return coalesce(v_updated, false);
end
$function$;

create or replace function
  ops.retry_abandoned_checkout_recovery_dispatch(
    p_id uuid,
    p_processing_owner text,
    p_error_code text,
    p_retry_at timestamptz,
    p_max_attempts integer,
    p_now timestamptz
  )
returns text
language plpgsql
security invoker
set search_path = pg_catalog
as $function$
declare
  v_status text;
begin
  if p_id is null
     or p_processing_owner is null
     or p_processing_owner !~
       '^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$'
     or p_error_code is null
     or p_error_code !~ '^[a-z0-9][a-z0-9_:-]{0,127}$'
     or p_retry_at is null
     or p_now is null
     or p_retry_at <= p_now
     or p_max_attempts is null
     or p_max_attempts < 1
     or p_max_attempts > 20 then
    raise exception using
      errcode = '22023',
      message = 'abandoned_checkout_recovery_retry_input_invalid';
  end if;

  with transitioned as (
    update ops.abandoned_checkout_recovery_dispatches as dispatch
    set
      attempt_count = dispatch.attempt_count + 1,
      status = case
        when dispatch.attempt_count + 1 >= p_max_attempts
          then 'failed'
        else 'pending'
      end,
      next_attempt_at = case
        when dispatch.attempt_count + 1 >= p_max_attempts
          then dispatch.next_attempt_at
        else p_retry_at
      end,
      processing_owner = null,
      processing_started_at = null,
      processing_expires_at = null,
      last_error = p_error_code,
      updated_at = p_now
    where
      dispatch.id = p_id
      and dispatch.status = 'processing'
      and dispatch.processing_owner = p_processing_owner
      and dispatch.processing_expires_at > p_now
    returning dispatch.status
  )
  select status into v_status from transitioned;

  return v_status;
end
$function$;

revoke all
on function ops.claim_abandoned_checkout_recovery_dispatches(
  text,
  integer,
  integer,
  timestamptz
)
from public, anon, authenticated;

revoke all
on function ops.renew_abandoned_checkout_recovery_dispatch_lease(
  uuid,
  text,
  integer,
  timestamptz
)
from public, anon, authenticated;

revoke all
on function ops.suppress_abandoned_checkout_recovery_dispatch(
  uuid,
  text,
  text,
  timestamptz
)
from public, anon, authenticated;

revoke all
on function ops.complete_abandoned_checkout_recovery_dispatch(
  uuid,
  text,
  text,
  timestamptz
)
from public, anon, authenticated;

revoke all
on function ops.retry_abandoned_checkout_recovery_dispatch(
  uuid,
  text,
  text,
  timestamptz,
  integer,
  timestamptz
)
from public, anon, authenticated;

grant usage
on schema ops
to service_role;

grant execute
on function ops.claim_abandoned_checkout_recovery_dispatches(
  text,
  integer,
  integer,
  timestamptz
)
to service_role;

grant execute
on function ops.renew_abandoned_checkout_recovery_dispatch_lease(
  uuid,
  text,
  integer,
  timestamptz
)
to service_role;

grant execute
on function ops.suppress_abandoned_checkout_recovery_dispatch(
  uuid,
  text,
  text,
  timestamptz
)
to service_role;

grant execute
on function ops.complete_abandoned_checkout_recovery_dispatch(
  uuid,
  text,
  text,
  timestamptz
)
to service_role;

grant execute
on function ops.retry_abandoned_checkout_recovery_dispatch(
  uuid,
  text,
  text,
  timestamptz,
  integer,
  timestamptz
)
to service_role;
