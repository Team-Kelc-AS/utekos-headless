# PROJECT UTEKOS MAIN TEAM FILE

## Strategic baseline

Paramount purpose: achieve absolute brand growth for Utekos.

Primary objective: establish strong mental availability by mapping
category entry points, building mental structures, deploying
wide-reaching media, and enforcing evidence-based marketing across
operations.

Revenue goal: NOK 100,000,000 yearly sales by 2031-12-31. Current
baseline used for planning: NOK 2,000,000.

Core stack:

- Domain registrar: one.com
- Deployment and hosting: Vercel
- Frontend: Next.js 16.2 / React 19.2
- Commerce: Shopify headless
- Consent: Cookiebot CMP by Usercentrics
- Tag management: Google Tag Manager web + server-side GTM
- Web and product analytics: Google Analytics + PostHog
- Structured content: Sanity
- Canonical tracking warehouse: Supabase
- Cloud infrastructure: Google Cloud Platform

Paid media allocation:

- Meta Ads: 70%
- Google Ads: 20%
- Microsoft Ads: 10%

Any active paid-media platform must be treated as a first-class
commercial system. If Meta, Google, or Microsoft is used, it must
receive equal dedication in diagnostics, auth, smoke tests, provider
status, documentation, and operational follow-up. Half-configured
tracking or diagnostics are not acceptable.

## Learned User Preferences

- For remediation from `FLOW.md`, follow the prioritized task order,
  execute one item at a time, get approval before each item, and keep
  verification gates intact.
- When API names overlap or deprecations are involved, verify against
  current official documentation before recommending implementation
  paths.
- Treat the current Chatbase bot as legacy; plan a new AI customer
  assistant instead of extending Chatbase.
- Workflow SDK v5 and Vercel Marketplace Shopify Integration require
  explicit user approval before install or shop connection.

## Learned Workspace Facts

- The repository's local Node baseline is exactly `24.17.0`, declared by
  `.nvmrc` and `.node-version`; Docker defaults must stay aligned to the same
  patch release. `package.json` intentionally uses `24.x` because Vercel
  selects Node by major version.
- Before running Node or pnpm commands, activate the repository runtime with
  `source "$HOME/.nvm/nvm.sh" && nvm use --silent`. A bootstrap shell may report
  a system Node version; do not report a repository mismatch until `.nvmrc`
  has been activated. Use Corepack for the pinned pnpm version.
- `FLOW.md` is the canonical prioritized map for tracking,
  observability, analytics, gap remediation, and MCP status.
- Google Merchant work must use Merchant API, not the deprecated
  Google Content API for Shopping.
- Microsoft Shopping Content API is distinct from Google's deprecated
  Content API naming and remains part of the current Microsoft MCP
  probe surface.
- Google Merchant Center is verified through `merchant:preflight` with
  the primary API product source and an autofeed source visible.
- The Microsoft commerce-tracking MCP surface has been verified green
  for Ads, Shopping, UET, and Clarity probes after the latest
  remediation.
- `@google/genai` should keep `allowBuilds: false` in
  `pnpm-workspace.yaml`; the npm package ships prebuilt `dist/` and
  does not need its prepare script at install.
- `mapi-devdocs` MCP is the official Merchant API documentation
  surface; it does not return live Merchant Center account data.
- LangChain/LangSmith is under evaluation for agent tracing and
  evaluation; it is not an active project dependency yet.
- Microsoft Ads API OAuth must use a Microsoft Entra identity; a
  Google-linked Microsoft Advertising login for the same email causes
  `IdentityTypeMismatch (Code 126)` on API calls.

Follow these steps for each interaction:

1. User Identification:
   - You should assume that you are interacting with default_user
   - If you have not identified default_user, proactively try to do so.

2. Memory Retrieval:
   - Always begin your chat by saying only "Remembering..." and retrieve all relevant information from your knowledge graph
   - Always refer to your knowledge graph as your "memory"

3. Memory
   - While conversing with the user, be attentive to any new information that falls into these categories:
     a) Basic Identity (age, gender, location, job title, education level, etc.)
     b) Behaviors (interests, habits, etc.)
     c) Preferences (communication style, preferred language, etc.)
     d) Goals (goals, targets, aspirations, etc.)
     e) Relationships (personal and professional relationships up to 3 degrees of separation)

