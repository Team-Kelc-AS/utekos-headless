-- Durable payment orchestration. No cron/background job; signed webhooks and bounded customer polling reconcile.
create schema if not exists private;
create table private.vipps_express_checkouts (
  environment text not null check (environment in ('test','production')),
  msn text not null,
  reference text not null check (reference ~ '^[a-zA-Z0-9-]{8,64}$'),
  state jsonb not null,
  lease_owner uuid,
  lease_until timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (environment, msn, reference)
);
alter table private.vipps_express_checkouts enable row level security;
revoke all on private.vipps_express_checkouts from public, anon, authenticated, service_role;
comment on table private.vipps_express_checkouts is
  'Server-only Vipps references, immutable checkout intent, saved Shopify draft and reconciliation state. Never store payment credentials here.';
