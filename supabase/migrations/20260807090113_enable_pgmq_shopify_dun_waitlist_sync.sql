-- STEG 1: Enable PGMQ and create the durable Dun waitlist → Shopify sync queue.
-- Infrastructure only. Do not expose via Data API / pgmq_public.
-- pgmq owns its own schema (do not force into extensions).

create extension if not exists pgmq;

do $$
begin
  if not exists (
    select 1
    from pgmq.list_queues()
    where queue_name = 'shopify_dun_waitlist_sync'
  ) then
    -- Durable/basic queue (logged). Do not use unlogged queues for customer sync.
    perform pgmq.create('shopify_dun_waitlist_sync');
  end if;
end $$;
