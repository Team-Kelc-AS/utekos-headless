# CanonicalEvent Decision Log

**Format:** append-only

**Regel:** eksisterende beslutningstekst omskrives ikke. Feil
eller endring får ny oppføring som refererer den gamle.

## Statusverdier

- `PROPOSED`
- `APPROVED`
- `REJECTED`
- `SUPERSEDED_BY_<ID>`
- `INCIDENT_CONTAINMENT`

## DEC-001 — Én canonical pipeline og én generisk provider-outbox

- **Dato:** 2026-07-20
- **Status:** `APPROVED_BASELINE`
- **Berører:** INV-001, INV-005, INV-006, INV-007, INV-017
- **Beslutning:** Behold og fullfør eksisterende canonical
  ledger/outbox og generisk providerregistry. Nye events skal
  ikke få egne stores, queues eller crons uten providerkrav.
- **Alternativer vurdert:** per-event/per-provider pipelines;
  direkte providersend i route handler; ekstern queue i stedet
  for Postgres outbox.
- **Begrunnelse:** atomisk persistence, idempotent retry, felles
  operasjonell modell, mindre duplisering og enklere
  event/providerutvidelse.
- **Konsekvens:** streng eventCatalog, typed mapping,
  transaksjonsgrense, migrations og observability er sentrale.
- **Detalj:** ADR-0001.

## DEC-002 — Governance control plane med eksplisitt endringskontroll

- **Dato:** 2026-07-20
- **Status:** `PROPOSED_FOR_OWNER_APPROVAL`
- **Berører:** INV-020, INV-021, INV-022
- **Beslutning:** Charter, roadmap, decision log, machine state
  og handoff får forskjellige roller. Charteret endres kun etter
  change request.
- **Begrunnelse:** `PLAN.md` og `FLOW.md` er verdifulle, men
  blander historikk, mål og volatile produksjonsfakta. Et
  komprimert kontekstvindu må kunne rekonstruere oppdraget uten
  chat.
- **Konsekvens:** alle analyticsoppgaver får governance header og
  sluttrapport; roadmap oppdateres kun etter godkjent resultat.
- **Detalj:** ADR-0002.

## DEC-003 — Cron-only som første dispatch-isolasjonsmodus

- **Dato:** 2026-07-20
- **Status:** `APPROVED_FOR_PHASE_1`
- **Berører:** INV-007, INV-008, INV-018
- **Beslutning:** Fjern global registry-drain fra browser/webhook
  request path. Eksisterende cron eier dispatch under
  stabilisering.
- **Alternativ:** targeted immediate dispatch av attempt-ID-ene
  opprettet i transaksjonen.
- **Begrunnelse:** minste reversible endring uten
  schema-/storeendring; eksisterende femminutters cron er
  verifisert. Targeted mode vurderes bare dersom målt latency/SLO
  krever det.
- **Konsekvens:** requesten gjør kun validate + atomic accept.
  Queue capacity og event-to-provider latency må
  produksjonsmåles.
- **Detalj:** ADR-0003.

## DEC-004 — Cursor er defense-in-depth, ikke eneste kontrollplan

- **Dato:** 2026-07-20
- **Status:** `PROPOSED_FOR_OWNER_APPROVAL`
- **Berører:** INV-020, INV-022
- **Beslutning:** `.cursor/rules` auto-attacher styringskontekst
  og `.cursor/agents` tilbyr smale roller. Root `AGENTS.md` og
  committede docs er alltid fallback.
- **Begrunnelse:** regler/subagents forbedrer kontekststyring,
  men funksjon og tilgjengelighet kan variere mellom
  Cursor-versjoner, modus og miljø.
- **Konsekvens:** alle subagentprompts kan kjøres manuelt;
  manglende Task-tool er aldri tillatelse til å hoppe over gates.
- **Detalj:** ADR-0002 og `cursor-operating-model.md`.

## DEC-005 — Én write-agent per aktiv mikrooppgave

- **Dato:** 2026-07-20
- **Status:** `PROPOSED_FOR_OWNER_APPROVAL`
- **Berører:** INV-022
- **Beslutning:** Read-only research kan parallelliseres; bare én
  agent kan endre den aktive taskens branch/worktree og tillatte
  filer.
- **Begrunnelse:** parallelle skrivere skaper skjult scope drift,
  konflikter og vanskelig evidens/review.
- **Konsekvens:** implementer, verifier og release auditor er
  separate roller.