4. Memory Update:
   - If any new information was gathered during the interaction, update your memory as follows:
     a) Create entities for recurring organizations, people, and significant events
     b) Connect them to the current entities using relations
     c) Store facts about them as observations


## Nødvendig atferd

## 1. Metakognitiv Systemtenkning (Context-First Execution)

Se deg selv og koden din fra et objektivt tredjepersonsperspektiv
og forstå at ingen oppgave eksisterer i et vakuum. Før du
genererer en eneste linje med kode, må du danne deg en komplett
oversikt over det store bildet. Analyser hvordan din spesifikke
løsning vil påvirke hele systemarkitekturen, ytelsen og
forretningslogikken. Ved mangel på overordnet kontekst for å ta
en trygg beslutning, må din refleks være å stoppe opp og
etterspørre den. Du handler aldri i blinde.

## 2. Selvkalibrerende Presisjon

Du har en ekstrem bevissthet om egne grenser. Når du
identifiserer et potensielt kunnskapshull eller en usikkerhet i
komplekse integrasjoner, tetter du dette umiddelbart og proaktivt
ved å bruke dokumentasjon som din absolutt eneste kilde til
sannhet (Single Source of Truth). Du gjetter aldri på API-er
eller syntaks; du kalibrerer deg selv mot fasiten før du leverer,
noe som sikrer en urokkelig, feilfri standard hver gang.

## 3. WORLD CLASS EXCELLENCE

Hver funksjon, kompontent, fil eller mer omfattende løsning -
frontend, backend og webdesign - skal kunne betraktes som
`WORLD CLASS EXCELLENCE`. Dette kravet til ekstrem ytelse betyr
et kompromissløst fokus på:

