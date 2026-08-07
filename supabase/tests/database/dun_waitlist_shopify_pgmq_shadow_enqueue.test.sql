begin;

create extension if not exists pgtap with schema extensions;

select extensions.plan(14);

select extensions.ok(
  exists (
    select 1
    from pgmq.list_queues()
    where queue_name = 'shopify_dun_waitlist_sync'
      and is_unlogged = false
  ),
  'durable shopify_dun_waitlist_sync queue exists'
);

select extensions.has_function(
  'marketing',
  'enqueue_shopify_dun_waitlist_sync_on_lead_insert',
  'shadow enqueue trigger function exists'
);

select extensions.has_trigger(
  'marketing',
  'leads',
  'enqueue_shopify_dun_waitlist_sync_after_insert',
  'AFTER INSERT shadow enqueue trigger exists'
);

-- Case A: qualified Dun lead enqueues exactly one minimal message
do $$
declare
  v_lead_id uuid := 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1';
begin
  delete from pgmq.q_shopify_dun_waitlist_sync
  where message ->> 'lead_id' = v_lead_id::text;

  delete from marketing.leads where id = v_lead_id;

  insert into marketing.leads (id, email, source, consent_marketing)
  values (
    v_lead_id,
    'kunde@example.no',
    'product_waitlist_utekos_dun',
    true
  );
end $$;

select extensions.is(
  (
    select count(*)::integer
    from marketing.leads
    where id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1'
  ),
  1,
  'case A: qualified Dun lead is inserted'
);

select extensions.is(
  (
    select count(*)::integer
    from pgmq.q_shopify_dun_waitlist_sync
    where message = jsonb_build_object(
      'schema_version', 1,
      'lead_id', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1'::uuid
    )
  ),
  1,
  'case A: exactly one minimal PGMQ message is enqueued'
);

-- Case B: non-Dun source does not enqueue
do $$
declare
  v_lead_id uuid := 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb2';
begin
  delete from pgmq.q_shopify_dun_waitlist_sync
  where message ->> 'lead_id' = v_lead_id::text;

  delete from marketing.leads where id = v_lead_id;

  insert into marketing.leads (id, email, source, consent_marketing)
  values (
    v_lead_id,
    'nyhetsbrev@example.no',
    'newsletter_signup',
    true
  );
end $$;

select extensions.is(
  (
    select count(*)::integer
    from pgmq.q_shopify_dun_waitlist_sync
    where message ->> 'lead_id' = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb2'
  ),
  0,
  'case B: non-Dun lead creates no PGMQ message'
);

-- Case C: Dun lead with null email does not enqueue
do $$
declare
  v_lead_id uuid := 'cccccccc-cccc-4ccc-8ccc-ccccccccccc3';
begin
  delete from pgmq.q_shopify_dun_waitlist_sync
  where message ->> 'lead_id' = v_lead_id::text;

  delete from marketing.leads where id = v_lead_id;

  insert into marketing.leads (id, email, source, consent_marketing)
  values (
    v_lead_id,
    null,
    'product_waitlist_utekos_dun',
    true
  );
end $$;

select extensions.is(
  (
    select count(*)::integer
    from pgmq.q_shopify_dun_waitlist_sync
    where message ->> 'lead_id' = 'cccccccc-cccc-4ccc-8ccc-ccccccccccc3'
  ),
  0,
  'case C: Dun lead with null email creates no PGMQ message'
);

-- Case D: Dun lead with blank/whitespace email does not enqueue
do $$
declare
  v_lead_id uuid := 'dddddddd-dddd-4ddd-8ddd-ddddddddddd4';
begin
  delete from pgmq.q_shopify_dun_waitlist_sync
  where message ->> 'lead_id' = v_lead_id::text;

  delete from marketing.leads where id = v_lead_id;

  insert into marketing.leads (id, email, source, consent_marketing)
  values (
    v_lead_id,
    '   ',
    'product_waitlist_utekos_dun',
    true
  );
end $$;

select extensions.is(
  (
    select count(*)::integer
    from pgmq.q_shopify_dun_waitlist_sync
    where message ->> 'lead_id' = 'dddddddd-dddd-4ddd-8ddd-ddddddddddd4'
  ),
  0,
  'case D: Dun lead with blank email creates no PGMQ message'
);

-- Case E: ON CONFLICT DO NOTHING does not enqueue a second message
do $$
declare
  v_lead_id uuid := 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeee5';
begin
  delete from pgmq.q_shopify_dun_waitlist_sync
  where message ->> 'lead_id' = v_lead_id::text;

  delete from marketing.leads where id = v_lead_id;

  insert into marketing.leads (id, email, source, consent_marketing)
  values (
    v_lead_id,
    'dup@example.no',
    'product_waitlist_utekos_dun',
    true
  );

  insert into marketing.leads (id, email, source, consent_marketing)
  values (
    v_lead_id,
    'dup@example.no',
    'product_waitlist_utekos_dun',
    true
  )
  on conflict (id) do nothing;
end $$;

select extensions.is(
  (
    select count(*)::integer
    from marketing.leads
    where id = 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeee5'
  ),
  1,
  'case E: duplicate insert keeps a single marketing.leads row'
);

select extensions.is(
  (
    select count(*)::integer
    from pgmq.q_shopify_dun_waitlist_sync
    where message ->> 'lead_id' = 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeee5'
  ),
  1,
  'case E: duplicate insert does not create a second PGMQ message'
);

-- Case F: rollback removes both the lead and the shadow queue message
do $$
declare
  v_lead_id uuid := 'ffffffff-ffff-4fff-8fff-fffffffffff6';
  v_message_count integer;
begin
  delete from pgmq.q_shopify_dun_waitlist_sync
  where message ->> 'lead_id' = v_lead_id::text;

  delete from marketing.leads where id = v_lead_id;

  begin
    insert into marketing.leads (id, email, source, consent_marketing)
    values (
      v_lead_id,
      'rollback@example.no',
      'product_waitlist_utekos_dun',
      true
    );

    select count(*)::integer
    into v_message_count
    from pgmq.q_shopify_dun_waitlist_sync
    where message ->> 'lead_id' = v_lead_id::text;

    if v_message_count <> 1 then
      raise exception
        'case F precondition failed: expected 1 PGMQ message before rollback, got %',
        v_message_count;
    end if;

    raise exception 'steg2_atomic_rollback';
  exception
    when raise_exception then
      if sqlerrm <> 'steg2_atomic_rollback' then
        raise;
      end if;
  end;
end $$;

select extensions.is(
  (
    select count(*)::integer
    from marketing.leads
    where id = 'ffffffff-ffff-4fff-8fff-fffffffffff6'
  ),
  0,
  'case F: rolled-back lead insert leaves no marketing.leads row'
);

select extensions.is(
  (
    select count(*)::integer
    from pgmq.q_shopify_dun_waitlist_sync
    where message ->> 'lead_id' = 'ffffffff-ffff-4fff-8fff-fffffffffff6'
  ),
  0,
  'case F: rolled-back lead insert leaves no PGMQ message'
);

select extensions.ok(
  not has_table_privilege(
    'anon',
    'pgmq.q_shopify_dun_waitlist_sync',
    'select, insert, update, delete'
  ),
  'denies anon access to the shadow queue table'
);

select extensions.ok(
  not has_table_privilege(
    'authenticated',
    'pgmq.q_shopify_dun_waitlist_sync',
    'select, insert, update, delete'
  ),
  'denies authenticated access to the shadow queue table'
);

select * from extensions.finish();

rollback;