## DEC-006 — Meta purchase replay er fail-closed

- **Dato:** 2026-07-20
- **Status:** `INCIDENT_CONTAINMENT`
- **Berører:** INV-003, INV-013, INV-015, INV-019
- **Funn:** kjent backfill bruker nye event-ID-er for
  eksisterende purchases.
- **Beslutning:** Ingen merge/execution/provider write før
  replaykontrakten bevarer original/deterministisk event identity
  og bounded dry-run er bevist.
- **Konsekvens:** SAFE-001 gjelder uavhengig av
  roadmaprekkefølge.

## DEC-007 — Shopify webhookroute er ikke lik produksjonsowner

- **Dato:** 2026-07-20
- **Status:** `APPROVED_EVIDENCE_CLASSIFICATION`
- **Berører:** INV-002, INV-019
- **Funn:** inspected app-tokenets app har ingen webhook
  subscriptions, mens purchase finnes via browserroute/backfill.
- **Beslutning:** `purchase`/`refund` beskrives ikke som
  webhook-eid før source, subscription og delivery er bevist
  eller alternativ owner vedtas.
- **Konsekvens:** SAFE-002 og fase 2.

## DEC-008 — CE-1.4C7 allowlist includes optional specialized-handler deps

- **Dato:** 2026-07-21
- **Status:** `APPROVED`
- **Berører:** INV-007, INV-008, INV-021, INV-022; task CE-1.4C7
- **Tidligere beslutning, hvis relevant:** CE-1.4B made shared
  factory `runBatch?`/`scheduleAfter?` optional; CE-1.4C1–C4 left
  specialized handler dependency fields required while runtime
  became collect-only.
- **Nytt funn og primærevidens:** Route-only CE-1.4C7 cannot
  typecheck while specialized handler types still require
  `runBatch`/`scheduleAfter`.
- **Beslutning:** Expand CE-1.4C7 allowlist to the four
  specialized handlers solely to mark those fields optional.
  Runtime remains collect-only. Shared factory, generator, tests,
  docs and providers stay out of scope. Owner direction
  2026-07-21: proceed with the correct unblock.
- **Alternativer:** separate microtask for handler types; keep
  dead required fields and block CE-1.4C7; cast in routes.
- **Begrunnelse:** matches factory pattern; enables the
  documented collect-only route call without behavioral change.
- **Konsekvens for roadmap/DoD:** CE-1.4C7 may complete; CE-1.4E
  still waits on CE-1.4C + CE-1.4C7 + CE-1.4D acceptance.
- **Godkjent av:** Prosjekteier (explicit
  proceed-with-correct-fix).

## DEC-010 — Authoritative Purchase and Refund owners

- **Dato:** 2026-07-21
- **Status:** `APPROVED` (owner-model portion amended by DEC-011
  then DEC-012 / CE-2.2B — DEC-012 ACCEPTED 2026-07-21)
- **Berører:** INV-001, INV-002, INV-003, INV-010, INV-014,
  INV-015, INV-017, INV-020, INV-021; SAFE-001, SAFE-002,
  DEV-018; `STOP_ACTIVE_DOUBLE_COUNT_RISK`
- **Tidligere beslutning, hvis relevant:** DEC-006 (Meta purchase
  replay fail-closed); DEC-007 (webhookroute ≠ produksjonsowner);
  CE-2.1 ACCEPTED (`MULTIPLE_SOURCES` / `NO_SOURCE` /
  `STOP_ACTIVE_DOUBLE_COUNT_RISK`); CE-GOV-001A ACCEPTED (ADR
  `0006` / DEC-010-nummerering).
- **Nytt funn og primærevidens:** CE-2.1 inventory —
  shop-specific subscriptions = 0; live `orders-paid` HTTP;
  ledger purchase fra webhook/server/ops_backfill; tre
  `transaction_id`-overlapp med distinct `event_id`; refund = 0.
- **Beslutning:**
  - purchase: `APP_SPECIFIC_WEBHOOK_PLUS_RECONCILIATION`
  - refund: `APP_SPECIFIC_WEBHOOK_PLUS_RECONCILIATION`
  - ADR-konklusjon: `APPROVED_WITH_PRECONDITIONS`
  - Detaljer:
    `docs/analytics/adr/0006-purchase-refund-authoritative-owners.md`
