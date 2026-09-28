# Vipps Express — implementation and launch evidence

Status 2026-09-27: the server implementation is deployed and the production configuration is prepared for public activation. The private ledger migration was applied to the existing Supabase project hkoawfbomhnzupcsdggb. Readback verified RLS enabled, only owner postgres in table ACL, and zero rows. The configured server database connection verified insert/delete access and sequential lease exclusion (first claim 1, competing claim 0); the synthetic row was removed in the same transaction. This was not a concurrent multi-connection or lease-expiry test.

The Vipps **test** webhook is registered for `https://utekos.no/api/vipps/webhook` for authorized and captured payment events. A separate production registration with the same URL and both events is registered for Utekos sales unit `728093`; its secret is stored only as Vercel's sensitive `VIPPS_WEBHOOK_SECRET`. The existing production portal webhook points to the separate Heroku gateway and remains untouched. Vercel Production has the Utekos production configuration (`VIPPS_ENVIRONMENT=production`, production sales-unit keys, public feature flag and webhook secret) as well as the isolated test configuration. A deployment after this configuration change is required before public traffic receives it. No production payment or Shopify paid order has been initiated by setup work.

## Accepted capture decision

User decision: capture as soon as the payment is authorized, independent of Shopify fulfillment. Mark Shopify PAID only after successful capture is verified. Fulfillment and tracking notification remain the existing Shopify shipping workflow.

The implementation uses this stricter evidence chain:

1. Read the payment from Vipps; check reference, NOK amount, authorization, and aggregate amounts.
2. Read the **saved** Shopify draft, copy consented Vipps customer/delivery data, and verify that its recalculated total still matches the payment.
3. Capture the complete amount using one deterministic idempotency key per environment, MSN, reference and amount.
4. Read the payment again, including after a capture timeout. Only a full captured aggregate with no cancellation/refund passes.
5. Complete that same Shopify draft, then read back the resulting order and verify PAID.

Neither a browser redirect, SDK success event, webhook payload alone, nor HTTP 200 from capture can mark an order PAID. A retry after an already completed capture does not submit another capture. If Shopify completion times out, read the same draft on the next attempt; never create another order.

## Ownership and entry points

- `src/components/ProductCard/ProductCard.tsx`: replaces the shared available-product add-to-cart CTA when the public feature flag is enabled. Sold-out Utekos Dun cards use a single waitlist CTA; Klarna remains available only for in-stock products.
- `src/components/vipps`: official Vipps Widget SDK and return-page polling. The SDK owns the button, desktop dialog and mobile app-switch; no Utekos confirmation dialog is shown. Buys one selected variant; it does not include other cart items.
- `POST /api/vipps/checkout`: same-origin, rate-limited server checkout creation. Price and availability come from Shopify, not browser-supplied totals.
- `POST /api/vipps/webhook`: signed raw-body verification, configured MSN and reference-prefix isolation, authoritative reconciliation.
- `POST /api/vipps/status`: same-origin, signed-capability reconciliation for the return page. Returns no customer profile or address.
- `src/lib/vipps/captureAndComplete.ts`: capture/PAID invariant and stable capture key.
- `src/lib/vipps/shopifyOrder.ts`: pinned Shopify Admin API `2026-04` draft operations. Paid completion represents an externally captured payment; it is **not** a payment processed by the installed Shopify Vipps app.
- `src/lib/vipps/checkoutStore.ts`: durable intent/draft/payment state plus atomic lease in private Postgres storage. No fire-and-forget/background processing.
- `supabase/migrations/20260927120000_vipps_express_checkouts.sql`: applied storage migration. No public/client/service-role access is granted; configured direct server database role verified as postgres.

Shipping initially follows the existing `merchantShippingServiceJsonLd` policy: Norway only, standard shipping NOK 99 below NOK 999, free from NOK 999. It is labelled as generic standard shipping, not a promised carrier/pickup-point service. Vipps adds the selected shipping amount to the item amount; capture verifies the complete total. This still needs merchant/staging confirmation, including tax, discount and threshold cases.

