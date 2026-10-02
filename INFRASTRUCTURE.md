# Infrastruktur og backend-grense

Verifisert fra lokal kildekode og Stape/GTM API 02.10.2026.
Produksjonsdeploy, GCP-ruting og komplett naturlig levering er ikke verifisert her.

## Nåværende ansvar

| Komponent | Ansvar |
| --- | --- |
| utekos-headless / Vercel | Next.js storefront, request-/sidekontekst, browser-events, førstepartruter og eksisterende server-integrasjoner |
| Shopify | Commerce og betalingskilde; webhook- og checkout-eiere skal avstemmes før cutover |
| Supabase | Kanonisk event-ledger, atomisk outbox, source evidence og forsøk/resultater |
| Redis | Eksisterende avgrensede runtime-cacher, bl.a. cart snapshots; ikke kanonisk audit |
| Web-GTM | GA4/UET-gren fra dataLayer; appens Meta Pixel har separat eierskap |
| Stape EU / sGTM | Server-GTM og aktiverte Power Ups; Store er en separat NoSQL-funksjon |
| utekos-backend | Ny lokal Shopify orders/paid → Pub/Sub-workergrunnmur, ikke aktiv generell analytics-backend |

## Førstepartsruten skal bevares

`utekos.no/__sgtm/* → /api/tracking/server-gtm/* → https://edge.utekos.no/*`

Gatewayen bevarer relevante request-cookies/context og response Set-Cookie,
fjerner autorisasjon/hop-by-hop-headers og tvinger no-store.
Custom Loader bruker også `load.edge.utekos.no`; Safari-grenen bruker master-cookie
`user_id` og samme origin. Proxyens cookie-/navigasjonsansvar kan derfor ikke
fjernes bare fordi et nytt backend-repo finnes.

## Backend før produksjon

Kilden ligger i søsterrepoet `../utekos-backend`; les dets
[AGENTS](../utekos-backend/AGENTS.md), [README](../utekos-backend/README.md) og
[operations](../utekos-backend/docs/operations.md) ved konkret arbeid.

Det repoets receipt/dedupe-store er prosesslokal utenfor produksjon.
Med `NODE_ENV=production` returnerer paid-order-handleren
`503 worker_unavailable`; `/healthz` beviser bare prosesshelse/sikkerhetsmodus.
Før cutover kreves atomisk holdbar store, verifiserte Shopify/Pub/Sub-attributter,
autentisert push, retry/DLQ/retention/replay og eksplisitt godkjenning.
Provider-dispatch og generell analytics-migrering ligger utenfor første backend-scope.

Mulig senere flytting: rene server-workers og leverandøradaptere etter
kontrakt-/latens-/idempotensaudit. Dette er en kandidat, ikke en vedtatt migrering.
Ikke flytt browser-innsamling, first-party gateway eller autorisasjonskontekst
uten bevist erstatning. Store erstatter ikke automatisk Redis eller Supabase.

Tilgjengelig Codex Cloud-verktøy returnerte ingen miljøer. Denne økten er ikke
flyttet; det sier ingenting om eksistensen av brukerens GCP-ressurser.
Se [FLOW](FLOW.md) og [datert Stape-audit](docs/analytics/stape-powerups-audit-2026-10-02.md).