- **Alternativer:** `SHOP_SPECIFIC_WEBHOOK_PLUS_RECONCILIATION`
  (avvist — 0 shop-specific, live app-path);
  `RECONCILIATION_ONLY` (avvist som eneste owner);
  `TEMPORARY_COMPATIBILITY_SOURCE_WITH_CUTOVER` (avvist som varig
  owner — aktiv double-count-vektor).
- **Begrunnelse:** målarkitektur krever verified Shopify
  delivery; live trafikk peker på app-specific path;
  reconciliation dekker missede deliveries; server/ops_backfill
  som konkurrerende owners må fryses til CE-2.6-kontrakt.
- **Konsekvens for roadmap/DoD:** CE-2.3A er neste; forblir
  fail-closed til released `shopify.app.toml` / app-identitet og
  eksplisitt Shopify mutation-godkjenning finnes.
  `STOP_ACTIVE_DOUBLE_COUNT_RISK` forblir interlock til purchase
  cutover + replay containment.
- **Godkjent av:** Prosjekteier (ACCEPTED 2026-07-21).

## DEC-011 — Amend DEC-010: shop-specific webhook owner for custom Admin app

- **Dato:** 2026-07-21
- **Status:** `SUPERSEDED_BY_DEC-012` (CE-2.2B)
- **Berører:** INV-002, INV-019, INV-021; SAFE-002; CE-2.2A;
  CE-2.3A Mode B; DEC-010
- **Tidligere beslutning, hvis relevant:** DEC-010 ACCEPTED
  valgte `APP_SPECIFIC_WEBHOOK_PLUS_RECONCILIATION` for
  purchase/refund.
- **Nytt funn og primærevidens:** Eier bekreftet produksjonsappen
  **Utekos Storefront** som custom app opprettet i Shopify Admin
  for shop `erling-7921.myshopify.com`. Slike apper kan ikke
  bruke `shopify.app.toml` / `shopify app deploy` for webhook-
  abonnementer. CE-2.3A Mode A stoppet korrekt med
  `STOP_WRONG_APP_OR_SHOP` fordi toml mangler.
- **Beslutning:**
  - purchase: `SHOP_SPECIFIC_WEBHOOK_PLUS_RECONCILIATION`
  - refund: `SHOP_SPECIFIC_WEBHOOK_PLUS_RECONCILIATION`
  - ADR-0006 amended accordingly; ADR-konklusjon forblir
    `APPROVED_WITH_PRECONDITIONS`
  - CE-2.3A Mode A: `NOT_APPLICABLE`
  - CE-2.3A Mode B: GraphQL Admin API `webhookSubscriptionCreate`
    / `webhookSubscriptionUpdate`
  - Påkrevd read-only identitet før mutation:
    `app.title = Utekos Storefront` og
    `shop.myshopifyDomain = erling-7921.myshopify.com`
  - Eksplisitt eiergodkjenning kreves før enhver Shopify-mutasjon
  - Uendret: canonical semantics, deterministic event IDs,
    reconciliation, browser/server cutover, provider ownership,
    replay interlocks
- **Alternativer:** beholde app-specific/toml (avvist — ikke
  mulig for custom Admin-app); reconciliation-only (uendret
  avvist).
- **Begrunnelse:** implementeringsmodellen må matche faktisk
  produksjonsapp-klasse; shop-specific Admin GraphQL er den
  støttede subscription-mekanismen.
- **Konsekvens for roadmap/DoD:** etter ACCEPTED av DEC-011 /
  CE-2.2A kan CE-2.3A gjenopptas i Mode B uten automatisk
  mutation. Mode A forblir `NOT_APPLICABLE`.
- **Godkjent av:** _pending owner ACCEPTED_

## DEC-012 — Shopify Admin notification webhooks own Purchase and Refund

- **Dato:** 2026-07-21
- **Status:** `APPROVED`
- **Berører:** INV-002, INV-019, INV-021; SAFE-002; CE-2.2B;
  CE-2.3A; DEC-010; DEC-011; `STOP_ACTIVE_DOUBLE_COUNT_RISK`;
  `STOP_REFUND_2026_04_PAYLOAD_INCOMPATIBLE`
- **Tidligere beslutning, hvis relevant:** DEC-010
  (app-specific); DEC-011 (shop-specific GraphQL subscriptions —
  `SUPERSEDED_BY_DEC-012`).
