set lock_timeout = '5s';

create or replace function ops.purge_expired_landing_observations()
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_now timestamptz := statement_timestamp();
  v_cutoff timestamptz := v_now - interval '30 days' + interval '1 hour';
  v_vercel_count bigint := 0;
  v_trace_count bigint := 0;
  v_consent_count bigint := 0;
begin
  delete from ops.vercel_edge_request_observations observation
  where observation.observed_at < v_cutoff
    and not ops.has_active_privacy_retention_exception(
      'ops', 'vercel_edge_request_observations', observation.vercel_log_id, v_now
    );
  get diagnostics v_vercel_count = row_count;

  delete from ops.vercel_trace_observations observation
  where observation.observed_at < v_cutoff
    and not ops.has_active_privacy_retention_exception(
      'ops', 'vercel_trace_observations', observation.trace_id, v_now
    );
  get diagnostics v_trace_count = row_count;

  delete from ops.landing_consent_observations observation
  where observation.observed_at < v_cutoff
    and not ops.has_active_privacy_retention_exception(
      'ops', 'landing_consent_observations', observation.edge_request_id::text, v_now
    );
  get diagnostics v_consent_count = row_count;

  return jsonb_build_object(
    'vercel_edge_request_observations_deleted', v_vercel_count,
    'vercel_trace_observations_deleted', v_trace_count,
    'landing_consent_observations_deleted', v_consent_count
  );
end;
$$;

comment on function ops.purge_expired_landing_observations() is
  'Hourly purge with a conservative one-hour margin within the 30-day technical observation retention limit. Existing time-limited legal holds remain honored.';

revoke execute on function ops.purge_expired_landing_observations()
  from public, anon, authenticated;
grant execute on function ops.purge_expired_landing_observations()
  to service_role, postgres;

-- Upsert the existing postgres-owned job; do not create a second purge schedule.
select cron.schedule(
  'purge_expired_landing_observations',
  '40 * * * *',
  'select ops.purge_expired_landing_observations();'
);
