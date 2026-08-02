drop trigger if exists set_meta_high_value_customer_state
  on marketing.meta_high_value_customer_profiles;

drop function if exists marketing.set_meta_high_value_customer_state();

update marketing.meta_high_value_customer_profiles
set st = null
where st is not null;

create table if not exists marketing.meta_high_value_customer_audience_additions_20260731 (
  shopify_customer_id text primary key,
  shopify_created_at timestamptz not null,
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
  snapshot_created_at timestamptz not null default now()
);

truncate table marketing.meta_high_value_customer_audience_additions_20260731;

insert into marketing.meta_high_value_customer_audience_additions_20260731 (
  shopify_customer_id,
  shopify_created_at,
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
)
select
  p.shopify_customer_id,
  s.shopify_created_at,
  p.email,
  p.phone,
  p.fn,
  p.ln,
  p.dob,
  p.doby,
  p.age,
  p.gen,
  p.zip,
  p.ct,
  p.st,
  p.country,
  p.value
from marketing.meta_high_value_customer_profiles p
join marketing.shopify_customers s
  on s.shopify_customer_id = p.shopify_customer_id
where s.shopify_created_at > timestamptz '2026-07-07 22:29:26+00'
  and s.orders_count > 0
  and s.total_spent > 500
  and s.currency_code = 'NOK'
  and (p.email is not null or p.phone is not null)
order by s.shopify_created_at;

create or replace view marketing.meta_high_value_customer_audience_additions_20260731_export as
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
from marketing.meta_high_value_customer_audience_additions_20260731
order by shopify_created_at;

comment on table marketing.meta_high_value_customer_audience_additions_20260731 is
  'Snapshot containing only high-value Shopify customers created after the prior Meta seed export cutoff. Upload with ADD; do not use as a replacement audience.';

comment on view marketing.meta_high_value_customer_audience_additions_20260731_export is
  'Meta-ready ADD export containing only the 37 new qualifying customers after 2026-07-07 22:29:26+00.';;