New Vipps payment attempts use the server-verified Shopify product title, color and size as `paymentDescription`, for example `Utekos TechDown™ Havdyp, Middels`. Gender and Shopify's combined variant title are deliberately omitted. Products without a recognized color or size use only the product title. Existing immutable attempts retain the description they were created with. The Vipps-hosted dialog controls where the description is rendered; local tests verify the submitted payload, not its provider-side placement.

## Discount codes

The checkout API accepts an optional Shopify discount code from approved first-party flows. It is normalized to uppercase and passed as `DraftOrderInput.discountCodes`; Shopify is the authority for whether that code is active and applicable. The ProductCard Vipps button deliberately does not add a merchant-built discount dialog ahead of the Vipps-hosted payment dialog. The exact applied code is retained as a Draft Order attribute for support/reconciliation.

Vipps requires the merchandise amount submitted to ePayment to be at least NOK 1.00. If an applied code reduces the merchandise amount below that threshold (including `KRISTOFFERTESTRABATT` on Utekos Stapper™), the server verifies that Shopify retained the code and returns the Draft Order's `invoiceUrl`. The browser then goes **directly to Shopify checkout**. It does not give that URL to the Vipps Widget SDK. All other eligible purchases still hand the ePayment `redirectUrl` to the Widget SDK and keep the Vipps Express modal/app-switch flow.

## Configuration — names only, never paste secrets into chat or logs

Common requirements:

- `VIPPS_ENVIRONMENT`: `test` (default) or explicit `production`.
- `VIPPS_CHECKOUT_ORIGIN`: exact public HTTPS origin without trailing slash.
- `VIPPS_CHECKOUT_SECRET`: dedicated random secret of at least 32 characters for return/status capabilities.
- `VIPPS_WEBHOOK_SECRET`: secret returned by registration of the exact `${VIPPS_CHECKOUT_ORIGIN}/api/vipps/webhook` URL.
- Existing server Postgres and Redis connectivity. Redis is used for rate limits, not authoritative payment state.
- `VIPPS_EXPRESS_ENABLED=true`: permits new server-side checkouts. Off by default. Turning it off does **not** prevent reconciliation of existing payments.
- `NEXT_PUBLIC_VIPPS_EXPRESS_ENABLED=true`: enables ProductCard button replacement at build time. Off by default.

Vipps test credentials: `VIPPS_MSN_TEST`, `VIPPS_TEST_CLIENT_ID`, `VIPPS_TEST_CLIENT_SECRET`, `VIPPS_TEST_SUBSCRIPTION_KEY`. The verified existing local alias `VIPPS_API_KEY` is accepted for the test subscription key only.

Shopify test credentials: `VIPPS_SHOPIFY_TEST_STORE_DOMAIN` plus either an optional `VIPPS_SHOPIFY_TEST_ADMIN_TOKEN` or the installed EventHandler app's `SHOPIFY_EVENTHANDLER_APP_CLIENT_ID` and `SHOPIFY_EVENTHANDLER_APP_CLIENT_SECRET`. The latter is the normal test path: its client-credentials token stays only in process memory and refreshes at least 60 seconds before expiry. The availability query is server-side Admin GraphQL, so no separate test Storefront token is needed. The Admin adapter refuses a test domain equal to the production `STORE_DOMAIN`. Test catalog variants must come from that development shop; live variant IDs are not interchangeable.

Vipps production credentials: `VIPPS_MSN`, `VIPPS_CLIENT_ID`, `VIPPS_CLIENT_SECRET`, `VIPPS_OCP_APIM_PRIMARY`. Production runtime additionally requires MSN `728093`. Shopify uses existing `STORE_DOMAIN` and `SHOPIFY_ADMIN_API_TOKEN`.

Presence check during this work found the new test-Shopify, origin, return-secret, webhook-secret and feature-flag variables absent from `.env.local`. No values were printed or changed.

## Outstanding launch gates — do not enable production yet

