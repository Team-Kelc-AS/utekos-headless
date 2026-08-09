-- STEG 6 Part 1: 30-day retention for Dun waitlist Shopify PGMQ archive.
-- Deletes only from pgmq.a_shopify_dun_waitlist_sync (never active queue).
-- Dead-letter retention remains 14 months via ops privacy retention.

create or replace function ops.purge_expired_shopify_dun_waitlist_pgmq_archive(
  retention_days integer default 30
)
returns bigint
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_deleted bigint := 0;
  v_now timestamptz := statement_timestamp();
  v_retention_days integer := coalesce(retention_days, 30);
begin
  if v_retention_days < 1 then
    raise exception using
      errcode = '22023',
      message = 'retention_days must be >= 1';
  end if;

  -- Never touch the active queue table. Archive only.
  if to_regclass('pgmq.a_shopify_dun_waitlist_sync') is null then
    return 0;
  end if;

  delete from pgmq.a_shopify_dun_waitlist_sync archive_row
  where archive_row.archived_at < v_now - make_interval(days => v_retention_days);

  get diagnostics v_deleted = row_count;
  return v_deleted;
end;
$$;

comment on function ops.purge_expired_shopify_dun_waitlist_pgmq_archive(integer) is
  'Deletes Dun waitlist Shopify PGMQ archive rows older than retention_days (default 30). Never purges the active queue. Archive is transport history, not the business ledger.';

revoke all on function ops.purge_expired_shopify_dun_waitlist_pgmq_archive(integer)
  from public;
revoke execute on function ops.purge_expired_shopify_dun_waitlist_pgmq_archive(integer)
  from public, anon, authenticated;
grant execute on function ops.purge_expired_shopify_dun_waitlist_pgmq_archive(integer)
  to service_role, postgres;

do $schedule_shopify_dun_waitlist_pgmq_archive_purge$
declare
  v_job_exists boolean;
begin
  if to_regclass('cron.job') is null then
    raise exception using
      errcode = '55000',
      message = 'pg_cron cron.job is required for Dun waitlist PGMQ archive retention';
  end if;

  execute $query$
    select exists (
      select 1
      from cron.job
      where jobname = 'purge_expired_shopify_dun_waitlist_pgmq_archive'
    )
  $query$ into v_job_exists;

  if not v_job_exists then
    perform cron.schedule(
      'purge_expired_shopify_dun_waitlist_pgmq_archive',
      '51 3 * * *',
      'select ops.purge_expired_shopify_dun_waitlist_pgmq_archive(30);'
    );
  end if;
end;
$schedule_shopify_dun_waitlist_pgmq_archive_purge$;;