- **Arkitektur:** Streng semantikk, HTML-maksimering og absolutt
  overholdelse av DRY-prinsippet (Don't Repeat Yourself).
- **Ytelse:** Minimalisering av DOM-henvendelser, optimaliserte
  renders og lynrask kodeutførelse.

## 4. Absolutt Universell Utforming

Når du foreslår eller koder UI/UX-komponenter, trumfer
tilgjengelighet alltid estetikk og visuelle trender. Løsningene
dine skal alltid oppfylle minimum WCAG 2.2 Level AA. Du skal
eksplisitt ivareta kontrast, lesbarhet for fargeblinde, støtte
for skjermlesere, og sikre at ingen kritisk informasjon
utelukkende formidles via farge.

---

## Operating Contract

This file is the authoritative operating contract for all agents
working in this repository. Read this file first, then `PLAN.md`,
`DEPLOYMENT.md`,
`.codex/docs/main-documentation/agents.txt`,
`.codex/docs/main-documentation/sitemap.xml`,
`.codex/docs/main-documentation/README.md`,
`.codex/docs/main-documentation/llms.txt`,
and the relevant local documentation before changing code or
giving architectural recommendations.

The files under `.codex/docs/main-documentation/` are portable
repository snapshots of the Utekos documentation entry points. Use
them to locate the relevant subject area, then verify volatile API and
framework behavior against current official documentation. Never
depend on an operator-specific absolute filesystem path in local,
worktree, CI, or Codex Cloud environments.

Every user-facing response must include `Dokumentasjonsstatus:`
and explicitly say whether the current work has enough updated
documentation and runtime context to proceed. If the answer is
no, stop, identify the missing source, and fetch or request it
before implementation.

### `Zero-Assumption Protocol`

See [`.codex/rules/`](.codex/rules/).

- Do not assume current APIs, framework behavior, provider
  requirements, tracking semantics, or deployment state.
- Final delivery must list verification performed and any blocked
  verification. Uverified UI, tracking, provider, deployment, or
  data-flow changes are not acceptable deliverables.
- If a required folder or path is missing, tell the user and do not
  continue until it is found or restored. Check whether ignore rules
  hide the path before concluding that the source is unavailable.

Code and architecture rules:

- Never use `useMemo` or `useCallback`; React Compiler is
  enabled.
- Prefer domain-oriented files and one function/component per
  file when touching related code.
- Keep code clean and self-explanatory. Do not add internal
  narration comments unless they prevent real misunderstanding.
- Validate all external data, tool inputs, route inputs, and
  agent schemas with Zod or an existing stricter local contract.
- Do not hand-edit generated MCP files such as `mcp.json`,
  `.vscode/mcp.json`, or `.cursor/mcp.json`.

Verification gates:

- Any change that touches a Shopify API request path or a user action whose
  resulting state can reach Shopify is incomplete until the affected flow has
  been verified on `https://utekos.no` after the exact commit is `READY` and
  owns the production aliases. This includes StorefrontGateway authentication
  and headers; product, collection and search queries; variant selectors on
  product cards, Quick View and product pages; Cart and CartDrawer; AddToCart,
  quantity, removal, clear, discounts and attributes; CheckoutButton and
  Klarna Express; customer-account actions; newsletter and waitlist forms; and
  any Storefront or Admin API action exposed through the storefront. This gate
  has no test-, build-, preview-, urgency-, or documentation-only exception.
  Inventory every active render placement and every distinct handler,
  server-action, route and transport chain. Production verification must prove
  every distinct chain and inspect every active placement for correct wiring;
  representative placements are sufficient only when they share the same
  verified handler and payload contract. For commerce, prove the real AddToCart
  mutation and authoritative cart response, CartDrawer contents/subtotal and
  quantity/removal, CheckoutButton resolution without completing an order, and
  Klarna Express preparation up to but not through payment authorization.
  Verify variant selection changes the exact variant later sent to Shopify.
  Check browser console/network plus Vercel runtime logs, remove every test cart
  line afterward, and record the exact commit and deployment. Never create a
  real payment or order as a smoke test. If a customer, consent, subscription
  or other persistent provider mutation cannot be tested safely, report that
  exact chain as `production unverified`; passing tests, a successful build,
  HTTP 200 or Vercel `READY` are never sufficient proof.
- UI work requires browser/runtime verification: console,
  network, DOM/snapshot, screenshot, responsive viewport, and
  contrast/WCAG when visual or brand-critical.
- Tracking work requires real provider-oriented verification
  paths: consent state, dataLayer/browser event, server
  ledger/queue, provider response, and external dashboard/API
  status where credentials permit.
- Next.js, React, Vercel AI SDK, OpenAI, Shopify, Supabase,
  analytics, consent, and ad-platform changes require current
  local or official documentation.
- Production deploy, GTM publish, provider-resource
  mutation, ad campaign creation, Shopify catalog mutation, and
  Supabase schema mutation require explicit user confirmation and
  must not be hidden behind a default agent profile.
- Before any production deploy, schema mutation, env change, GTM
  publish, tracking change, provider change, or operational tooling
  release, read and follow [DEPLOYMENT.md](DEPLOYMENT.md). The
  deployment checklist is the canonical release-order gate.

Brand and business-critical posture:

- Utekos brand elements, tracking fidelity, product data, consent
  handling, and paid-media events are business-critical surfaces.
- Prefer fail-closed behavior, never silent degradation when
  legal, tracking, revenue, or brand correctness is uncertain.
- Distinctive brand assets, colors, type, tone of voice, and
  category entry points must be checked against project sources
  before implementation.

### Telemetry and paid-media operating baseline

Status date: 2026-07-15.

The storefront tracking implementation was deliberately reset on
2026-07-15. The active app contract is now limited to direct Cookiebot,
default-denied Consent Mode v2, `/__gtg` for the Google Tag Manager
loader and `/__sgtm` for Google server-side tagging. GTM may load before
consent for Advanced Consent Mode cookieless pings. Meta, Microsoft,
Clarity and other non-Google tags remain consent-gated in GTM.

The previous browser tracking hub, PostHog client, first-party event
ingestion, Supabase ledger/provider queue runtime, provider adapters,
tracking webhooks and tracking crons have been removed. The historical
details below describe the desired/recoverable architecture, not an
active storefront data flow. Do not report those surfaces as active or
healthy until they are intentionally reintroduced and production-
verified.

### Root layout and consent ownership

- Never hardcode `<head>` in `src/app/layout.tsx`; use the Next.js
  Metadata API and documented script components.
- Web-GTM tag `126` is the sole owner of the Cookiebot loader and its
  Consent Initialization defaults. The app must not also load `uc.js`
  or inject a separate `consent-mode-defaults` script. Do not remove
  tag `126` while GTM owns this responsibility.
- Any consent-loader change must prove exactly one `uc.js` request,
  exactly one GTM-generated Cookiebot script with `implementation=gtm`,
  and default-denied Consent Mode before user choice.

- Supabase is the canonical tracking, audit, and provider-status
  warehouse. PostHog is product analytics, not the canonical
  financial or provider-audit ledger.
- `marketing.event_ledger` records accepted tracking events.
  `ops.provider_dispatch_attempts` is the provider queue/audit table.
  Current provider ids are `meta`, `google`, and `microsoft_uet`.
- Provider dispatch statuses include `skipped_unqualified`.
  Missing Google `client_id` is a qualified skip with
  `skip_reason='missing_client_id'`, not an active dead-letter
  failure.
- Provider dispatch modes are `server_retry`, `server_direct`, and
  `client_observed`. The retry claimant owns `meta`, `google`, and
  `microsoft_uet` rows with `dispatch_mode='server_retry'`.
  `replay-dead-letter` re-queues unresolved `ops.dead_letter_events`
  for those providers.
- Microsoft UET CAPI purchase requires the **UET tag ApiToken**
  documented for Conversions API auth (`tagID` + token,
  `Authorization: Bearer <ApiToken>`). Project env aliases:
  `MICROSOFT_UET_CAPI_ACCESS_TOKEN`, `MICROSOFT_UET_CAPI_TOKEN`, etc.
  This is **not** `MICROSOFT_ADS_ACCESS_TOKEN` (OAuth Ads API). See
  [DEPLOYMENT.md](DEPLOYMENT.md) Microsoft env gate and
  [Microsoft Conversions API guide](https://learn.microsoft.com/en-us/advertising/guides/uet-conversion-api-integration?view=bingads-13).
- Dead-letter counts are only useful when resolved/unresolved state,
  provider/source, reason, and replay policy are visible. Use
  `ops.dead_letter_summary` and provider-specific context before
  treating row counts as action signals.
- PostHog must remain consent-gated through Cookiebot. Current
  practice is explicit product events, manual pageviews,
  `autocapture: false`, and optional session replay only with strict
  input/text/network masking.
- PostHog events must not contain user PII, query-string secrets,
  free-text customer content, or provider payloads. Use the safe
  helper in `src/lib/tracking/posthog/` for commerce events.
- Microsoft/Bing is a full ad platform, not only a UET endpoint.
  Microsoft readiness requires OAuth/MFA with `msads.manage`,
  developer token, CustomerId, AccountId, refresh-token handling,
  Ads API, Ad Insight, Shopping Content/Merchant Center, UET CAPI,
  and Clarity consent/linkage checks.
- Clarity belongs to the statistics/analytics consent surface and
  must be checked with Consent API V2 storage flags
  `ad_Storage` and `analytics_Storage` when advertising linkage is
  evaluated.
- Meta diagnostics must keep read-only analysis separate from any
  write-capable Ads tooling. Campaign, budget, audience, creative,
  dataset, GTM publish, provider write, and production deployment
  actions require separate explicit approval.
- Google Ads native conversion tags remain excluded until
  double-counting risk against GA4-imported conversions is resolved.

### Telemetry verification gates

- Required local gates after telemetry/platform changes:
  `npm run mcp:build`, `npm run mcp:doctor`, targeted unit tests,
  `pnpm exec next typegen`, `pnpm exec tsc --noEmit`, `pnpm build`, and
  `npm run tracking:gateway:smoke`. Supabase lint is required only when
  schema files are touched. The removed commerce-tracking doctor is not
  a gate until that diagnostic surface is reintroduced.
- Deployment and migration order is not optional. Use
  [DEPLOYMENT.md](DEPLOYMENT.md) to classify changed files, decide
  what must be migrated/configured/deployed, and record blocked
  verification.
- Commerce browser smoke must prove consent state, Google
  `dataLayer`, Meta Pixel/CAPI evidence, Microsoft UET browser
  network or queue evidence, Microsoft UET CAPI purchase status,
  Clarity Consent API V2 behavior, PostHog masking/init evidence,
  and Supabase rows.
- Microsoft must not be marked OK until read-only probes prove OAuth
  readiness, account access, campaign status, UET endpoint health,
  Shopping Content status, and Clarity advertising readiness, or
  return a deliberate fail-closed reason.
- Supabase production mutation remains blocked without explicit
  confirmation. For schema repair, do not run blind diff/drop. First
  inspect migration history, sync intentionally, preserve
  `campaign_insights` and `integration_job_leases`, then lint.

flowchart TD start[Oppgave om main-documentation] -->
agents[agents.txt] agents --> specialized{Spesialisert domene?}
specialized -->|Next.js| nextjs[official-docs/llms.txt]
specialized -->|Google| google[google/agents.txt] specialized
specialized -->|Consent| cb[docs/Cookiebot + cookiebotConfig.ts] specialized -->|Motion|
motion[25-motion/agents.txt] specialized -->|Nei / usikker|
llms[llms.txt] nextjs --> companion[*.llm.md] google -->
companion cb --> companion motion --> companion llms -->
companion

### Required env for core storefront E2E

- `SHOPIFY_STORE_DOMAIN`
- `SHOPIFY_STOREFRONT_ACCESS_TOKEN`

These are pre-provisioned in the Cloud Agent environment. Pull
additional secrets with `vercel env pull .env.local` if the
project is linked.

### Production build caveat

`npm run build` fails without `SHOPIFY_ADMIN_API_TOKEN` because
cron routes import `src/lib/shopify/admin.ts` at module load. Dev
mode (`npm run dev`) works with Storefront credentials only.

### Lint and tests

- Lint: `npm run lint` (ESLint; repo has pre-existing violations)
- No Jest/Playwright test suite in-repo; smoke-test via browser
  against `/`, `/produkter`, and `/produkter/[handle]`

### Optional local database

```bash
npm run db:start   # Supabase local stack
npm run db:reset   # apply migrations
```

### Cloud Run sGTM env (production)

The app exposes Cloud Run through `/__sgtm/:path*`; the GTM loader is
exposed through `/__gtg/:path*`. Minimum:

- `NEXT_PUBLIC_GOOGLE_GTM_ID=GTM-5TWMJQFP`
- `gtm-preview` and `gtm-server` are recreated in Google Cloud
  project `project-c683eb2c-20ae-4ec2-ac3`, region
  `europe-west1`.
- The new direct Cloud Run `gtm-server` URL is verified:
  `https://gtm-server-rojbi5yl5q-ew.a.run.app`.
- `cloud.server.utekos.no` has the required Cloud Run DNS target:
  `cloud.server.utekos.no CNAME ghs.googlehosted.com`.
- New domain mapping exists in `project-c683eb2c-20ae-4ec2-ac3`
  and routes to `gtm-server`.
- As of 2026-06-19 22:00 UTC, Cloud Run domain mapping is ready:
  `Ready=True`, `CertificateProvisioned=True`,
  `DomainRoutable=True`.
- Production endpoints are verified on `cloud.server.utekos.no`:
  `/healthy`, `uc-consent-signals.js`, `gtm.js?id=GTM-5TWMJQFP`,
  `ns.html?id=GTM-5TWMJQFP`, and `gtag/js?id=GT-MKRLF5WK` return
  HTTP 200.
- Every `/__sgtm` response must be `no-store` and must never return
  `x-vercel-cache: HIT`.
- The published loader must retain
  `server_container_url=https://utekos.no/__sgtm`.
- No GTM publish is implied by an app release; it requires separate
  explicit approval.

Operational note: the old project `nifty-structure-490519-u6`
returned Google Frontend 500/503 because billing was disabled. Do
not re-enable or link billing in that old project unless the user
explicitly asks for that cost-bearing provider mutation.

### Tracking warehouse (Supabase)

- **End-to-end flyt:** [FLOW.md](FLOW.md) — innsamling, leveranse, bruk, gap-register og MCP-status.
- **Kanonisk tracking-lager:** `hkoawfbomhnzupcsdggb`
  (`supabase-pink-lens`, eu-north-1). Appen kobler via
  `SUPABASE_VERCEL_POSTGRES_URL_NON_POOLING`.
- **Legacy/atlas-prosjekt:** `ycqwilkchurgsldeimdi` skal ikke
  brukes for tracking-lageret. Eldre `POSTGRES_*`-variabler peker
  fortsatt dit og er kun fallback.
- **MCP:** Bruk prosjekt-scoped `user-supabase` (bundet til
  `hkoawfbomhnzupcsdggb`). `plugin-supabase-supabase` er
  org-scoped til Utekos Atlas og gir permission-denied mot
  pink-lens.
- **Skjema:** `marketing`, `ops`, `partner`, `analytics`. These remain
  available for historical audit and future rebuilding, but the reset
  storefront does not currently write to them. Ledger:
  `marketing.event_ledger`. Kø: `ops.provider_dispatch_attempts`.
  Meta quality: `marketing.meta_quality_snapshots` via
  `/api/cron/meta-dataset-quality`. Meta ad-delivery metrics use the
  separate `/api/cron/meta-ad-delivery-insights` route and
  `marketing.meta_ad_delivery_insights`; neither route proves provider
  attribution finality.
- **Provider-audit:** `ops.provider_dispatch_health` and
  `ops.dead_letter_summary` are the current read models for provider
  row counts, skipped rows, and unresolved dead letters.
- **Iceberg:** `analytics_bucket_fdw` over `analytics-bucket` med
  vault-creds. Kald lagring: `analytics.event_ledger_archive` +
  `archive_event_ledger_batch` (pg_cron).
- **Server GA4:** Direkte Measurement Protocol-runtime er fjernet.
  sGTM eier fortsatt consent-gated Google-trafikk via `/__sgtm`.
- **PostHog:** Storefront-integrasjonen er fjernet i resetten og er et
  åpent gap til den eventuelt innføres på nytt med consent-gate.

### Local MCP and secrets

MCP servers are generated from committed templates — not
hand-edited in `mcp.json` or `.vscode/settings.json`.

```bash
cp .env.mcp.example .env.mcp.local   # first-time setup
npm run mcp:build                    # writes mcp.json + .vscode/mcp.json
npm run mcp:doctor                   # validate env + credential files
```

See [docs/local-secrets.md](docs/local-secrets.md) for the full
layering (`.env.local` vs `.env.mcp.local` vs
`src/api/lib/cloud-credentials/`).

Current MCP expectations:

- `config/mcp/servers.base.json` is the committed source for local
  MCP server templates. Generated `mcp.json`, `.vscode/mcp.json`,
  and `.cursor/mcp.json` must not be hand-edited.
- `google-ads-mcp` belongs in MCP templates/config with env
  placeholders, never inline secrets.
- `meta-ads-read-only` is the default Meta diagnostic surface.
  Write-capable Meta tools require explicit approval for the concrete
  action.
- The Commerce/Tracking MCP surface is read-only diagnostics. The
  current doctor expects 28 canonical tools and covers Shopify,
  Merchant Center, Google Ads, GTM/sGTM, Meta Dataset Quality,
  Microsoft UET, Microsoft Ads, Microsoft Shopping Content,
  Microsoft Clarity, PostHog, Sentry, Vercel, consent, and tracking
  contracts.
- `.env.mcp.example` must contain placeholders only. Real credentials
  belong in ignored local env files or approved secret stores. If a
  token-like value has been exposed in chat, docs, generated config,
  or tracked files, remove it locally and rotate it at the provider.

## Google Cloud Platform

Read and follow the
[Utekos Well-Architected Framework](.agent/utekos-well-architechted-framework.md)
and use the Google Developer documentation MCP for current provider
documentation before changing Google Cloud integrations.


## Google Analytics

Measurement Protocol is legacy and must not be introduced or repaired in this
repository. All Google Analytics server-to-server event integrations must use
the Data Manager API. Remove remaining Measurement Protocol credentials and
external senders rather than treating them as a fallback transport.
