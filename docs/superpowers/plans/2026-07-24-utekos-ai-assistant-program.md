# Utekos AI Assistant Program Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deliver the approved first-party Utekos shopping assistant as three independently reviewable, testable releases.

**Architecture:** The program starts with a safe first-party Next.js assistant using live Shopify truth and deterministic fallbacks. It then adds GCP grounded knowledge and commerce recommendations, and finally adds privacy-preserving quality storage, canonical measurement, evaluation, and controlled rollout.

**Tech Stack:** Next.js 16.2.9, React 19.2.7, TypeScript 6.0.3, Node 24, pnpm 11.17, AI SDK 6.0.194, AI SDK React 4.0.40, Zod 4.4.3, Shopify Storefront API, Google Discovery Engine 2.9.0, Google Retail 4.4.0, Vercel OIDC, Supabase Postgres 17, Playwright 1.61.

## Global Constraints

- Stay on `main`; preserve all pre-existing user changes.
- Use the repository's React Compiler configuration; do not add `useMemo` or `useCallback`.
- Treat Shopify as the response-time source of truth for product, price, variant, and availability.
- Do not expose Shopify Admin, Supabase service-role, GCP, or Vercel credentials to browser code.
- Do not persist full chat transcripts or send conversation text to GA4, PostHog, GTM, advertising platforms, URLs, or application logs.
- Do not implement authenticated order lookup, order changes, claims, refunds, payment handling, or automatic customer-service messages.
- Keep the assistant usable without advertising consent; all measurement remains consent-gated by the existing canonical contract.
- Use short-lived Vercel OIDC/Google workload identity; do not add a service-account key.
- Do not cache personalized recommendations between visitors.
- Keep production exposure at zero until evaluation, privacy, cost, rollback, and explicit approval gates pass.
- Require explicit target-specific approval before any production deployment, GCP mutation, Supabase schema mutation, Shopify mutation, Vercel environment change, GTM publish, or paid usage outside confirmed credit coverage.
- Before implementing an API call, re-check the linked official documentation and the installed package types; stop if current official documentation is unavailable.

---

## Delivery order

| Release | Plan | Independently testable outcome |
| --- | --- | --- |
| 1 | [Core assistant](./2026-07-24-utekos-ai-assistant-core.md) | Accessible internal-preview assistant with live Shopify truth, deterministic buying help, safe support fallbacks, and contact handoff |
| 2 | [GCP knowledge and recommendations](./2026-07-24-utekos-ai-assistant-gcp.md) | Dedicated grounded Utekos knowledge adapter, catalog reconciliation, and catalog-based recommendation adapter behind gates |
| 3 | [Measurement, privacy, and rollout](./2026-07-24-utekos-ai-assistant-measurement-rollout.md) | Approved minimal warehouse schema, redaction, canonical events, evaluation harness, cost/health reporting, and reversible exposure |

The releases are sequential. Release 1 must pass before Release 2 starts. Release 2 must pass before Release 3 starts. Each task ends in a focused commit and reviewer gate.

## Design traceability

| Approved design area | Implemented by |
| --- | --- |
| Accessible launcher, guided conversation, product cards, sources, feedback, and handoff | Core Tasks 3, 4, 6, 7 |
| Live Shopify price/variant/availability truth | Core Task 2 and GCP Task 7 revalidation |
| Bounded request, same-origin guard, safe stream, provider fallbacks | Core Tasks 1, 4, 5 |
| Dedicated reviewed support corpus and grounded answers | GCP Tasks 2–4 |
| Commerce catalog reconciliation and non-personalized Similar Items | GCP Tasks 5–7 |
| Short-lived GCP authentication and no browser credentials | GCP Task 1 |
| Minimal 180-day structured outcomes and gated 30-day redacted gaps | Measurement Tasks 1–2 |
| Eight no-text canonical events and holdout assignment | Measurement Tasks 3–4 |
| Daily-rotating HMAC rate limit with no raw IP retention | Measurement Task 5 |
| Norwegian quality, safety, availability, accessibility, and latency gates | Measurement Task 6 |
| Cost/health reporting, daily reconciliation, staged exposure, and rollback | Measurement Task 7 |

Self-review found no approved design requirement without an owning task. Personalized recommendations, authenticated order support, GTM publishing, and production mutation remain explicit non-goals or separately approved follow-on actions.

## Program acceptance gate

Run all commands from `/Users/kristofferohnstadhjelmeland/utekos-headless`:

```bash
pnpm exec tsx --test \
  src/lib/customer-assistant/*.test.ts \
  src/lib/customer-assistant/server/*.test.ts \
  src/lib/google/customer-assistant/*.test.ts \
  src/lib/analytics/assistant*.test.ts
pnpm exec playwright test --config=playwright.assistant.config.ts
pnpm lint
pnpm build
```

Expected:

- all targeted tests pass;
- the assistant Playwright suite passes for desktop, mobile, keyboard, and fallback cases;
- lint exits 0;
- the production build exits 0 without an environment-variable or type error;
- no real GCP, Supabase, Shopify, Vercel, or GTM mutation occurs during the gate.

## Documentation sources

- Approved design: `docs/superpowers/specs/2026-07-24-utekos-ai-shopping-assistant-design.md`
- Project contracts: `AGENTS.md`, `PLAN.md`, `DEPLOYMENT.md`, `FLOW.md`, `COMMERCIAL_INTELLIGENCE_PLAN.md`
- Next.js 16.2 Route Handlers and streaming: `https://nextjs.org/docs/app/getting-started/route-handlers`
- AI SDK UI streaming: `https://ai-sdk.dev/docs/reference/ai-sdk-ui/create-ui-message-stream-response`
- AI SDK React `useChat`: `https://ai-sdk.dev/docs/reference/ai-sdk-ui/use-chat`
- Google Discovery Engine Node client: `https://docs.cloud.google.com/nodejs/docs/reference/discoveryengine/latest`
- Google Retail Node client: `https://docs.cloud.google.com/nodejs/docs/reference/retail/latest/overview`
- AI Commerce Search catalog: `https://docs.cloud.google.com/retail/docs/upload-catalog`
- AI Commerce Search recommendations: `https://docs.cloud.google.com/retail/docs/predict`
- AI Commerce Search user events: `https://docs.cloud.google.com/retail/docs/record-events`
- Shopify Storefront API: `https://shopify.dev/docs/api/storefront/latest`
- Datatilsynet, personvernprinsippene: `https://www.datatilsynet.no/rettigheter-og-plikter/personvernprinsippene/`
- Datatilsynet, analyse og sporing: `https://www.datatilsynet.no/personvern-pa-ulike-omrader/internett-og-apper/rad-for-analyse-og-sporing-pa-nettsted/`
- GDPR Article 5: `https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32016R0679`
