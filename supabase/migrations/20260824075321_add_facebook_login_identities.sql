set lock_timeout = '5s';

create table marketing.facebook_login_identities (
  id uuid primary key default gen_random_uuid(),
  app_id text not null
    check (app_id ~ '^[0-9]{1,64}$'),
  facebook_login_id text not null
    check (facebook_login_id ~ '^[0-9]{1,64}$'),
  external_id text not null
    check (
      external_id ~ '^anon_[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
    ),
  email_ciphertext text
    check (
      email_ciphertext is null
      or email_ciphertext ~ '^v1\.[A-Za-z0-9_-]{16}\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]{22}$'
    ),
  email_sha256 text
    check (
      email_sha256 is null
      or email_sha256 ~ '^[a-f0-9]{64}$'
    ),
  phone_ciphertext text
    check (
      phone_ciphertext is null
      or phone_ciphertext ~ '^v1\.[A-Za-z0-9_-]{16}\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]{22}$'
    ),
  phone_sha256 text
    check (
      phone_sha256 is null
      or phone_sha256 ~ '^[a-f0-9]{64}$'
    ),
  email_permission_granted boolean not null default false,
  fbclid text check (fbclid is null or length(fbclid) between 1 and 500),
  fbc text check (fbc is null or length(fbc) between 1 and 500),
  campaign_id text check (campaign_id is null or length(campaign_id) between 1 and 500),
  campaign_name text check (campaign_name is null or length(campaign_name) between 1 and 500),
  adset_id text check (adset_id is null or length(adset_id) between 1 and 500),
  adset_name text check (adset_name is null or length(adset_name) between 1 and 500),
  ad_id text check (ad_id is null or length(ad_id) between 1 and 500),
  ad_name text check (ad_name is null or length(ad_name) between 1 and 500),
  login_count integer not null default 1 check (login_count >= 1),
  first_login_at timestamptz not null default statement_timestamp(),
  last_login_at timestamptz not null default statement_timestamp(),
  contact_updated_at timestamptz,
  created_at timestamptz not null default statement_timestamp(),
  updated_at timestamptz not null default statement_timestamp(),
  expires_at timestamptz not null
    default (statement_timestamp() + interval '180 days'),
  unique (app_id, facebook_login_id),
  constraint facebook_login_identities_email_pair_check
    check (
      (email_ciphertext is null) = (email_sha256 is null)
    ),
  constraint facebook_login_identities_phone_pair_check
    check (
      (phone_ciphertext is null) = (phone_sha256 is null)
    ),
  constraint facebook_login_identities_retention_check
    check (
      last_login_at >= first_login_at
      and updated_at >= created_at
      and expires_at > updated_at
      and expires_at <= updated_at + interval '180 days 5 minutes'
    )
);

comment on table marketing.facebook_login_identities is
  'Service-role-only Facebook Login identity bridge for voluntary Meta-origin login. Stores app-scoped ID, encrypted contact data, provider-ready hashes and acquisition identifiers. Never stores Facebook access tokens and never creates Shopify customers.';
comment on column marketing.facebook_login_identities.email_ciphertext is
  'AES-256-GCM application-encrypted normalized email. Plaintext email is forbidden.';
comment on column marketing.facebook_login_identities.phone_ciphertext is
  'AES-256-GCM application-encrypted E.164 phone. Plaintext phone is forbidden.';

create index facebook_login_identities_external_id_idx
  on marketing.facebook_login_identities (external_id, last_login_at desc);
create index facebook_login_identities_email_sha256_idx
  on marketing.facebook_login_identities (email_sha256)
  where email_sha256 is not null;
create index facebook_login_identities_phone_sha256_idx
  on marketing.facebook_login_identities (phone_sha256)
  where phone_sha256 is not null;
create index facebook_login_identities_expires_at_idx
  on marketing.facebook_login_identities (expires_at);

alter table marketing.facebook_login_identities
  enable row level security;
alter table marketing.facebook_login_identities
  force row level security;
revoke all on table marketing.facebook_login_identities
  from public, anon, authenticated, service_role;
grant usage on schema marketing to service_role;
grant select, insert, update, delete
  on table marketing.facebook_login_identities
  to service_role;

create or replace function ops.purge_expired_facebook_login_identities()
returns bigint
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_deleted bigint := 0;
  v_now timestamptz := statement_timestamp();
begin
  delete from marketing.facebook_login_identities identity
  where identity.expires_at <= v_now
    and not ops.has_active_privacy_retention_exception(
      'marketing',
      'facebook_login_identities',
      identity.id::text,
      v_now
    );

  get diagnostics v_deleted = row_count;
  return v_deleted;
end;
$$;

comment on function ops.purge_expired_facebook_login_identities() is
  'Deletes expired voluntary Facebook Login identity bridges after at most 180 days unless a time-limited privacy retention exception is active.';

revoke all on function ops.purge_expired_facebook_login_identities()
  from public;
revoke execute on function ops.purge_expired_facebook_login_identities()
  from public, anon, authenticated;
grant execute on function ops.purge_expired_facebook_login_identities()
  to service_role, postgres;

do $schedule_facebook_login_identity_purge$
declare
  v_job_exists boolean;
begin
  if to_regclass('cron.job') is null then
    raise exception using
      errcode = '55000',
      message = 'pg_cron cron.job is required for Facebook Login identity retention';
  end if;

  execute $query$
    select exists (
      select 1
      from cron.job
      where jobname = 'purge_expired_facebook_login_identities'
    )
  $query$ into v_job_exists;

  if not v_job_exists then
    perform cron.schedule(
      'purge_expired_facebook_login_identities',
      '23 2 * * *',
      'select ops.purge_expired_facebook_login_identities();'
    );
  end if;
end;
$schedule_facebook_login_identity_purge$;

