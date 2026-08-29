-- Production migration version: 20260829181455.
create table if not exists ops.customer_assistant_feedback (
  id uuid primary key default gen_random_uuid(),
  response_fingerprint text not null unique
    check (response_fingerprint ~ '^[0-9a-f]{64}$'),
  rating text not null
    check (rating in ('helpful', 'not_helpful')),
  created_at timestamptz not null default now(),
  expires_at timestamptz not null
    default (now() + interval '30 days'),
  check (
    expires_at > created_at
    and expires_at <= created_at + interval '31 days'
  )
);

comment on table ops.customer_assistant_feedback is
  'Short-lived anonymous useful/not-useful aggregate. Stores no conversation content, route, account, session, network address, or customer identifier.';

create index if not exists customer_assistant_feedback_expiry_idx
  on ops.customer_assistant_feedback (expires_at);

alter table ops.customer_assistant_feedback
  enable row level security;
alter table ops.customer_assistant_feedback
  force row level security;

revoke all on table ops.customer_assistant_feedback
  from public, anon, authenticated, service_role;
grant usage on schema ops to service_role;
grant select, insert, update, delete
  on table ops.customer_assistant_feedback to service_role;

create or replace function ops.purge_expired_customer_assistant_feedback()
returns bigint
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_deleted bigint := 0;
begin
  delete from ops.customer_assistant_feedback
  where expires_at <= statement_timestamp();

  get diagnostics v_deleted = row_count;
  return v_deleted;
end;
$$;

revoke all on function ops.purge_expired_customer_assistant_feedback()
  from public;
revoke execute on function ops.purge_expired_customer_assistant_feedback()
  from public, anon, authenticated;
grant execute on function ops.purge_expired_customer_assistant_feedback()
  to service_role, postgres;

do $schedule_customer_assistant_feedback_purge$
declare
  v_job_exists boolean;
begin
  if to_regclass('cron.job') is null then
    raise exception using
      errcode = '55000',
      message = 'pg_cron cron.job is required for assistant feedback retention';
  end if;

  execute $query$
    select exists (
      select 1
      from cron.job
      where jobname = 'purge_expired_customer_assistant_feedback'
    )
  $query$ into v_job_exists;

  if not v_job_exists then
    perform cron.schedule(
      'purge_expired_customer_assistant_feedback',
      '17 3 * * *',
      'select ops.purge_expired_customer_assistant_feedback();'
    );
  end if;
end;
$schedule_customer_assistant_feedback_purge$;
