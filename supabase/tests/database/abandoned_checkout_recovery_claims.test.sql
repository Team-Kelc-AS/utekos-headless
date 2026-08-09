begin;

do $test$
declare
  v_now timestamptz := statement_timestamp() + interval '1 second';
  v_claim record;
  v_reclaimed record;
  v_retry_status text;
  v_completed boolean;
  v_uuid_claim uuid :=
    '11111111-1111-4111-8111-111111111111';
  v_uuid_expired uuid :=
    '22222222-2222-4222-8222-222222222222';
  v_uuid_retry uuid :=
    '33333333-3333-4333-8333-333333333333';
  v_uuid_complete uuid :=
    '44444444-4444-4444-8444-444444444444';
begin
  if to_regprocedure(
    'ops.claim_abandoned_checkout_recovery_dispatches(text,integer,integer,timestamp with time zone)'
  ) is null
  or to_regprocedure(
    'ops.renew_abandoned_checkout_recovery_dispatch_lease(uuid,text,integer,timestamp with time zone)'
  ) is null
  or to_regprocedure(
    'ops.suppress_abandoned_checkout_recovery_dispatch(uuid,text,text,timestamp with time zone)'
  ) is null
  or to_regprocedure(
    'ops.complete_abandoned_checkout_recovery_dispatch(uuid,text,text,timestamp with time zone)'
  ) is null
  or to_regprocedure(
    'ops.retry_abandoned_checkout_recovery_dispatch(uuid,text,text,timestamp with time zone,integer,timestamp with time zone)'
  ) is null then
    raise exception 'step 2B recovery RPC function is missing';
  end if;

  if has_function_privilege(
    'anon',
    'ops.claim_abandoned_checkout_recovery_dispatches(text,integer,integer,timestamp with time zone)',
    'execute'
  )
  or has_function_privilege(
    'authenticated',
    'ops.claim_abandoned_checkout_recovery_dispatches(text,integer,integer,timestamp with time zone)',
    'execute'
  ) then
    raise exception 'Step 2B claim RPC is exposed to a public role';
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
    status
  )
  values
    (
      v_uuid_claim,
      'gid://shopify/AbandonedCheckout/step2b-claim',
      'gid://shopify/Customer/step2b-claim',
      1,
      1,
      v_now - interval '2 hours',
      v_now - interval '1 hour',
      v_now - interval '30 minutes',
      v_now - interval '30 minutes',
      'pending'
    );

  select *
  into v_claim
  from ops.claim_abandoned_checkout_recovery_dispatches(
    'worker-claim',
    1,
    120,
    v_now
  );

  if v_claim.id is distinct from v_uuid_claim
     or v_claim.processing_expires_at
       is distinct from v_now + interval '120 seconds' then
    raise exception 'first due row was not exclusively claimed';
  end if;

  if exists (
    select 1
    from ops.claim_abandoned_checkout_recovery_dispatches(
      'worker-other',
      1,
      120,
      v_now
    )
    where id = v_uuid_claim
  ) then
    raise exception 'active lease was claimable by a second worker';
  end if;

  if not ops.renew_abandoned_checkout_recovery_dispatch_lease(
    v_uuid_claim,
    'worker-claim',
    120,
    v_now + interval '1 second'
  ) then
    raise exception 'current owner could not renew its lease';
  end if;

  if ops.suppress_abandoned_checkout_recovery_dispatch(
    v_uuid_claim,
    'worker-other',
    'recovered',
    v_now + interval '2 seconds'
  ) then
    raise exception 'stale worker transitioned an owned dispatch';
  end if;

  if not ops.suppress_abandoned_checkout_recovery_dispatch(
    v_uuid_claim,
    'worker-claim',
    'recovered',
    v_now + interval '2 seconds'
  ) then
    raise exception 'current owner could not suppress a dispatch';
  end if;

  if exists (
    select 1
    from ops.claim_abandoned_checkout_recovery_dispatches(
      'worker-after-suppress',
      25,
      120,
      v_now + interval '3 seconds'
    )
    where id = v_uuid_claim
  ) then
    raise exception 'suppressed dispatch became claimable';
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
    processing_expires_at
  )
  values (
    v_uuid_expired,
    'gid://shopify/AbandonedCheckout/step2b-expired',
    'gid://shopify/Customer/step2b-expired',
    1,
    1,
    v_now - interval '2 hours',
    v_now - interval '1 hour',
    v_now - interval '30 minutes',
    v_now - interval '30 minutes',
    'processing',
    'worker-expired',
    v_now - interval '2 minutes',
    v_now - interval '1 minute'
  );

  select *
  into v_reclaimed
  from ops.claim_abandoned_checkout_recovery_dispatches(
    'worker-reclaim',
    25,
    120,
    v_now + interval '3 seconds'
  )
  where id = v_uuid_expired;

  if v_reclaimed.id is distinct from v_uuid_expired then
    raise exception 'expired processing lease was not reclaimed';
  end if;

  if ops.renew_abandoned_checkout_recovery_dispatch_lease(
    v_uuid_expired,
    'worker-expired',
    120,
    v_now + interval '4 seconds'
  ) then
    raise exception 'former owner renewed after reclaim';
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
    status
  )
  values (
    v_uuid_retry,
    'gid://shopify/AbandonedCheckout/step2b-retry',
    'gid://shopify/Customer/step2b-retry',
    1,
    1,
    v_now - interval '2 hours',
    v_now - interval '1 hour',
    v_now - interval '30 minutes',
    v_now - interval '30 minutes',
    'pending'
  );

  if not exists (
    select 1
    from ops.claim_abandoned_checkout_recovery_dispatches(
      'worker-retry',
      25,
      120,
      v_now + interval '3 seconds'
    )
    where id = v_uuid_retry
  ) then
    raise exception 'retry test row was not claimed';
  end if;

  select ops.retry_abandoned_checkout_recovery_dispatch(
    v_uuid_retry,
    'worker-retry',
    'resend_provider_rejected',
    v_now + interval '5 minutes',
    1,
    v_now + interval '4 seconds'
  )
  into v_retry_status;

  if v_retry_status is distinct from 'failed'
     or not exists (
       select 1
       from ops.abandoned_checkout_recovery_dispatches
       where id = v_uuid_retry
         and status = 'failed'
         and attempt_count = 1
         and last_error = 'resend_provider_rejected'
     ) then
    raise exception 'retry did not reach bounded terminal failure';
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
    status
  )
  values (
    v_uuid_complete,
    'gid://shopify/AbandonedCheckout/step2b-complete',
    'gid://shopify/Customer/step2b-complete',
    1,
    1,
    v_now - interval '2 hours',
    v_now - interval '1 hour',
    v_now - interval '30 minutes',
    v_now - interval '30 minutes',
    'pending'
  );

  if not exists (
    select 1
    from ops.claim_abandoned_checkout_recovery_dispatches(
      'worker-complete',
      25,
      120,
      v_now + interval '5 seconds'
    )
    where id = v_uuid_complete
  ) then
    raise exception 'completion test row was not claimed';
  end if;

  select ops.complete_abandoned_checkout_recovery_dispatch(
    v_uuid_complete,
    'worker-complete',
    'resend-step2b-complete',
    v_now + interval '6 seconds'
  )
  into v_completed;

  if v_completed is not true
  or not exists (
    select 1
    from ops.abandoned_checkout_recovery_dispatches
    where id = v_uuid_complete
      and status = 'sent'
      and attempt_count = 1
      and resend_email_id = 'resend-step2b-complete'
  ) then
    raise exception
      'completion did not produce the sent terminal state (completed %, status %, attempts %, resend id %)',
      v_completed,
      (
        select status
        from ops.abandoned_checkout_recovery_dispatches
        where id = v_uuid_complete
      ),
      (
        select attempt_count
        from ops.abandoned_checkout_recovery_dispatches
        where id = v_uuid_complete
      ),
      (
        select resend_email_id
        from ops.abandoned_checkout_recovery_dispatches
        where id = v_uuid_complete
      );
  end if;
end
$test$;

rollback;