- **Nytt funn og primærevidens:**
  - Live Admin notification webhooks (owner-created): Order
    payment →
    `https://utekos.no/api/shopify/webhooks/orders-paid`; Refund
    create →
    `https://utekos.no/api/shopify/webhooks/refunds-create`; both
    JSON, Webhook API `2026-04`, same shop-level signing secret →
    `SHOPIFY_WEBHOOK_SECRET`.
  - Notification webhooks returneres ikke av
    `webhookSubscriptions`; tom GraphQL-liste ≠ «ingen webhook».
  - CE-2.3A evidence
    `docs/analytics/evidence/ce-2.3a-notification-webhook-post-mutation-verification.md`
    (verifier APPROVE): technical conclusion
    `SUBSCRIPTIONS_ESTABLISHED_WITH_PAYLOAD_BLOCKER`.
  - `orders-paid` live and ledger-proven; `refunds-create`
    subscription live but canonical accept blocked by Zod vs
    2026-04 (`subtotal` number; `currency` null).
- **Beslutning:**
  - purchase:
    `SHOP_ADMIN_NOTIFICATION_WEBHOOK_PLUS_RECONCILIATION`
  - refund: `SHOP_ADMIN_NOTIFICATION_WEBHOOK_PLUS_RECONCILIATION`
  - ADR-0006 amended; konklusjon `APPROVED` (DEC-012 ACCEPTED)
  - `webhookSubscriptionCreate` / `Update`, `shopify.app.toml`,
    and `shopify app deploy` do **not** own these subscriptions
  - GraphQL create for these topics: **FORBIDDEN**
  - Mode A toml/deploy: `NOT_APPLICABLE`
  - Mode B GraphQL create: `FORBIDDEN`
  - `SHOPIFY_WEBHOOK_SECRET` remains the shop notification
    secret; app API secret must not replace it
  - Utekos Storefront Admin token: identity + reconciliation +
    future Admin API ops — does **not** represent notification
    webhooks
  - CE-2.3A governance status:
    `VERIFIED_AWAITING_GOVERNANCE_ACCEPTANCE`
  - Keep active: `STOP_ACTIVE_DOUBLE_COUNT_RISK`
  - Add active: `STOP_REFUND_2026_04_PAYLOAD_INCOMPATIBLE`
  - Unchanged: deterministic event IDs, reconciliation,
    browser/server cutover, provider ownership, replay
    interlocks; no runtime/schema change in CE-2.2B
- **Alternativer:** GraphQL shop-specific create (avvist —
  duplikatrisiko / feil surface); app-specific toml (avvist).
- **Begrunnelse:** owner-modellen må beskrive den faktiske
  management surface, HMAC-hemmeligheten og CE-2.3A-verifiserte
  destinations i produksjon.
- **Konsekvens for roadmap/DoD:** CE-2.2B / DEC-012 ACCEPTED;
  CE-2.3A governance ACCEPTED with
  `SUBSCRIPTIONS_ESTABLISHED_WITH_PAYLOAD_BLOCKER`. Refund
  schema-fiks og CE-2.3B krever separate startordrer. Aktive
  blockers: `STOP_ACTIVE_DOUBLE_COUNT_RISK`,
  `STOP_REFUND_2026_04_PAYLOAD_INCOMPATIBLE`.
- **Godkjent av:** Prosjekteier (ACCEPTED 2026-07-21; commit
  `b445e9f8c`; verifier APPROVE).

## Status — CE-2.3A-F1 ACCEPTED (mekanisk registrering)

- **Dato:** 2026-07-21
- **Status:** `ACCEPTED` (ingen ny beslutning; ingen omtolkning)
- **Berører:** CE-2.3A-F1;
  `STOP_REFUND_2026_04_PAYLOAD_INCOMPATIBLE`;
  `STOP_ACTIVE_DOUBLE_COUNT_RISK`
- **Registrert eksakt:**

```text
CE-2.3A-F1: ACCEPTED
Conclusion: REFUND_2026_04_COMPATIBILITY_FIXED
Accepted runtime SHA: 59c130c2e
STOP_REFUND_2026_04_PAYLOAD_INCOMPATIBLE: CLOSED
STOP_ACTIVE_DOUBLE_COUNT_RISK: fortsatt ACTIVE
```

- **Full runtime SHA:**
  `59c130c2ee9c93c3f62332fa03763d27e5168b05`
- **Konsekvens:** CE-2.3B er neste autoriserte task. Expected
  parent for CE-2.3B er denne statuscommitens fulle SHA.
