# Deterministic PPR / RSC probe (KRI-14)

Status date: 2026-07-28  
Issue: [KRI-14](https://linear.app/utekos/issue/KRI-14/fase-02-etabler-deterministisk-pprrsc-reproduksjon)  
Instrumentation: read-only HTTP probe scripts under `scripts/next/`. No storefront runtime behavior is changed.

## Purpose

Detect truncated HTML shells and truncated RSC/Flight payloads for the Cache Components / PPR failure family (`Z_BUF_ERROR`, blank shells, `Connection closed`, empty `text/x-component` bodies).

## What it tests

Default routes:

- `/`
- `/produkter`
- `/produkter/comfyrobe`
- `/produkter/utekos-techdown`

For each route, in sequence:

1. HTML document request (`Accept: text/html`)
2. Client-nav style Flight request (`RSC: 1`, `?_rsc=kri14`, `Accept: text/x-component`)

Each sequence runs twice so cold vs warm cache can be compared (`x-vercel-cache`, byte length, completeness).

## Completeness contract

### HTML

Fails unless all are true:

- document starts as HTML
- `</body>` and `</html>` are present
- body ends with `</html>`
- at least one `self.__next_f.push` bootstrap call exists
- no trailing truncated-stream marker (`-- --`)

### Flight / RSC

Fails unless all are true:

- non-empty body
- `Content-Type` looks like Flight (`text/x-component` / compatible)
- at least one Flight row (`^[0-9a-f]+:`)
- payload ends with a newline
- last non-empty line is a Flight row

Empty `200 text/x-component` bodies are an explicit failure.

## Commands

Unit tests (no network):

```bash
pnpm test:ppr-rsc-probe
```

Against a reachable origin:

```bash
PPR_RSC_PROBE_BASE_URL=http://127.0.0.1:3000 pnpm ppr:rsc:probe
PPR_RSC_PROBE_BASE_URL=https://utekos.no \
  PPR_RSC_PROBE_OUT=output/ppr-rsc-probe-production.json \
  pnpm ppr:rsc:probe
```

Artifacts written via `PPR_RSC_PROBE_OUT` store only:

- status / timing / selected headers
- completeness reasons and metrics
- body SHA-256 + short head/tail
- redacted headers (`authorization`, `cookie`, `set-cookie`, OIDC tokens removed)

Full response bodies and secrets are never written.

## Reproduction locus (verified 2026-07-28)

| Environment | Can reproduce truncated HTML/Flight with this probe? | Evidence |
| --- | --- | --- |
| Local unit fixtures | Yes (deterministic) | `pnpm test:ppr-rsc-probe` — 11/11 pass; truncated fixtures fail, complete fixtures pass |
| Local `next start` | Supported target; run after `pnpm build && pnpm start` | Use `PPR_RSC_PROBE_BASE_URL=http://127.0.0.1:3000` |
| Production hard-load HTML | Not on this sample window (complete) | Probe run `2026-07-28T15:17:50.089Z` → `15:17:59.688Z`: all four HTML routes complete, `x-vercel-cache: HIT` |
| Production Flight (`RSC: 1` + `?_rsc=`) | Not on this sample window (complete) when **not** sending `Next-Router-Prefetch` | Same window: non-empty `text/x-component` Flight for all four routes |
| Production Flight with `Next-Router-Prefetch: 1` | Empty `text/x-component` body observed outside default probe | Documented variant; default probe omits prefetch header to request full Flight |
| Vercel runtime logs | Yes — intermittent, not every hard-load | Probe window had **no** matching `Z_BUF_ERROR` lines (aligned with probe pass). Last 24h still shows `Z_BUF_ERROR` on `/produkter/utekos-techdown` (28), `/produkter/utekos-dun` (11), `/skreddersy-varmen` (9), `/produkter/utekos-mikrofiber` (3) |

Conclusion for KRI-14:

- The probe is deterministic and fail-closed on truncated payloads.
- Intermittent production failures remain primarily visible in **Vercel runtime logs**, not as a permanent truncated shell on every hard-load.
- Use probe timestamps + `x-vercel-id` to correlate a failing request window with runtime logs before changing build-cache settings (KRI-15).

## Correlation recipe

1. Run the probe and keep `generatedAt`, per-request `startedAt`/`endedAt`, and artifact `x-vercel-id`.
2. In Vercel runtime logs, filter the same ISO window and/or request id.
3. Search for `Z_BUF_ERROR`, `unexpected end of file`, `invalid response from cache`, `Connection closed`, `Failed to handle`.
4. Compare cold vs warm rows in `coldWarmComparison`.

## Non-goals

- Does not mutate app code, GTM, Shopify, or Supabase.
- Does not disable `cacheComponents`.
- Does not clear or change Vercel build cache (that belongs to later Fase 0 issues after this probe is verified).
