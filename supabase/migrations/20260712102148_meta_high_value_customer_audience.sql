begin;

create table if not exists marketing.meta_high_value_customer_profiles (
  shopify_customer_id text primary key,
  email text,
  phone text,
  fn text,
  ln text,
  dob text,
  doby text,
  age integer,
  gen text,
  zip text,
  ct text,
  st text,
  country text not null,
  value numeric not null,
  source_identity_id bigint,
  refreshed_at timestamptz not null default now(),
  constraint meta_hv_main_identifier_check
    check (email is not null or phone is not null),
  constraint meta_hv_email_check
    check (email is null or email ~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'),
  constraint meta_hv_phone_check
    check (phone is null or phone ~ '^[0-9]{8,15}$'),
  constraint meta_hv_dob_check
    check (dob is null or dob ~ '^[0-9]{8}$'),
  constraint meta_hv_doby_check
    check (doby is null or doby ~ '^[0-9]{4}$'),
  constraint meta_hv_age_check
    check (age is null or age between 0 and 125),
  constraint meta_hv_gender_check
    check (gen is null or gen in ('f', 'm')),
  constraint meta_hv_zip_check
    check (zip is null or zip ~ '^[0-9]{4}$'),
  constraint meta_hv_country_check
    check (country ~ '^[a-z]{2}$'),
  constraint meta_hv_value_check
    check (value > 500)
);

alter table marketing.meta_high_value_customer_profiles enable row level security;

revoke all on table marketing.meta_high_value_customer_profiles from public, anon, authenticated;
grant select, insert, update, delete on table marketing.meta_high_value_customer_profiles to service_role;

create or replace function marketing.refresh_meta_high_value_customer_audience()
returns bigint
language plpgsql
security definer
set search_path = ''
as $$
declare
  inserted_count bigint;
begin
  if to_regclass('marketing.shopify_customers') is null
    or to_regclass('marketing.customer_identity_links') is null
    or to_regclass('marketing.customer_source_meta_2025') is null
  then
    return 0;
  end if;

  delete from marketing.meta_high_value_customer_profiles;

  with approved as (
    select distinct on (links.shopify_customer_id)
      links.shopify_customer_id,
      src.source_identity_id,
      src.fn,
      src.ln,
      src.dob,
      src.doby_source,
      src.gen,
      src.zip,
      src.ct,
      src.name_conflict,
      src.address_conflict,
      src.dob_year_conflict
    from marketing.customer_identity_links links
    join marketing.customer_source_meta_2025 src
      on src.source_identity_id = links.source_identity_id
    where links.status = 'approved'
      and links.shopify_customer_id is not null
    order by links.shopify_customer_id, links.linked_at desc, src.source_identity_id desc
  ),
  candidates as (
    select
      shop.shopify_customer_id,
      nullif(lower(btrim(shop.email)), '') as email_candidate,
      case
        when shop.phone_e164 ~ '^\+47[0-9]{8}$'
          then regexp_replace(shop.phone_e164, '[^0-9]', '', 'g')
        else null
      end as phone_candidate,
      coalesce(
        nullif(btrim(shop.first_name), ''),
        case when coalesce(approved.name_conflict, false) = false then nullif(btrim(approved.fn), '') end
      ) as fn_candidate,
      coalesce(
        nullif(btrim(shop.last_name), ''),
        case when coalesce(approved.name_conflict, false) = false then nullif(btrim(approved.ln), '') end
      ) as ln_candidate,
      case
        when approved.source_identity_id is not null
          and coalesce(approved.dob_year_conflict, false) = false
          and approved.dob between date '1900-01-01' and current_date
          then to_char(approved.dob, 'YYYYMMDD')
      end as dob_candidate,
      case
        when approved.source_identity_id is not null
          and coalesce(approved.dob_year_conflict, false) = false
          then coalesce(
            extract(year from approved.dob)::integer,
            approved.doby_source::integer
          )::text
      end as doby_candidate,
      case
        when approved.source_identity_id is not null
          and coalesce(approved.dob_year_conflict, false) = false
          and approved.dob between date '1900-01-01' and current_date
          then extract(year from age(current_date, approved.dob))::integer
      end as age_candidate,
      case
        when lower(btrim(approved.gen::text)) in ('f', 'm')
          then lower(btrim(approved.gen::text))
      end as gen_candidate,
      case
        when approved.source_identity_id is not null
          and coalesce(approved.address_conflict, false) = false
          and regexp_replace(coalesce(approved.zip, ''), '[^0-9]', '', 'g') ~ '^[0-9]{4}$'
          then regexp_replace(approved.zip, '[^0-9]', '', 'g')
      end as zip_candidate,
      case
        when approved.source_identity_id is not null
          and coalesce(approved.address_conflict, false) = false
          then nullif(
            regexp_replace(lower(btrim(approved.ct)), '[[:space:][:punct:]]+', '', 'g'),
            ''
          )
      end as ct_candidate,
      shop.total_spent,
      approved.source_identity_id
    from marketing.shopify_customers shop
    left join approved
      on approved.shopify_customer_id = shop.shopify_customer_id
    where shop.orders_count > 0
      and shop.total_spent > 500
      and shop.currency_code = 'NOK'
  ),
  normalized as (
    select
      shopify_customer_id,
      case
        when email_candidate ~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'
          then email_candidate
      end as email,
      phone_candidate as phone,
      nullif(regexp_replace(lower(btrim(fn_candidate)), '[[:punct:]]+', '', 'g'), '') as fn,
      nullif(regexp_replace(lower(btrim(ln_candidate)), '[[:punct:]]+', '', 'g'), '') as ln,
      dob_candidate as dob,
      doby_candidate as doby,
      age_candidate as age,
      gen_candidate as gen,
      zip_candidate as zip,
      ct_candidate as ct,
      null::text as st,
      'no'::text as country,
      total_spent as value,
      source_identity_id
    from candidates
  )
  insert into marketing.meta_high_value_customer_profiles (
    shopify_customer_id,
    email,
    phone,
    fn,
    ln,
    dob,
    doby,
    age,
    gen,
    zip,
    ct,
    st,
    country,
    value,
    source_identity_id,
    refreshed_at
  )
  select
    shopify_customer_id,
    email,
    phone,
    fn,
    ln,
    dob,
    doby,
    age,
    gen,
    zip,
    ct,
    st,
    country,
    value,
    source_identity_id,
    statement_timestamp()
  from normalized
  where email is not null or phone is not null;

  get diagnostics inserted_count = row_count;
  return inserted_count;
end;
$$;

revoke all on function marketing.refresh_meta_high_value_customer_audience() from public, anon, authenticated;
grant execute on function marketing.refresh_meta_high_value_customer_audience() to service_role;

drop view if exists marketing.meta_high_value_customer_audience_export;

create view marketing.meta_high_value_customer_audience_export
with (security_invoker = true)
as
select
  email,
  phone,
  fn,
  ln,
  dob,
  doby,
  age,
  gen,
  zip,
  ct,
  st,
  country,
  value
from marketing.meta_high_value_customer_profiles
order by shopify_customer_id;

revoke all on table marketing.meta_high_value_customer_audience_export from public, anon, authenticated;
grant select on table marketing.meta_high_value_customer_audience_export to service_role;

do $optional_customer_source_security$
begin
  if to_regclass('marketing.customer_source_meta_2025_raw') is not null then
    alter table marketing.customer_source_meta_2025_raw enable row level security;
    revoke all on table marketing.customer_source_meta_2025_raw from public, anon, authenticated;
    grant select, insert, update, delete on table marketing.customer_source_meta_2025_raw to service_role;
  end if;

  if to_regclass('marketing.customer_source_meta_2025') is not null then
    alter table marketing.customer_source_meta_2025 enable row level security;
    revoke all on table marketing.customer_source_meta_2025 from public, anon, authenticated;
    grant select, insert, update, delete on table marketing.customer_source_meta_2025 to service_role;
  end if;

  if to_regclass('marketing.customer_identity_links') is not null then
    alter table marketing.customer_identity_links enable row level security;
    revoke all on table marketing.customer_identity_links from public, anon, authenticated;
    grant select, insert, update, delete on table marketing.customer_identity_links to service_role;
  end if;
end;
$optional_customer_source_security$;

comment on table marketing.meta_high_value_customer_profiles is
  'Secure normalized source for the Utekos Meta high-value customer audience. Do not export this table directly; use meta_high_value_customer_audience_export.';

comment on view marketing.meta_high_value_customer_audience_export is
  'Meta Customer List CSV export. Contains only normalized Meta identifier and customer value fields.';

do $optional_legacy_audience_comment$
begin
  if to_regclass('marketing.meta_customer_audience') is not null then
    comment on view marketing.meta_customer_audience is
      'Legacy audience view. Use marketing.meta_high_value_customer_audience_export for new Meta uploads.';
  end if;
end;
$optional_legacy_audience_comment$;

do $initial_meta_audience_refresh$
begin
  if to_regclass('marketing.shopify_customers') is not null
    and to_regclass('marketing.customer_identity_links') is not null
    and to_regclass('marketing.customer_source_meta_2025') is not null
  then
    perform marketing.refresh_meta_high_value_customer_audience();
  end if;
end;
$initial_meta_audience_refresh$;

commit;

;