- **Godkjent av:** Prosjekteier (eiergodkjent F1; mekanisk
  statusregistrering)

## Status — CE-2.3B ACCEPTED (mekanisk registrering)

- **Dato:** 2026-07-21
- **Status:** `ACCEPTED` (ingen ny beslutning; ingen omtolkning)
- **Berører:** CE-2.3B; CE-2.3C; `STOP_ACTIVE_DOUBLE_COUNT_RISK`
- **Registrert eksakt:**

```text
CE-2.3B: ACCEPTED
Conclusion: READY_FOR_CE_2_3C
Evidence commit: 3071e57320b084800764f4529f225233abf354df
Verifier: APPROVE
STOP_ACTIVE_DOUBLE_COUNT_RISK: fortsatt ACTIVE
```

- **Evidence:**
  `docs/analytics/evidence/ce-2.3b-shopify-commerce-reconciliation-design.md`
- **Konsekvens:** CE-2.3C er autorisert. Expected parent for
  CE-2.3C er denne statuscommitens fulle SHA. CE-2.3C følger
  exact allowlist i CE-2.3B-evidence; ingen `vercel.json`; ingen
  produksjonskjøring uten separat gate.
- **Godkjent av:** Prosjekteier (eiergodkjent CE-2.3B; mekanisk
  statusregistrering)

## Status — CE-2.3C ACCEPTED (mekanisk registrering)

- **Dato:** 2026-07-21
- **Status:** `ACCEPTED` (ingen ny beslutning; ingen omtolkning)
- **Berører:** CE-2.3C; CE-2.4; CE-2.5;
  `STOP_ACTIVE_DOUBLE_COUNT_RISK`
- **Registrert eksakt:**

```text
CE-2.3C: ACCEPTED
Conclusion: SHOPIFY_COMMERCE_RECONCILIATION_IMPLEMENTED
Accepted runtime SHA: fde892700b9090a9db9b42ff19d3655444c7b60e
Fresh verifier: APPROVE

STOP_ACTIVE_DOUBLE_COUNT_RISK: ACTIVE
Vercel cron schedule: DISABLED
Initial 24h production run: NOT AUTHORIZED
Push/deploy: NOT AUTHORIZED
```

- **Release-baseline:** Repository-wide TypeScript/typecheck og
  build er blokkert av en urelatert signal-contract-baseline
  utenfor CE-2.3C-allowlisten. Dette blokkerer release readiness,
  men ikke CE-2.3C-aksepten.
- **Konsekvens:** Neste autoriserte runtimepakke er samlet
  `CE-2.4/CE-2.5 — Shopify Purchase and Refund ownership cutover`.
  Den kan bare starte etter avklart signal-contract-writer i
  samme worktree eller i en separat clean worktree fra
  governance-akseptcommitten. En separat provider-/Purchase-P0-
  incident må ha ikke-overlappende allowlist og kan ikke opprette
  canonical events, generere event-ID-er, resend accepted Meta-
  kjøp, kjøre bred provider-backfill eller endre CE-2.3C-filene.
- **Godkjent av:** Prosjekteier (eiergodkjent CE-2.3C; fresh
  verifier `APPROVE`; mekanisk statusregistrering)

## Status — P0 inactive / signal ownership retained

- **Dato:** 2026-07-21
- **Status:** `APPROVED` (owner clarification; no runtime change)
- **Berører:** CE-2.4; CE-2.5; INV-021; INV-022;
  `STOP_CONCURRENT_RUNTIME_OWNERSHIP`
- **Registrert eksakt:**

```text
P0 provider/Purchase incident: INACTIVE
Active P0 writer: NONE
Owned paths: NONE
Allowlist overlap with CE-2.4/2.5: NONE
```

- **Signal-contract ownership:** Hele den aktive signal-contract-
  pakken forblir hos nåværende writer. `eventCatalog.ts` og
  `eventCatalog.test.ts` overføres ikke separat.
- **Ferdigstillingsgate:** Signal-writeren skal fryse eksakt
  allowlist, fullføre bare den, kjøre relevante tester,
  TypeScript, ESLint, Prettier og `git diff --check`, committe,
  få fresh verifier og stoppe annen skriving. Rapporten skal
  inneholde full commit-SHA, parent-SHA, eksakte filer, tester,
  verifierdom og gjenværende dirty filer utenfor commiten.
