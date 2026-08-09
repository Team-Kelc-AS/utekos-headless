begin;

do $test$
declare
  v_now timestamptz := statement_timestamp() + interval '1 second';
  v_pending uuid := '55555555-5555-4555-8555-555555555555';
  v_processing uuid := '66666666-6666-4666-8666-666666666666';
  v_sent uuid := '77777777-7777-4777-8777-777777777777';
  v_affected integer;
begin
  if to_regclass('ops.abandoned_checkout_recovery_resend_events') is null then
    raise exception 'recovery Resend event table is missing';
  end if;

  if to_regprocedure(
    'ops.suppress_abandoned_checkout_recovery_dispatches_for_customer(text,timestamp with time zone)'
  ) is null then
    raise exception 'recovery unsubscribe suppression RPC is missing';
  end if;

  if has_function_privilege(
    'anon',
    'ops.suppress_abandoned_checkout_recovery_dispatches_for_customer(text,timestamp with time zone)',
    'execute'
  )
  or has_function_privilege(
    'authenticated',
    'ops.suppress_abandoned_checkout_recovery_dispatches_for_customer(text,timestamp with time zone)',
    'execute'
  )
  or not has_function_privilege(
    'service_role',
    'ops.suppress_abandoned_checkout_recovery_dispatches_for_customer(text,timestamp with time zone)',
    'execute'
  ) then
    raise exception 'recovery unsubscribe RPC privileges are invalid';
  end if;

  if has_table_privilege(
    'service_role',
    'ops.abandoned_checkout_recovery_resend_events',
    'update'
  )
  or has_table_privilege(
    'service_role',
    'ops.abandoned_checkout_recovery_resend_events',
    'delete'
  ) then
    raise exception 'Resend lifecycle events are not append-only for service_role';
  end if;

  insert into ops.abandoned_checkout_recovery_dispatches (
    id,
    shopify_abandoned_checkout_id,
    shopify_customer_id,
    sequence_version,
    step,
    checkout_created_at,
    checkout_updated_at,
    due_at,
    next_attempt_at,
    status,
    processing_owner,
    processing_started_at,
    processing_expires_at,
    attempt_count,
    resend_email_id,
    sent_at
  )
  values
    (
      v_pending,
      'gid://shopify/AbandonedCheckout/5001',
      'gid://shopify/Customer/9001',
      2,
      1,
      v_now - interval '2 hours',
      v_now - interval '1 hour',
      v_now - interval '1 hour',
      v_now - interval '1 hour',
      'pending',
      null,
      null,
      null,
      0,
      null,
      null
    ),
    (
      v_processing,
      'gid://shopify/AbandonedCheckout/5002',
      'gid://shopify/Customer/9001',
      2,
      2,
      v_now - interval '8 hours',
      v_now - interval '1 hour',
      v_now - interval '1 hour',
      v_now - interval '1 hour',
      'processing',
      'worker-preview',
      v_now - interval '30 seconds',
      v_now + interval '150 seconds',
      0,
      null,
      null
    ),
    (
      v_sent,
      'gid://shopify/AbandonedCheckout/5003',
      'gid://shopify/Customer/9001',
      2,
      3,
      v_now - interval '25 hours',
      v_now - interval '1 hour',
      v_now - interval '1 hour',
      v_now - interval '1 hour',
      'sent',
      null,
      null,
      null,
      1,
      'email_preview_existing',
      v_now - interval '30 minutes'
    );

  select ops.suppress_abandoned_checkout_recovery_dispatches_for_customer(
    'gid://shopify/Customer/9001',
    v_now
  )
  into v_affected;

  if v_affected <> 2 then
    raise exception 'unsubscribe suppressed %, expected 2', v_affected;
  end if;

  if (
    select count(*)
    from ops.abandoned_checkout_recovery_dispatches
    where id in (v_pending, v_processing)
      and status = 'suppressed'
      and suppression_reason = 'not_subscribed'
      and processing_owner is null
      and processing_started_at is null
      and processing_expires_at is null
  ) <> 2 then
    raise exception 'unsubscribe did not clear both active dispatches';
  end if;

  if not exists (
    select 1
    from ops.abandoned_checkout_recovery_dispatches
    where id = v_sent
      and status = 'sent'
      and resend_email_id = 'email_preview_existing'
  ) then
    raise exception 'unsubscribe mutated a terminal sent dispatch';
  end if;

  insert into ops.abandoned_checkout_recovery_resend_events (
    resend_event_id,
    resend_email_id,
    dispatch_id,
    event_type,
    occurred_at
  )
  values (
    'event_preview_1',
    'email_preview_existing',
    v_sent,
    'email.delivered',
    v_now
  );

  begin
    insert into ops.abandoned_checkout_recovery_resend_events (
      resend_event_id,
      resend_email_id,
      dispatch_id,
      event_type,
      occurred_at
    )
    values (
      'event_preview_1',
      'email_preview_existing',
      v_sent,
      'email.delivered',
      v_now
    );

    raise exception 'duplicate Resend event id was accepted';
  exception
    when unique_violation then
      null;
  end;

  begin
    perform ops.suppress_abandoned_checkout_recovery_dispatches_for_customer(
      'not-a-shopify-customer-gid',
      v_now
    );

    raise exception 'invalid Shopify customer id was accepted';
  exception
    when sqlstate '22023' then
      null;
  end;
end
$test$;

rollback;
