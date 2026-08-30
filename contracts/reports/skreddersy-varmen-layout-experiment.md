# `/skreddersy-varmen` layout experiment

## Contract

- Flag key: `skreddersy-varmen-layout-v1`
- Variants: `current` and `legacy`
- Safe default: `current`
- Allocation: 50/50 by `user.id` in Vercel Flags
- Eligible population: visitors with explicit Cookiebot
  statistics consent and a valid `_ga` identifier
- Ineligible or failed evaluation: `current`

The bucketing identifier sent to Vercel is a SHA-256 digest
scoped to the flag. The raw `_ga` value is never sent to Vercel
for flag evaluation. A visitor keeps the same variant while the
underlying analytics identifier remains stable.

## Measurement path

The internal canonical event envelope carries:

```json
{
  "experiment": {
    "key": "skreddersy-varmen-layout-v1",
    "variant": "current"
  }
}
```

The assignment is allowed only when analytics consent is
`granted`. It is retained in `marketing.event_ledger` and carried
through Shopify cart note attributes so a paid order can retain
its assigned variant. The assignment is removed from every
provider outbox payload; it is not sent to Meta, Google,
Microsoft, Pinterest or Snapchat, and it does not alter
`event_id`.

No database migration is required because the canonical payload
is already a JSONB column.

## Read-only result query

Replace the timestamp below with the exact UTC time at which the
production 50/50 rule was confirmed. The query outputs aggregates
only; it does not expose visitor identifiers.

```sql
with params as (
  select timestamptz 'YYYY-MM-DDTHH:MM:SSZ' as starts_at
),
source_events as (
  select id, event_name, occurred_at, payload
  from marketing.event_ledger
  union
  select id, event_name, occurred_at, payload
  from analytics.event_ledger_archive
),
normalized as (
  select
    payload #>> '{experiment,variant}' as variant,
    event_name,
    coalesce(
      nullif(payload #>> '{browser_id,ga_client_id}', ''),
      nullif(payload #>> '{browser_id,ga_client}', ''),
      nullif(payload #>> '{browser_id,ga_cookie}', '')
    ) as visitor_id,
    nullif(payload #>> '{custom_data,transaction_id}', '') as transaction_id,
    case
      when event_name = 'purchase'
        and payload #>> '{custom_data,currency}' = 'NOK'
        and payload #>> '{custom_data,value}' ~ '^[0-9]+([.][0-9]+)?$'
      then (payload #>> '{custom_data,value}')::numeric
      else 0
    end as revenue_nok
  from source_events, params
  where occurred_at >= params.starts_at
    and payload ->> 'environment' = 'production'
    and payload #>> '{experiment,key}' = 'skreddersy-varmen-layout-v1'
),
variants(variant) as (
  values ('current'::text), ('legacy'::text)
),
funnel as (
  select
    variant,
    count(distinct visitor_id)
      filter (where event_name = 'page_view') as exposed_visitors,
    count(distinct visitor_id)
      filter (where event_name = 'add_to_cart') as add_to_cart_visitors,
    count(distinct visitor_id)
      filter (where event_name = 'begin_checkout') as checkout_visitors,
    count(distinct transaction_id)
      filter (where event_name = 'purchase') as purchase_orders,
    sum(revenue_nok) as revenue_nok
  from normalized
  where variant in ('current', 'legacy')
  group by variant
)
select
  variants.variant,
  coalesce(funnel.exposed_visitors, 0) as exposed_visitors,
  coalesce(funnel.add_to_cart_visitors, 0) as add_to_cart_visitors,
  coalesce(funnel.checkout_visitors, 0) as checkout_visitors,
  coalesce(funnel.purchase_orders, 0) as purchase_orders,
  coalesce(funnel.revenue_nok, 0) as revenue_nok,
  round(
    100.0 * coalesce(funnel.purchase_orders, 0)
      / nullif(funnel.exposed_visitors, 0),
    2
  ) as purchase_rate_percent
from variants
left join funnel using (variant)
order by variants.variant;
```

Interpret purchase rate together with add-to-cart rate, checkout
rate, revenue per exposed visitor and the actual sample size. Do
not stop the test because of an early directional difference.
Record a minimum sample/duration before using the result for a
permanent page decision.

## Operations

1. Keep all environments on `current` until the exact `main`
   deployment is `READY` and owns the production domain.
2. Activate the production split at 50/50 by `user.id`.
3. Read the flag configuration back and smoke-test the public
   page.
4. Confirm that both variants begin appearing in the internal
   ledger after natural, consented traffic. Code and deployment
   status alone do not prove event persistence or purchases.
5. For immediate rollback, set the production flag to `current`;
   no code deployment is required.

## Release record

- 2026-08-30: The first approved `main` release commit
  (`5fa8b12163bc954641843e0de4d1724c17ebd9d5`) was present on
  GitHub, but Vercel had not created a deployment after more than
  ten minutes. The release was retried through the project's
  required `pnpm run sync` path; no direct Vercel deployment was
  used.
- 2026-08-30: Vercel rejected the first split command before any
  rule changed because `user.userId` is not a supported entity
  attribute. The implementation was corrected to the documented
  `user.id` contract before activation.