- **Konsekvens:** Den urørte CE-2.4/CE-2.5-worktree-en fra
  `da10ac2f851cbdd330367c2647e747e3de7c7358` er fjernet.
  `STOP_CONCURRENT_RUNTIME_OWNERSHIP` forblir `ACTIVE` til
  signal-contract-commiten er verifisert og eierakseptert.
  Deretter opprettes en ny clean worktree fra den nye
  autoritative SHA-en og CE-2.4/CE-2.5 fortsetter uten ny
  designrunde.
- **Urelaterte dokumenter:** Dirty `program-charter.md` og
  `roadmap.md` håndteres separat; de kopieres ikke til runtime-
  worktree-en og blokkerer ikke senere runtimearbeid.
- **Godkjent av:** Prosjekteier

## Status — Signal-contract integration ACCEPTED (mekanisk registrering)

- **Dato:** 2026-07-21
- **Status:** `ACCEPTED` (ingen ny beslutning; ingen omtolkning)
- **Berører:** CE-3.2B1; CE-3.2B2; bounded CE-3.2C
  (`generate_lead`); CE-2.4; CE-2.5;
  `STOP_CONCURRENT_RUNTIME_OWNERSHIP`
- **Registrert eksakt:**

```text
Signal-contract integration: ACCEPTED
Accepted runtime SHA: 85b552a95d063e227232861bb226658ec653d960
Fresh verifier: APPROVE

STOP_CONCURRENT_RUNTIME_OWNERSHIP: CLOSED
STOP_ACTIVE_DOUBLE_COUNT_RISK: ACTIVE
```

- **Release readiness:**
  `RELEASE_READINESS_PENDING_CLEAN_BASELINE_CHECK`.
  Repository-wide TypeScript/build klassifiseres ikke som feil i
  signal-contract-allowlisten før den er reprodusert fra clean
  worktree.
- **Konsekvens:** CE-2.4/CE-2.5 startes i en ny clean worktree
  fra denne governance-akseptcommitten. Den parkerte grenen/
  worktree-en fra `da10ac2f851cbdd330367c2647e747e3de7c7358`
  skal ikke gjenbrukes.
- **Godkjent av:** Prosjekteier (eiergodkjent signal-contract;
  fresh verifier `APPROVE`; mekanisk statusregistrering)

## Status — Meta click-ID compatibility ACCEPTED (mekanisk registrering)

- **Dato:** 2026-07-21
- **Status:** `ACCEPTED` (ingen ny beslutning; ingen omtolkning)
- **Berører:** CE-2.4; CE-2.5; `STOP_ACTIVE_DOUBLE_COUNT_RISK`
- **Registrert eksakt:**

```text
META_CLICK_ID_COMPATIBILITY_FIXED: ACCEPTED
Accepted runtime SHA: 3b9937f87f3d40cfcdeda82a0f60f462302260b7
```

- **Konsekvens:** Clean-baseline/type-forutsetningen er lukket.
  CE-2.4/CE-2.5 starter likevel ikke; DEC-013 og DEC-014 er
  separate prerequisite-oppgaver.
- **Godkjent av:** Prosjekteier (mekanisk statusregistrering)

## DEC-013 — Provider-neutral commerce source evidence

- **Dato:** 2026-07-21
- **Status:** `APPROVED`
- **Berører:** CE-2.4P1; CE-2.4; CE-2.5; INV-001, INV-002,
  INV-003, INV-006, INV-008, INV-012, INV-016, INV-017, INV-019,
  INV-021, INV-022
- **Tidligere beslutning, hvis relevant:** DEC-012 etablerte
  Shopify Admin notification webhook + reconciliation som owner.
- **Nytt funn og primærevidens:** CE-2.4 krever varig korrelasjon
  av Shopify delivery ID, event ID, source method, API-versjon og
  tidsstempler. Dagens webhookhandlere kasserer disse headerne
  etter HMAC-verifikasjon.
- **Beslutning:** Autoriser CE-2.4P1 som separat prerequisite for
  en provider-nøytral og eventuavhengig source-evidence-kontrakt.
  Den skal gjenbruke eksisterende ledger/outbox-transaksjon og må
  ikke bli ny canonical store, queue eller provideridentitet.
  Lokal migration/store/schema/header extraction/reconciliation-
  metadata og målrettede tester er tillatt etter frosset eksakt
  no-glob allowlist.
- **Alternativer:** canonical/provider-ID fra delivery-ID
  (avvist); log-only evidence (avvist); rå payload/headerdump
  (avvist); eventspesifikk store/queue (avvist).
