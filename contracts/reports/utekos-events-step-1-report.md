# Utekos API platform — Step 1 report

Date: 2026-08-15
Repository: `Team-Kelc-AS/utekos-headless`
Characterized commit:
`97a0a4538f9682a2b210e50b770ce59f826b42ac`
Working branch: `codex/utekos-events-contracts-20260815`

## Outcome

- All 27 `src/app/api/events/*/route.ts` modules are mapped to
  their actual request handler, route wrapper, acceptance
  handler, normalizer, and Zod schema.
- UtekosCommon `0.1.0` exists as a private, unpublished OpenAPI
  3.0 Domain in SwaggerHub.
- Utekos Events API `0.1.0` exists as a private, unpublished
  OpenAPI 3.0.3 API in SwaggerHub and references UtekosCommon.
- The fetched Registry API definition matches the repository's
  `openapi.swaggerhub.json` exactly after JSON normalization.
- The fetched Domain content matches the repository's
  `domain.json` semantically, with 24 schemas.
- Raw and Registry standardization scans returned 0 issues.
- The characterization suite passes 37 tests without writing to
  Supabase or provider dispatch.
- A complete event-delivery parameter contract covers all 33
  canonical catalog events and separates canonical input, browser
  delivery, and server delivery for Supabase, Google, Meta,
  Microsoft UET, PostHog, and Shopify-owned checkout telemetry.
- The contract records required, conditional, recommended, and
  optional fields, installed integration owners/versions, consent
  gates, transformations, and explicit non-delivery states.

SwaggerHub resources:

- <https://app.swaggerhub.com/domains/kelc/UtekosCommon/0.1.0>
- <https://app.swaggerhub.com/apis/kelc/UtekosEventsAPI/0.1.0>

## Implementation map

The exhaustive route-by-route matrix is in
`contracts/reports/utekos-events-0.1.0-implementation-matrix.md`.
Common behavior across all routes is:

- `POST` with `maxDuration = 60`.
- Vercel geolocation/IP enrichment followed by traffic
  classification.
- Same-origin `Origin` validation, exact JSON media type, and a
  32 KiB UTF-8 body limit.
- Zod parsing before canonical normalization and acceptance.
- `202 accepted`, `200 duplicate`, `204 suppressed`,
  `400 invalid_json|invalid_event`, `403 forbidden_origin`,
  `413 payload_too_large`, `415 unsupported_media_type`, and
  `500 internal_error`.

Twenty-three routes use the shared browser event request handler.
`page-view`, `add-to-cart`, `begin-checkout`, and `view-item` use
specialized request handlers while retaining the shared
observable status/body contract.

## Repository changes

- `package.json`: generate, drift-check, and
  characterization-test commands.
- `scripts/contracts/utekosEventsContractCatalog.ts`: explicit
  27-operation catalog with implementation paths and Zod-valid
  examples.
- `scripts/contracts/generateUtekosEventsContracts.ts`:
  deterministic Domain, OpenAPI, SwaggerHub, ReadyAPI-manifest,
  and matrix generator.
- `scripts/contracts/utekosEventDeliveryParameterCatalog.ts`:
  provider-documented and implementation-characterized parameter
  rules for all 33 canonical events and every configured
  browser/server transport.
- `scripts/contracts/verifyUtekosEventsContracts.test.ts`: route
  completeness, file traceability, schema parity,
  Domain-reference, and HTTP characterization checks.
- `contracts/README.md`: contract ownership and change
  discipline.
- `contracts/domains/utekos-common/0.1.0/domain.json`:
  UtekosCommon Domain.
- `contracts/openapi/utekos-events/0.1.0/openapi.json`:
  repository-relative source contract.
- `contracts/openapi/utekos-events/0.1.0/openapi.resolved.json`:
  self-contained import/scan contract.
- `contracts/openapi/utekos-events/0.1.0/openapi.swaggerhub.json`:
  official SwaggerHub Domain-reference form.
- `contracts/readyapi/utekos-events/README.md`: controlled
  import/execution guidance.
- `contracts/readyapi/utekos-events/characterization-cases.json`:
  27 operations, 5 safe negative cases, and 4 controlled outcome
  cases.
