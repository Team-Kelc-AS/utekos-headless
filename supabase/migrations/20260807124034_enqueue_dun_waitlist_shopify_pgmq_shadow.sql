-- STEG 2: Atomic shadow enqueue of qualified Dun leads to PGMQ.
-- Fail-closed: pgmq.send failure aborts the lead INSERT transaction.
-- No consumer / no backfill / no Data API exposure.

do $$
begin
  if not exists (
    select 1
    from pgmq.list_queues()
    where queue_name = 'shopify_dun_waitlist_sync'
  ) then
    raise exception
      'STEG 1 prerequisite missing: durable queue shopify_dun_waitlist_sync';
  end if;
end $$;

create or replace function marketing.enqueue_shopify_dun_waitlist_sync_on_lead_insert()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.source = 'product_waitlist_utekos_dun'
    and new.email is not null
    and btrim(new.email) <> ''
  then
    -- Minimal payload only. PII stays on marketing.leads until a future consumer.
    perform pgmq.send(
      'shopify_dun_waitlist_sync',
      jsonb_build_object(
        'schema_version', 1,
        'lead_id', new.id
      )
    );
  end if;

  return new;
end;
$$;

comment on function marketing.enqueue_shopify_dun_waitlist_sync_on_lead_insert() is
  'STEG 2 shadow enqueue: AFTER INSERT on marketing.leads sends a minimal PGMQ message for qualified Dun waitlist leads. Messages are not consumed yet.';

revoke all on function marketing.enqueue_shopify_dun_waitlist_sync_on_lead_insert()
  from public;

revoke execute on function marketing.enqueue_shopify_dun_waitlist_sync_on_lead_insert()
  from public, anon, authenticated;

drop trigger if exists enqueue_shopify_dun_waitlist_sync_after_insert
  on marketing.leads;

create trigger enqueue_shopify_dun_waitlist_sync_after_insert
after insert on marketing.leads
for each row
execute function marketing.enqueue_shopify_dun_waitlist_sync_on_lead_insert();
