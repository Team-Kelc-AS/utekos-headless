# Deterministic PPR / RSC probe (KRI-14)

Status date: 2026-07-28

Issue:
[KRI-14](https://linear.app/utekos/issue/KRI-14/fase-02-etabler-deterministisk-pprrsc-reproduksjon)
Instrumentation: read-only HTTP probe scripts under
`scripts/next/`. No storefront runtime behavior is changed.

## Purpose

Detect truncated HTML shells and truncated RSC/Flight payloads
for the Cache Components / PPR failure family (`Z_BUF_ERROR`,
blank shells, `Connection closed`, empty `text/x-component`
bodies).

## What it tests

Default routes:

- `/`
- `/produkter`
- `/produkter/comfyrobe`
- `/produkter/utekos-techdown`

For each route, in sequence:

1. HTML document request (`Accept: text/html`)
2. Route-level Flight request (`RSC: 1`, `?_rsc=kri14`,
   `Accept: text/x-component`)

The direct Flight request intentionally omits
`Next-Router-State-Tree`, so it checks transport completeness for
the route rather than reproducing one exact browser router state.
Real client navigation remains a separate browser gate.

Each sequence runs at least twice so the initial and repeated
responses can be compared (`x-vercel-cache`, byte length,
completeness). The probe does not clear or control an origin/CDN
cache, so it deliberately does not label either observation as
cold or warm.

## Completeness contract

### HTML

Fails unless all are true:

- document starts as HTML
- `</body>` and `</html>` are present
- body ends with `</html>`
- at least one `self.__next_f.push` bootstrap call exists
- no trailing truncated-stream marker (`-- --`)

### Flight / RSC heuristics for Next.js 16.2.9

Fails unless all are true:

- non-empty body
- `Content-Type` looks like Flight (`text/x-component` /
  compatible)
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
- body SHA-256 and byte length
- redacted headers (`authorization`, `cookie`, `set-cookie`, OIDC
  tokens removed)

Full response bodies, body excerpts, cookies and authorization
headers are never written.

## Reproduction locus (verified 2026-07-30)

| Environment                              | Can reproduce truncated HTML/Flight with this probe?   | Evidence                                                                                                                   |
| ---------------------------------------- | ------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------- |
| Local unit fixtures                      | Yes (deterministic)                                    | `pnpm test:ppr-rsc-probe` — 12/12 pass; truncated fixtures fail, complete fixtures pass                                    |
| Local `next dev` on port 3107            | Complete in this sample                                | All 16 initial/repeated HTML + Flight responses passed on the four default routes                                          |
| Production deployment                    | `dpl_4huDevvMuVCJGMPmKCtTtutSFKmP`, commit `3dbaf09e2` | Vercel reports `READY`, target `production`                                                                                |
| Production HTML + Flight                 | Complete in this sample                                | Probe generated `2026-07-30T14:20:56.378Z`: all 16 responses were HTTP 200 and complete; cache states were `HIT` / `STALE` |
| Vercel runtime errors on the four routes | None in the scoped six-hour query                      | Checked `/`, `/produkter`, `/produkter/utekos-techdown`, `/produkter/comfyrobe` after PR #81                               |

Conclusion for KRI-14:

- The probe is deterministic and fail-closed on its
  version-specific truncation heuristics.
- This sample does not reproduce the former truncation family
  after PR #81; intermittent failures can still require Vercel
  runtime-log correlation.
- Use probe timestamps + `x-vercel-id` to correlate a failing
  request window with runtime logs before changing build-cache
  settings (KRI-15).

## Correlation recipe

1. Run the probe and keep `generatedAt`, per-request
   `startedAt`/`endedAt`, and artifact `x-vercel-id`.
2. In Vercel runtime logs, filter the same ISO window and/or
   request id.
3. Search for `Z_BUF_ERROR`, `unexpected end of file`,
   `invalid response from cache`, `Connection closed`,
   `Failed to handle`.
4. Compare the initial and repeated rows in
   `initialRepeatComparison`; use the response cache headers to
   describe cache state rather than inferring it from request
   order.

## Non-goals

- Does not mutate app code, GTM, Shopify, or Supabase.
- Does not disable `cacheComponents`.
- Does not clear or change Vercel build cache (that belongs to
  later Fase 0 issues after this probe is verified).
