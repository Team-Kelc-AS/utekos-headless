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

## Rendering path

Proxy resolves consent, the analytics identifier and the flag
before selecting a page. Eligible requests are rewritten to the
fixed internal routes `/skreddersy-varmen/layout/current` or
`/skreddersy-varmen/layout/legacy`. Ineligible requests use the
public page without an experiment assignment. The browser URL,
query string, canonical URL and analytics identifiers keep their
existing public values. Direct visits to an internal route are
redirected to `/skreddersy-varmen`, preserving the query string.

The same routing applies to HTML, RSC and prefetch requests.
Only document navigations receive landing-edge correlation.
Header navigation normalizes the two internal paths so that
active links and prefetch-on-intent agree before and after
hydration.

Each of these three pages can prerender its hero, image and
assignment marker using the existing product cache. No cookie
read sits above the page content. Purchase selection from
`searchParams` and structured data retain their own Suspense
boundaries. The flag allocation, consent gate, hash, commerce
cache policies and event contract are unchanged.

After `pnpm build`, run
`node scripts/next/verify-skreddersy-prerender.mjs` to check the
actual generated HTML for all three states. This check requires
the heading, prioritized hero image, public canonical and
correct assignment marker in the prerendered output. Also verify
both variants in a local browser and verify the exact deployed
commit before calling production behavior confirmed.

React's streamed HTML can contain the shared route loading
fallback even when the completed page is included in that same
prerendered output. The mere presence of loading text is not a
failure; the check selects the hero by its labelled section and
checks the completed content rather than the first picture in
the document, which may belong to the footer.

Documentation: [Flags SDK static pages](https://flags-sdk.dev/frameworks/next/precompute),
[Next.js Cache Components](https://nextjs.org/docs/app/getting-started/caching),
[Proxy and RSC rewrites](https://nextjs.org/docs/app/api-reference/file-conventions/proxy#rsc-requests-and-rewrites),
[usePathname with rewrites](https://nextjs.org/docs/app/api-reference/functions/use-pathname#avoid-hydration-mismatch-with-rewrites).
Next.js behavior was also checked against the documentation
shipped with the installed `next@16.3.1` package.

Local verification on 2026-09-12 passed: the production build
and TypeScript check, all three prerendered HTML checks, 21
focused proxy/experiment tests, and targeted lint. Browser
checks covered both layouts, mobile and desktop hero sources,
consent denial, purchase navigation, size selection, the cart
dialog, size guidance, URL preservation and back navigation.
The change is not deployed; production behavior remains
unverified until the exact commit is deployed and checked.

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

The query starts at the exact UTC time at which the production
50/50 rule was confirmed. It outputs aggregates only; it does not
expose visitor identifiers.

```sql
with params as (
  select timestamptz '2026-08-30T15:58:57Z' as starts_at
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
- 2026-08-30T15:58:57Z: The production 50/50 split was confirmed
  active by `user.id`, with `current` as the fallback variant.