- `contracts/events/utekos-event-delivery/0.1.0/parameter-contract.json`:
  machine-readable complete parameter and transport contract.
- `contracts/reports/utekos-event-delivery-parameter-matrix.md`:
  event/provider delivery status and integration ownership.
- `contracts/governance/*`: scan method and evidence.
- `contracts/reports/*`: implementation matrix and this report.

No runtime file under `src/` was changed.

## Characterized deviations and representation limits

1. `begin_checkout` validates the optional body
   `checkout_method`, then the request handler overwrites it from
   `X-Utekos-Checkout-Method`; a missing or invalid header
   becomes `shopify_checkout`.
2. `remove_from_cart` requires `page_url` and `page_title` only
   when `source === "web"`. This Zod `superRefine` rule is
   recorded as `x-utekos-runtime-constraints` because OpenAPI 3.0
   cannot express it faithfully here.
3. `view_item_list` requires
   `custom_data.total_item_count >= custom_data.items.length`.
   This cross-field rule is also recorded as
   `x-utekos-runtime-constraints`.
4. `204` has two implementation meanings: consent suppression or
   traffic exclusion. Traffic exclusion adds
   `X-Utekos-Traffic-Classification`.
5. Next.js owns automatic `OPTIONS` handling. It is intentionally
   not asserted in `0.1.0` because the verified documentation did
   not establish the exact status/body of the pinned runtime.
6. Microsoft browser UET mappings exist for more events than the
   four registered Microsoft server workers. Server mappings with
   `blocked_no_worker` are documented but are not claimed as
   delivered.
7. Shopify Hydrogen and the GraphQL client own Storefront
   commerce data, not provider event wire formats. The
   Shopify-hosted Customer Events pixel separately emits GA
   purchase from `checkout_completed`; authoritative server
   purchase/refund data originates from Shopify webhook flows.
8. PostHog mappings remain non-implemented or disabled where the
   event catalog says so; parameters are not represented as
   active delivery.

No unmapped event route, missing underlying implementation file,
invalid example, or request-schema mismatch was found.

## ReadyAPI boundary

ReadyAPI Desktop and its command-line runner were not installed,
and the connected SmartBear tools exposed Registry/governance but
not Functional Testing project operations. Therefore the
repository contains a deterministic characterization manifest and
a self-contained OpenAPI import, not an invented ReadyAPI project
XML or an unexecuted ReadyAPI result.

## Verification

- `pnpm contracts:events:test`: 37 passed, 0 failed.
- `pnpm contracts:events:check`: passed.
- Targeted ESLint for `scripts/contracts/*.ts`: passed.
- Full `pnpm typecheck`: passed after normal Next.js type
  generation in the fresh worktree.
- Local `pnpm build`: compilation and TypeScript passed; page-data
  collection stopped at `/produkter/[handle]` because the isolated
  worktree could not fetch Shopify products. Vercel Preview with
  project environment is therefore the authoritative build gate.
- `git diff --check`: passed.
- Swagger raw Domain scan: 0 issues.
- Swagger raw resolved/API scan: 0 issues.
- Swagger Registry scan for `UtekosEventsAPI/0.1.0`: 0 issues.

## Evidence boundary and next steps

The completed chain is source code → generated contracts → local
characterization tests → Swagger governance → persisted
SwaggerHub Domain/API → fetch-back equality. It does not include
ReadyAPI execution, Git commit/push/PR, Vercel Preview,
production deployment, Supabase writes, provider delivery, or
attribution evidence.

Recommended next steps:

1. Import `openapi.resolved.json` into ReadyAPI Desktop and
   translate the manifest into reviewed suites against an
   isolated test store and provider-dispatch sink.
2. Decide whether to delete or clearly deprecate the untouched
   Petstore shell `UtekosEventsAPI/1.0.0`; do not treat its
   0-issue governance scan as semantic validity.
3. Review the `begin_checkout` body/header precedence and either
   document it as intentional or align runtime behavior before
   the next immutable version.
4. Commit the branch, open a PR, and run the normal Git → Preview
   → review → merge flow when release authority is given.
5. Begin Step 2 with the AsyncAPI provider-dispatch contract only
   after this HTTP baseline is reviewed.
