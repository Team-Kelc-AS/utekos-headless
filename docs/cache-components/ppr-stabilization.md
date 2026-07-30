# Cache Components / PPR stabilization

Status: implemented on `main` through PR #81

Reviewed: 2026-07-30 Next.js: 16.2.9

## Decision

PR #74 must not be merged. Its runtime change is already
superseded by the newer PR #81 implementation, which also
preserves the raw Server Action body when a request contains both
postponed state and action data.

The useful operational details from #74 are retained here against
the current code rather than merging its stale branch and
lockfile.

## Current controls

- `cacheComponents` remains enabled.
- `experimental.turbopackFileSystemCacheForBuild` remains
  disabled while the truncated prerender-shell failure family is
  monitored.
- `patches/next@16.2.9.patch` recognizes a gzip body by magic
  bytes, recovers a gzip stream with a truncated trailer when
  possible, and otherwise returns the raw body so Next.js can
  take its existing fallback path.
- For a combined PPR resume + Server Action request, only the
  postponed-state prefix is decompressed. The following
  action-body bytes are preserved.
- The PPR/Flight probe records status, selected non-sensitive
  headers, body byte length and SHA-256 only. It never stores
  response-body excerpts.

The postponed state is opaque application/platform data. It must
be passed through without parsing or modification outside the
narrowly scoped Next.js transport patch.

## Verification

Required local gates:

```bash
pnpm test:ppr-resume-decompress
pnpm test:ppr-rsc-probe
pnpm exec next typegen
pnpm exec tsc --noEmit
pnpm build
```

Runtime gates:

```bash
PPR_RSC_PROBE_BASE_URL=http://localhost:3000 pnpm ppr:rsc:probe
PPR_RSC_PROBE_BASE_URL=https://utekos.no pnpm ppr:rsc:probe
```

On 2026-07-30, production deployment
`dpl_4huDevvMuVCJGMPmKCtTtutSFKmP` at commit `3dbaf09e2` was
`READY`. The production probe generated at
`2026-07-30T14:20:56.378Z` returned 16/16 complete HTTP 200
HTML/Flight observations across `/`, `/produkter`,
`/produkter/comfyrobe` and `/produkter/utekos-techdown`; observed
cache states were `HIT` and `STALE`. A Vercel runtime-error query
scoped to those routes and the previous six hours returned no
errors.

This is a bounded observation, not proof that an intermittent
failure can no longer occur.

## Rollback

Revert the PR #81 patch as one release unit if it creates a
verified regression. Do not re-enable the Turbopack filesystem
build cache or disable Cache Components independently without a
new preview build, PPR probe, browser navigation check and
production rollback plan.

When a future Next.js release contains an equivalent upstream
correction, remove the local patch only after its installed
source, regression tests, preview build and runtime behavior have
been reverified.