1. Storage migration and server-role access verified. Still exercise concurrent claims across separate connections and lease expiry; the initial sequential exclusion test is not concurrency proof.
2. Configure a Shopify development store/catalog and HTTPS test origin. Register the Vipps test webhook with explicit authorization and store its secret securely. Use the Merchant Test app for Express; the force-approve endpoint does not support Express.
3. Complete an actual test purchase on mobile and desktop. Verify the Vipps-hosted SDK modal/focus handling, back/cancel paths, return URL fragment preservation, and full-page redirect fallback. UI, WCAG and provider end-to-end behavior remain unverified by the unit tests.
4. Verify that signed webhook reconciliation succeeds when the customer never returns. Vipps retries after 10 seconds without a response; the current synchronous multi-call handler can exceed that. Measure latency and harden bounded progress/recovery before launch. Do not silently acknowledge unfinished work or introduce background jobs under the current prohibition.
5. Integrate Vipps into the existing canonical checkout attribution and BeginCheckout contract. The existing enum supports only `shopify_checkout` and `klarna_express`; this work has not changed tracking or emitted live events. Preserve consent and provider deduplication. Validate that Shopify `orders/paid` produces exactly one canonical Purchase with the correct Vipps checkout method. Do not map Vipps to Klarna or silently rely on a fallback.
6. Establish the refund/cancellation/reconciliation operating path. Low-level Vipps refund/cancel client methods exist, but there is no approved operator UI or Shopify refund synchronization. Native Shopify Vipps/Klarna apps must not be assumed to refund this custom external payment. A manual Shopify paid/refunded marker is not proof of a Vipps movement.
7. Verify actual draft tax/discount/inventory reservation behavior and current standard-shipping policy with the merchant. Test recovery from an ambiguous draft-create timeout: the current safe behavior is `draft_creating` requiring reconciliation, not blind recreation.
8. Verify alerting and an operator recovery path for capture succeeded / Shopify incomplete, expired leases, and long-lived unresolved attempts. Agree on ledger retention/deletion; no cleanup job was introduced.
9. Complete storefront/browser regression checks and obtain explicit deployment approval. The full local repository build has passed, but this is not UI/provider evidence. Use only the repository's authorized main-branch deployment workflow and preserve unrelated dirty changes.

## Focused local checks

```sh
source "$HOME/.nvm/nvm.sh" && nvm use --silent
NODE_OPTIONS='--conditions=react-server' corepack pnpm exec tsx --test src/lib/vipps/*.test.ts
corepack pnpm exec tsc --noEmit --incremental false
corepack pnpm exec eslint src/lib/vipps src/components/vipps src/app/api/vipps 'src/app/(store)/vipps' src/components/ProductCard/ProductCard.tsx src/lib/security/buildReportOnlyCsp.ts
```

Verified local results before the latest discount-flow update: 38 Vipps-focused tests plus 3 existing CSP regression tests passed (41 total); scoped ESLint passed; full TypeScript check passed; `corepack pnpm run build` passed with all 189 static pages generated. The current discount update adds 3 focused tests (44 total) and passed its TypeScript check; the full build is rerun for every deploy candidate. The first build found three incompatible `runtime` route exports under Next.js 16.3.1 Cache Components; these were removed according to installed official docs/source (Node.js remains the default), then the full build passed. Local QueueClient region and runtime-cache fallback warnings remained; no warning suppression was added.

The tests use synthetic fetch responses, not provider writes. Covered: reservation vs capture, partial amounts, cancellation/refund guards, identity mismatch, timeouts, same-key retries, same-draft completion, token refresh, profile fields, test/live isolation and webhook signature tampering. Four Shopify GraphQL operations were also checked with the official schema validator. These checks do not prove provider delivery, capture settlement or UI correctness.

## Verified documentation used

- [Vipps online payments](https://developer.vippsmobilepay.com/docs/APIs/epayment-api/how-it-works/online/)
- [Vipps profile sharing](https://developer.vippsmobilepay.com/docs/APIs/epayment-api/api-guide/features/profile-sharing/)
- [Vipps Widget SDK](https://developer.vippsmobilepay.com/docs/knowledge-base/widget/)
- [Vipps webhook delivery and retries](https://developer.vippsmobilepay.com/docs/APIs/webhooks-api/api-guide/)
- [Shopify DraftOrderInput, pinned version](https://shopify.dev/docs/api/admin-graphql/2026-04/input-objects/DraftOrderInput)
- Official Shopify MCP schema/operation validator; installed Vipps Developer skills for ePayment, payment lifecycle, Widget SDK, webhooks, access tokens and test/go-live.

Utekos brand rules were kept for the surrounding confirmation/return UI; the payment button itself is rendered by Vipps' official SDK. No product images or logos were altered.