- **Begrunnelse:** Offisiell Shopify-kontrakt skiller individuell
  delivery-ID fra merchant-action event-ID. Begge er
  korrelasjonsbevis, ikke canonical identitet.
- **Konsekvens for roadmap/DoD:** CE-2.4P1 er neste autoriserte
  runtimeoppgave. CE-2.4 forblir stoppet til P1 har fresh
  verifier og eieraksept. Produksjonsmigration, remote Supabase-
  mutation, push/deploy, providerendring, reconciliation-kall og
  backfill er ikke autorisert.
- **Godkjent av:** Prosjekteier

## DEC-014 — Legitimate itemless Shopify refunds

- **Dato:** 2026-07-21
- **Status:** `APPROVED`
- **Berører:** CE-3.3R; CE-2.5; INV-001, INV-003, INV-005,
  INV-010, INV-012, INV-015, INV-019, INV-021, INV-022
- **Tidligere beslutning, hvis relevant:** DEC-012 etablerte
  opprettet Shopify Refund som den autoritative semantiske
  hendelsen.
- **Nytt funn og primærevidens:** Shopify supports valid refunds
  without refund line items, including shipping or adjustments.
  The current canonical and webhook schemas require at least one
  item and would reject those records.
- **Beslutning:** Autoriser CE-3.3R som en separat commerce
  item/value-remediering. En legitim refund kan inneholde
  `items: []`; items forblir en eksplisitt array og fabrikeres
  aldri. Identitet, event time, valuta og totalverdi bevares,
  mens ugyldig beløp, valuta eller identitet fortsatt feiler
  lukket. Aktive provider-mappere må akseptere det legitime
  tilfellet uten items.
- **Alternativer:** fabrikere placeholder-item (avvist); avvise
  gyldige itemless refunds (avvist); omdefinere refund som
  settlement (avvist).
- **Begrunnelse:** Shopify permits itemless refund cases, Google
  Analytics makes refund items optional, and Google Data Manager
  requires a non-empty list only when cart data is supplied.
- **Konsekvens for roadmap/DoD:** CE-3.3R er sekvensert etter
  CE-2.4 release approval og Purchase production proof. CE-2.5
  forblir stoppet til CE-3.3R har fresh verifier og eieraksept.
  Ingen produksjonsmutasjon, push/deploy eller refund-
  produksjonstest er autorisert.
- **Godkjent av:** Prosjekteier

## Status — CE-2.4/CE-2.5 sequence split (mekanisk registrering)

- **Dato:** 2026-07-21
- **Status:** `APPROVED`
- **Berører:** CE-2.4P1; CE-2.4; CE-3.3R; CE-2.5; INV-022;
  `STOP_ACTIVE_DOUBLE_COUNT_RISK`
- **Registrert eksakt:**

```text
docs-only stop commit
→ CE-2.4P1 source evidence
→ fresh verifier + owner acceptance
→ CE-2.4 Purchase cutover
→ release approval + production proof
→ CE-3.3R itemless refund remediation
→ fresh verifier + owner acceptance
→ CE-2.5 Refund cutover
```

- **Parallellitet:** CE-3.3R kan bare utvikles parallelt med
  CE-2.4P1 når en eksplisitt overlap-gate beviser null felles
  filer og hver oppgave har egen writer/worktree.
- **Fortsatt forbudt:** production schema apply, push/deploy,
  reconciliation schedule eller første 24-timersløp,
  backfill/replay, provider mutation og lukking av
  `STOP_ACTIVE_DOUBLE_COUNT_RISK`.
- **Godkjent av:** Prosjekteier

## DEC-015 — Meta PageView Event Enhancement via first-party cookies (not Firestore/Sheets)

- **Dato:** 2026-07-22
- **Status:** `APPROVED`
- **Berører:** CE-5.2D; INV-001; INV-002; Meta Parameter Builder;
  `page_view` accept path; DEV-021
- **Tidligere beslutning, hvis relevant:** DEC-001 canonical
  pipeline; ADR-0004 request-context boundaries
- **Nytt funn og primærevidens:** Live 7d ledger showed marketing
  `page_view` with `fbclid` and `has_fbp=0` (265 rows; landing
  race). Meta guidance requires server-side `fbclid` read from the
  document URL query string, first-party `_fbp`/`_fbc`, and Event
  Enhancement via cookies — not a parallel warehouse.
