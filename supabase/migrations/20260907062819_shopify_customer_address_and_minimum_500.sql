
alter table marketing.shopify_customers
  add column if not exists zip text,
  add column if not exists country_code text;

comment on column marketing.shopify_customers.zip is
  'Raw default-address postal code from Shopify; validated before audience export.';
comment on column marketing.shopify_customers.country_code is
  'ISO 3166-1 alpha-2 country code from the Shopify default address.';

alter table marketing.shopify_customers
  drop constraint if exists shopify_customers_country_code_format;
alter table marketing.shopify_customers
  add constraint shopify_customers_country_code_format
  check (country_code is null or country_code ~ '^[A-Z]{2}$');

alter table marketing.meta_high_value_customer_profiles
  drop constraint if exists meta_hv_value_check;
alter table marketing.meta_high_value_customer_profiles
  add constraint meta_hv_value_check
  check (value >= 500::numeric);

create or replace function marketing.refresh_meta_high_value_customer_audience()
returns bigint
language plpgsql
security definer
set search_path to ''
as $function$
declare
  inserted_count bigint;
begin
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
          then coalesce(extract(year from approved.dob)::integer, approved.doby_source::integer)::text
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
        when upper(coalesce(shop.country_code, '')) = 'NO'
          and regexp_replace(coalesce(shop.zip, ''), '[^0-9]', '', 'g') ~ '^[0-9]{4}$'
          then regexp_replace(shop.zip, '[^0-9]', '', 'g')
        when (shop.country_code is null or upper(shop.country_code) = 'NO')
          and approved.source_identity_id is not null
          and coalesce(approved.address_conflict, false) = false
          and regexp_replace(coalesce(approved.zip, ''), '[^0-9]', '', 'g') ~ '^[0-9]{4}$'
          then regexp_replace(approved.zip, '[^0-9]', '', 'g')
      end as zip_candidate,
      case
        when approved.source_identity_id is not null
          and coalesce(approved.address_conflict, false) = false
          then nullif(regexp_replace(lower(btrim(approved.ct)), '[[:space:][:punct:]]+', '', 'g'), '')
      end as ct_candidate,
      case
        when upper(coalesce(shop.country_code, '')) ~ '^[A-Z]{2}$'
          then lower(shop.country_code)
        else 'no'
      end as country_candidate,
      shop.total_spent,
      approved.source_identity_id
    from marketing.shopify_customers shop
    left join approved on approved.shopify_customer_id = shop.shopify_customer_id
    where shop.orders_count > 0
      and shop.total_spent >= 500
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
      country_candidate as country,
      total_spent as value,
      source_identity_id
    from candidates
  )
  insert into marketing.meta_high_value_customer_profiles (
    shopify_customer_id, email, phone, fn, ln, dob, doby, age, gen,
    zip, ct, st, country, value, source_identity_id, refreshed_at
  )
  select
    shopify_customer_id, email, phone, fn, ln, dob, doby, age, gen,
    zip, ct, st, country, value, source_identity_id, statement_timestamp()
  from normalized
  where email is not null or phone is not null;

  get diagnostics inserted_count = row_count;
  return inserted_count;
end;
$function$;
