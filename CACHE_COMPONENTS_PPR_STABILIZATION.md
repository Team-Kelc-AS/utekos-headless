# Cache Components / PPR stabilization (KRI-12 / Fase 0)

Status date: 2026-07-28  
Branch: `cursor/stabilize-cache-components-ppr-6020`  
Scope: stabilize production PPR/RSC failures before TanStack Query refactoring. No QueryClient, hydration, PDP ownership, or cache-layer refactor in this phase.

## Baseline (locked)

| Source | Evidence |
| --- | --- |
| Production runtime errors (7d) | Top cluster: `Error: unexpected end of file` / `Z_BUF_ERROR` (~155) on `/`, `/produkter`, PDP handles, `/skreddersy-varmen` |
| Related clusters | `Failed to handle <route> Error: unexpected end of file`, `Z_DATA_ERROR` (`invalid literal/length code`, `invalid distance too far back`), `invalid response from cache …: 503`, browser `Connection closed` |
| Current production deploy | `dpl_7yPRTqU24qoGF8rT6TEPvqP2Mm3M` (`753694fc`, turbopack) |
| Live hard-load shells (2026-07-28, Vercel-authenticated fetch) | `/` 200, `</html>` present, 45 `self.__next_f.push`; `/produkter` 59 pushes; `/produkter/comfyrobe` 30 pushes; all `x-vercel-cache: HIT` |
| Local Next patch already on main | `patches/next@16.2.9.patch` from `829d4672` / `a44e1fcc` — decompress gzip PPR resume bodies before parse |
| Config risk | `cacheComponents: true` + previously `experimental.turbopackFileSystemCacheForBuild: true` |

## Failure modes

### A. Truncated / corrupt compressed PPR resume body

Symptoms: server `Z_BUF_ERROR` / `Z_DATA_ERROR`, often wrapped as `Failed to handle <route>`.

Root cause (documented):

1. Upstream Next 16.2.9 reads PPR resume POST bodies with `body.toString('utf8')` without handling infrastructure gzip (see [vercel/next.js#95238](https://github.com/vercel/next.js/pull/95238), still open as of this writing).
2. Local patch correctly gunzips when gzip magic `1f 8b` is present.
3. Production evidence after the patch shows zlib still throwing on **truncated/corrupt** gzip streams. Uncaught `gunzipSync` bypassed Next’s existing `parsePostponedState` degrade-to-dynamic path and surfaced as hard request failures.

Controlled workaround in this phase:

- Harden `decompressBody` with try/catch. On zlib failure, return the raw body so `parsePostponedState` can fail closed into dynamic render instead of crashing the handler.
- Keep magic-byte gating from `a44e1fcc` so non-gzip server-action bodies are not destroyed when a `Content-Encoding` header is present.

### B. Truncated prerendered HTML shell (build-cache hypothesis)

Symptoms: blank page, browser `Connection closed`, shell missing `self.__next_f` / `</html>`, often served `x-vercel-cache: HIT`.

Root cause (documented upstream): restored Turbopack build caches under `experimental.turbopackFileSystemCacheForBuild: true` have been correlated with truncated PPR shells while `next build` still reports success ([vercel/next.js#94371](https://github.com/vercel/next.js/issues/94371), [vercel/next.js#86511](https://github.com/vercel/next.js/issues/86511)).

Controlled workaround in this phase:

- Set `experimental.turbopackFileSystemCacheForBuild: false` in `next.config.mts`.
- Prefer clean prerenders on deploy. If a truncated shell is ever observed again, redeploy with Vercel build cache cleared (not a re-promote of a corrupt artifact).

### C. `invalid response from cache`

Intermittent RSC cache 503 responses remain residual risk on the Vercel data cache path. Not fixed by app code in this phase; monitor after A+B land.

## Cache Components boundary decision

| Keep | Rationale |
| --- | --- |
| `cacheComponents: true` | Preserved per project architecture. Failures are transport/build-integrity, not a proof that Cache Components must be disabled. |
| Local Next 16.2.9 patch | Upstream #95238 not released into 16.2.9; patch remains required. |
| Public product/catalog ownership in RSC | Unchanged; TanStack refactor explicitly out of scope. |

| Change | Rationale |
| --- | --- |
| Disable turbopack FS cache for build | Controlled workaround for truncated-shell class until upstream is fixed/verified. |
| Fail-soft decompress | Prevent truncated gzip from escaping into uncaught handler errors. |

Disabling `cacheComponents` entirely is the heavy escape hatch and is **not** taken in this phase.

## Verification

Local gates:

```bash
node --test scripts/next/ppr-resume-decompress.test.mjs
pnpm exec next typegen
pnpm exec tsc --noEmit
pnpm build
```

Shell integrity (against a reachable origin; production hard-fetch may require Vercel share / MCP auth because of BotID):

```bash
PPR_SHELL_BASE_URL=https://<preview-or-shareable-origin> node scripts/next/verify-ppr-shell-integrity.mjs
```

Hard-load + client navigation must be re-checked on preview for `/`, `/produkter`, and a representative PDP after this branch deploys to preview. Production deploy requires explicit approval.

## Rollback

1. Revert this branch / restore `turbopackFileSystemCacheForBuild: true` only if build time regresses unacceptably **and** shells remain healthy with cleared build cache.
2. Revert the decompress try/catch only together with an upstream Next release that includes equivalent handling.
3. Emergency escape: set `cacheComponents: false` only with explicit owner approval; expect broad rendering/cache semantics change.
4. If a truncated shell is already cached in production CDN, clear build cache and redeploy (do not re-promote the corrupt deployment).

## Residual risk

- Upstream #95238 still open; patch must be revalidated on every Next bump.
- Corrupt resume bodies still cannot resume PPR; they degrade to dynamic (correct fail-closed) but may still log parse failures.
- Build-cache truncation is mitigated, not proven fixed upstream.
- No production deploy is implied by this PR.

## Verification performed (2026-07-28)

| Gate | Result |
| --- | --- |
| `node --test scripts/next/ppr-resume-decompress.test.mjs` | 6/6 pass |
| `pnpm exec next typegen` | pass (Node 24) |
| `pnpm exec tsc --noEmit` | pass |
| ESLint on touched config/scripts | pass |
| `pnpm build` | pass — `/`, `/produkter`, `/produkter/[handle]` remain Partial Prerender |
| Production hard-load shell probe (Vercel MCP auth) | `/`, `/produkter`, `/produkter/comfyrobe` currently intact (`</html>` + `self.__next_f.push`) |
| Local `pnpm start` hard-load shell smoke (`PPR_SHELL_BASE_URL=http://127.0.0.1:3010`) | pass for `/`, `/produkter`, `/produkter/comfyrobe`, `/produkter/utekos-techdown` |
| Browser client-nav smoke on preview | blocked until preview URL; not production-deployed |

## Phase gate checklist

- [x] Isolated branch created and baseline locked
- [x] Root cause / controlled workarounds documented for A and B
- [x] Local decompress regression tests added
- [x] Typecheck / production build green on this branch
- [ ] Preview hard-load + client nav verified
- [x] No production deploy without explicit approval
- [x] Rollback documented
