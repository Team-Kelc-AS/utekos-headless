begin;

do $test$
declare
  v_now timestamptz := '2026-08-22T08:00:00Z';
  v_dispatch_id uuid := '71111111-1111-4111-8111-111111111111';
  v_next_dispatch_id uuid := '72222222-2222-4222-8222-222222222222';
  v_completed boolean;
  v_recorded boolean;
  v_purged integer;
  v_recipient_ciphertext text :=
    'v1.aaaaaaaaaaaaaaaa.bbbbbbbbbbbbbbbbbbbb.cccccccccccccccccccccc';
  v_recovery_url_ciphertext text :=
    'v1.dddddddddddddddd.eeeeeeeeeeeeeeeeeeeeeeeeeeeeee.ffffffffffffffffffffff';
begin
  if to_regclass(
    'ops.abandoned_checkout_recovery_delivery_audit'
  ) is null
  or to_regprocedure(
    'ops.complete_abandoned_checkout_recovery_dispatch_v3(uuid,text,text,text,text,text,text,timestamp with time zone)'
  ) is null
  or to_regprocedure(
    'ops.record_abandoned_checkout_recovery_resend_event(text,text,text,timestamp with time zone,timestamp with time zone)'
  ) is null then
    raise exception 'recovery delivery audit contract is missing';
  end if;

  if has_table_privilege(
    'anon',
    'ops.abandoned_checkout_recovery_delivery_audit',
    'select'
  )
  or has_table_privilege(
    'authenticated',
    'ops.abandoned_checkout_recovery_delivery_audit',
    'select'
  ) then
    raise exception 'recovery delivery audit is exposed publicly';
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
  ) values
    (
      v_dispatch_id,
      'gid://shopify/AbandonedCheckout/audit-sent',
      'gid://shopify/Customer/audit-customer',
      3,
      1,
      v_now - interval '5 hours',
      v_now - interval '4 hours',
      v_now - interval '1 hour',
      v_now - interval '1 hour',
      'pending'
    ),
    (
      v_next_dispatch_id,
      'gid://shopify/AbandonedCheckout/audit-next',
      'gid://shopify/Customer/audit-customer',
      3,
      2,
      v_now - interval '5 hours',
      v_now - interval '4 hours',
      v_now + interval '20 hours',
      v_now + interval '20 hours',
      'pending'
    );

  perform *
  from ops.claim_abandoned_checkout_recovery_dispatches(
    'worker-audit',
    1,
    120,
    v_now
  );

  select ops.complete_abandoned_checkout_recovery_dispatch_v3(
    v_dispatch_id,
    'worker-audit',
    'resend-audit-123',
    v_recipient_ciphertext,
    repeat('1', 64),
    v_recovery_url_ciphertext,
    repeat('2', 64),
    v_now + interval '1 second'
  ) into v_completed;

  if v_completed is not true
  or not exists (
    select 1
    from ops.abandoned_checkout_recovery_delivery_audit
    where dispatch_id = v_dispatch_id
      and resend_email_id = 'resend-audit-123'
      and recipient_ciphertext = v_recipient_ciphertext
      and recovery_url_ciphertext = v_recovery_url_ciphertext
      and expires_at = v_now + interval '90 days 1 second'
  ) then
    raise exception 'sent transition and encrypted audit were not atomic';
  end if;

  select ops.record_abandoned_checkout_recovery_resend_event(
    'resend-event-bounce-1',
    'resend-audit-123',
    'email.bounced',
    v_now + interval '2 seconds',
    v_now + interval '3 seconds'
  ) into v_recorded;

  if v_recorded is not true
  or not exists (
    select 1
    from ops.abandoned_checkout_recovery_resend_events
    where resend_event_id = 'resend-event-bounce-1'
      and dispatch_id = v_dispatch_id
      and event_type = 'email.bounced'
  )
  or not exists (
    select 1
    from ops.abandoned_checkout_recovery_dispatches
    where id = v_next_dispatch_id
      and status = 'suppressed'
      and suppression_reason = 'delivery_bounced'
  ) then
    raise exception 'bounce was not recorded or future email was not suppressed';
  end if;

  perform ops.record_abandoned_checkout_recovery_resend_event(
    'resend-event-bounce-1',
    'resend-audit-123',
    'email.bounced',
    v_now + interval '2 seconds',
    v_now + interval '4 seconds'
  );

  if (
    select count(*)
    from ops.abandoned_checkout_recovery_resend_events
    where resend_event_id = 'resend-event-bounce-1'
  ) <> 1 then
    raise exception 'duplicate Resend event was not idempotent';
  end if;

  select ops.record_abandoned_checkout_recovery_resend_event(
    'resend-event-unknown',
    'resend-unknown-123',
    'email.delivered',
    v_now,
    v_now
  ) into v_recorded;

  if v_recorded is not false then
    raise exception 'unknown Resend email id was not ignored';
  end if;

  select ops.purge_expired_abandoned_checkout_recovery_delivery_audit(
    v_now + interval '91 days'
  ) into v_purged;

  if v_purged <> 1 then
    raise exception 'expired encrypted audit was not purged';
  end if;
end
$test$;

rollback;