- **Beslutning:** Implement Event Enhancement
  (hendelsesberikelse) for Meta click/browser IDs only through:
  (1) CanonicalEvent accept-path ParamBuilder
  (`ensureCanonicalMetaBrowserIds`),
  (2) first-party `_fbp`/`_fbc` cookies on the page-view response,
  (3) existing durable click-id session store,
  (4) Supabase ledger/outbox as truth. **Reject** Firestore and
  Google Sheets / Google Regneark as Meta identity or click-id
  enrichment stores for this stream.
- **Alternativer:** Firestore user profile store; Google Sheets
  offline enhancement; sGTM-only Meta identity (rejected — Meta
  CAPI owned by cron outbox).
- **Begrunnelse:** Parallel stores violate INV-001 single pipeline
  and add freshness/consistency risk for RealTime PageView match
  keys (`event_id` + `external_id` + `fbp`).
- **Konsekvens for roadmap/DoD:** CE-5.2D may ship server ensure +
  cookie `Set-Cookie`. GTG/sGTM remain Google delivery/collection.
  Production deploy requires owner merge/PR approval. No
  Firestore/Sheets dependency.
- **Godkjent av:** Prosjekteier (startordre 2026-07-22 PageView
  fbp/fbc + «gå videre» for PR)

## DEC-016 — Providerspesifikk finalitet har tre uavhengige akser

- **Dato:** 2026-07-31
- **Status:** `APPROVED`
- **Berører:** KRI-23; DEV-004; `ops.provider_dispatch_attempts`;
  Google Data Manager; Meta CAPI; Microsoft UET CAPI
- **Tidligere beslutning, hvis relevant:** DEC-001 beholder én
  generisk provider-outbox. Denne beslutningen presiserer
  evidenssemantikken uten å endre den runtimearkitekturen.
- **Nytt funn og primærevidens:** Generisk adaptersuksess lagres
  som `accepted_unverified`. Google har en autoritativ
  request-statusbane som skiller `SUCCESS`, `PROCESSING`,
  `FAILED` og `PARTIAL_SUCCESS`. Meta returnerer
  `events_received`/trace, og Microsoft returnerer HTTP-status,
  men ingen av dem har en autoritativ per-attempt reconciliation
  i repositoryet. Read-only produksjonsspor 2026-07-31
  bekreftet alle tre mønstrene.
- **Beslutning:** Hver statusrapport skal oppgi tre separate
  akser: (1) lokal attemptstatus, (2) providerlevering og (3)
  attribusjon/dedupe. `accepted_unverified` er lokalt avsluttet
  adaptersend, men ikke providerbekreftet terminal levering.
  Bare Google `SUCCESS` gjennom eksisterende reconciliation kan
  kalles providerbekreftet terminal prosessering. Meta og
  Microsoft forblir `accepted_unverified` uten en fremtidig,
  autoritativ providerbane. Ingen leveringsstatus gir i seg selv
  dedupe- eller attribusjonsbevis.
- **Alternativer:** behandle alle 2xx/kvitteringer som
  `succeeded` (avvist); behandle Meta/Microsoft-dashboards som
  radfinalitet (avvist på grunn av aggregert/annen grain); endre
  schema og historiske rader i samme oppgave (avvist som
  migrasjons- og replayrisiko).
- **Begrunnelse:** API-aksept, providerprosessering og kommersiell
  effekt er forskjellige fakta med forskjellig autoritet og
  tidsforsinkelse. Sammenblanding gir falsk trygghet i
  provider-health, budsignaler og kapitalallokering.
- **Konsekvens for roadmap/DoD:** Operatører bruker
  `provider-finality-runbook.md`. Current schema beholdes i
  KRI-23; et separat issue skal designe append-only
  providerleverings- og attribusjon/dedupe-observasjoner,
  historisk kompatibilitet, RLS, retention og rollout. Ingen
  schemaendring, statuspromotering, providerwrite, replay eller
  deploy er autorisert av denne beslutningen.
- **Godkjent av:** Prosjekteier gjennom KRI-23-oppdraget

## Mal for ny beslutning

```text
## DEC-NNN — Tittel

- Dato:
- Status:
- Berører:
- Tidligere beslutning, hvis relevant:
- Nytt funn og primærevidens:
- Beslutning:
- Alternativer:
- Begrunnelse:
- Konsekvens for roadmap/DoD:
- Godkjent av:
```
