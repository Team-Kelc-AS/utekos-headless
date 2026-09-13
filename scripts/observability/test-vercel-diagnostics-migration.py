"""Validate actual drain DDL in temporary, foreground-only PostgreSQL single-user mode."""
from pathlib import Path
import os
import re
import subprocess
import tempfile

root = Path(__file__).resolve().parents[2]
pg = Path(os.environ.get('UTEKOS_TEST_PG_BIN', '/opt/homebrew/opt/postgresql@17/bin'))
migrations = root / 'supabase/migrations'

def source(name):
    return (migrations / name).read_text()

baseline = source('20260801062712_add_vercel_landing_observability.sql')
privacy = source('20260726034756_enforce_privacy_retention.sql')
policy = source('20260910060000_add_operational_v1_privacy_policy.sql')
bootstrap = '''
create role postgres superuser;
create role service_role bypassrls;
create role anon;
create role authenticated;
create schema ops;
grant usage on schema ops to service_role, anon, authenticated;
'''
bootstrap += baseline[:baseline.index('create index if not exists event_ledger_edge_request_page_view_idx')]
bootstrap += privacy[:privacy.index('create or replace function ops.purge_expired_privacy_data()')]
bootstrap += policy[:policy.index("select cron.schedule('purge_operational_v1'")]
migration = source('20260913110000_add_vercel_runtime_diagnostics.sql')
checks = '''
insert into ops.vercel_runtime_diagnostics
 (vercel_log_id, project_id, deployment_id, environment, observed_at, level, source,
  request_route, context_route, status_code, category, message_policy)
values ('fresh','project','deployment','production',statement_timestamp() - interval '1 minute',
 'error','lambda','/api/log','/skreddersy-varmen',200,'ClientError','classified_raw_omitted');
insert into ops.vercel_runtime_diagnostics select * from ops.vercel_runtime_diagnostics
on conflict (vercel_log_id) do nothing;
do $$
declare n integer;
begin
 select count(*) into n from ops.vercel_runtime_diagnostics;
 if n <> 1 then raise exception 'deduplication failed'; end if;
 select count(*) into n from ops.vercel_runtime_diagnostics_2h
 where log_entries=1 and entries_without_request_id=1 and distinct_known_request_ids=0
 and request_route='/api/log' and context_route='/skreddersy-varmen' and status_code=200;
 if n <> 1 then raise exception 'grouping failed'; end if;
 if has_table_privilege('anon','ops.vercel_runtime_diagnostics','SELECT')
 or has_table_privilege('authenticated','ops.vercel_runtime_diagnostics_2h','SELECT')
 or has_table_privilege('service_role','ops.vercel_runtime_diagnostics','DELETE') then
   raise exception 'excess privileges';
 end if;
 if not has_table_privilege('service_role','ops.vercel_runtime_diagnostics','INSERT') then
   raise exception 'writer has no insert grant';
 end if;
 if not exists (select 1 from pg_class where oid='ops.vercel_runtime_diagnostics'::regclass
   and relrowsecurity and relforcerowsecurity) then raise exception 'RLS missing'; end if;
 if not exists (select 1 from pg_class where oid='ops.vercel_runtime_diagnostics_2h'::regclass
   and 'security_invoker=true'=any(reloptions)) then raise exception 'view unsafe'; end if;
 begin
   update ops.vercel_runtime_diagnostics set level='info', status_code=null;
   raise exception 'null status incorrectly accepted as info diagnostic';
 exception when check_violation then null;
 end;
 begin
   update ops.vercel_runtime_diagnostics set request_route='/api/log?token=secret';
   raise exception 'raw URL accepted';
 exception when check_violation then null;
 end;
end $$;
insert into ops.vercel_runtime_diagnostics
 (vercel_log_id,project_id,deployment_id,environment,observed_at,level,source,category,message_policy)
values ('expired','project','deployment','production',statement_timestamp()-interval '8 days','error','lambda','timeout','not_provided'),
 ('held','project','deployment','production',statement_timestamp()-interval '8 days','error','lambda','timeout','not_provided');
insert into ops.privacy_retention_exceptions(resource_schema,resource_table,resource_key,reason,expires_at)
values ('ops','vercel_runtime_diagnostics','held','Synthetic retention test',statement_timestamp()+interval '1 day');
select ops.purge_operational_v1();
do $$ begin
 if (select array_agg(vercel_log_id order by vercel_log_id) from ops.vercel_runtime_diagnostics)
   <> array['fresh','held'] then raise exception 'retention or legal hold failed'; end if;
end $$;
select 'DIAGNOSTICS_MIGRATION_CHECKS_PASSED' as result;
'''
with tempfile.TemporaryDirectory(prefix='utekos-drain-sql-') as directory:
    data = Path(directory) / 'data'
    initialized = subprocess.run(
        [str(pg / 'initdb'), '-D', str(data), '-U', 'diagnostics_test_admin',
         '--encoding=UTF8', '--locale=C', '--auth-local=trust', '--auth-host=reject'],
        capture_output=True, text=True, timeout=20,
    )
    if initialized.returncode:
        raise RuntimeError(initialized.stderr)
    result = subprocess.run(
        [str(pg / 'postgres'), '--single', '-D', str(data), '-j', 'postgres'],
        input=bootstrap + '\n' + migration + '\n' + checks,
        capture_output=True, text=True, timeout=25,
    )
    output = result.stdout + result.stderr
    if result.returncode or re.search(r'\b(?:ERROR|FATAL|PANIC):', output) or 'DIAGNOSTICS_MIGRATION_CHECKS_PASSED' not in output:
        raise RuntimeError(output)
    print('PASS: real PostgreSQL DDL, duplicate IDs, grouping, ACL/RLS, constraints, seven-day purge and legal hold')
    print('Scope: selected actual dependency DDL; no production connection, network listener, cron execution or background job')
