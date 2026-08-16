# Cache Components / PPR stabilization

Status: local completion candidate for KRI-12 through KRI-18;
unused-code cleanup and the local browser gate are complete;
Preview and production gates remain

Reviewed: 2026-07-30

Next.js: 16.3.1

## Decision

Keep Cache Components enabled, keep
`experimental.turbopackFileSystemCacheForBuild` disabled, retain
the version-pinned Next.js resume-body patch, and move
cart-cookie bootstrap out of the blocking server-render path.

The implementation remains one release unit. Its focused tests,
clean production build, local HTTP/PPR runtime checks and local
browser gate pass. It is ready for Preview. Production acceptance
additionally requires a READY deployment of the exact reviewed
commit, repeated production probes, browser navigation and a
deployment-scoped runtime error scan.

PR #74 remains superseded. Its useful diagnostics are retained in
the current scripts and documentation; its stale branch and
lockfile must not be merged.

### Version and security floor

The completion candidate uses exact Next.js family version
16.3.1. The 16.2.9 candidate was rejected after the official July
2026 security release identified four high- and five
medium-severity issues and required 16.2.11 or newer for the
affected 16.2 line. The current pin is above that minimum and is
applied consistently to `next`, `@next/mdx`,
`@next/third-parties`, `@next/bundle-analyzer` and
`eslint-config-next`.

The local patch is version-pinned to `next@16.3.1`. Official
16.3.1 still has no `decompressBody` helper. A further Next.js
upgrade must fail the frozen install until the patch mapping,
same-source control and complete verification matrix have been
ported deliberately.

## What is known

### Confirmed

- Historical production logs contain truncated PPR resume bodies,
  `Z_BUF_ERROR`, `unexpected end of file`, postponed-state parse
  failures and `Connection closed` across the revenue-critical
  routes.
- The installed Next.js 16.2.12 source has no equivalent bounded,
  multi-encoding resume-body decompression helper.
- The old cart-cookie boundary suspended `Header`, route content
  and `Footer` together. Its generated shells were only 7.3–7.9
  KB and had no visible `header`, `main` or `footer`.
- The revised cookie bootstrap produces visible static shells
  while preserving one cart id, one TanStack Query cache and one
  mutation machine.
- The combined tree includes the separately reviewed unused-code
  cleanup as `ee89aaa8c` without removing the required public
  cart actions.

### Probable, not proven

- Restored Turbopack/Vercel build cache contributed to the
  intermittent invalid-shell family. Production history
  correlates the failure with cache restoration, but the
  controlled local KRI-15 experiment did not reproduce the
  failure.
- The local transport patch prevents the observed
  compressed/truncated resume body from reaching Next.js in the
  previous invalid form. It does not prove that every historical
  failure had one cause.

### Still unresolved

- A local build cannot reproduce Vercel's distributed cache
  restore, CDN and resume chain exactly.
- The root pathname-sensitive `Suspense` boundary remains
  necessary: removing it makes Next.js 16.2.12 reject
  prerendering because `NavigationProgress` calls `usePathname()`
  and `useSearchParams()`. Cookie access no longer suspends that
  boundary on the control routes, but a future pathname refactor
  may narrow it further.

## Current controls

- `cacheComponents` remains enabled.
- `experimental.turbopackFileSystemCacheForBuild` remains
  `false`.
- `patches/next@16.3.1.patch` normalizes `Content-Encoding`,
  decodes stacked codings in reverse application order and
  handles `gzip`, `br` and `deflate`.
- Gzip magic remains a recovery signal when an intermediary omits
  or mislabels the header.
- A gzip stream missing its complete eight-byte trailer is
  recovered only when one reconstructed CRC32/ISIZE trailer makes
  normal gunzip integrity validation pass. Partial-trailer and
  mid-stream truncation are rejected. `Z_SYNC_FLUSH` output is
  never accepted on its own.
- Mid-stream truncation, corrupt input, unsupported encodings and
  output-limit violations emit controlled metadata and return the
  original bytes. The downstream handler may still reject that
  postponed state; the patch does not claim a graceful Next.js
  fallback for invalid raw bytes.
- Synchronous decompressed output is capped at the configured
  `maxPostponedStateSize`. The application lowers that ceiling
  from Next.js' 100 MB default to 5 MB, and recovery performs
  only one bounded validation decompression.
- For a combined PPR resume and Server Action request, only the
  postponed-state prefix is decompressed. Following action bytes
  remain unchanged.
- The PPR/Flight probe stores status, selected non-sensitive
  headers, byte length and SHA-256. It never stores body
  excerpts.
- Cart-cookie bootstrap is client initiated after the visible
  shell is available. The cart control remains a dimension-stable
  placeholder until bootstrap is terminal, avoiding a false
  `0 varer` announcement for an existing cart.
- A late cookie result can fill an absent cart id but cannot
  overwrite a cart id already returned by a mutation.
- The authenticated Shopify cart GID, including its `key` query,
  remains server-side in an HttpOnly cookie. Client state, Server
  Action results, Klarna references and telemetry use only the
  canonical keyless public cart GID.
- Shopify's checkout URL contains the same capability key. Public
  cart state therefore exposes only `/api/cart/checkout`; that
  no-store same-origin route reads the HttpOnly cart cookie,
  refetches the checkout URL server-side, validates its HTTPS
  host and cart path, and redirects only when checkout starts.
- Cart reads no longer accept a client-selected cart id. The
  Server Action reads the request cookie, strictly rejects
  malformed and non-canonical Shopify cart GIDs, and calls
  Shopify without placing the authenticated cart id in a
  persistent server cache.
- The cart cookie is rewritten with `HttpOnly`, `SameSite=Lax`,
  path `/` and `Secure` in production. Malformed legacy cookies
  are cleared.
- Cache tags and log references derived from an authenticated
  cart id use a SHA-256 fingerprint. Shopify transport errors and
  logs redact the `key` query.
- Raw cart mutation helpers, validators and `fetchCart` are
  server-only. The production build registered 56 unique Server
  Action ids, with zero forbidden raw cart helpers in the server
  reference manifest.
- A cart identity rotation from public id A to B returns an
  explicit `identity-changed` result. The client adopts B before
  caching the response, removes A and always revalidates on
  window focus.
- Bootstrap fails open after three seconds so a stalled Server
  Action cannot permanently remove the commerce control. A valid
  late result may still hydrate the shared cart state.
- An already-open tab that bootstrapped without a cart still
  requires reload to discover a cart B created in another tab;
  this null-to-B case remains a documented browser residual.
- Historical dataLayer/provider/telemetry records may contain
  authenticated cart ids emitted before this change. Their
  retention and redaction require a separate post-release audit.
- `/discount/NBCC128` is a permanent Next.js redirect to `/nbcc`;
  the verified 308 response preserves query parameters.

The postponed state is opaque application/platform data. Do not
parse or modify it outside the narrowly scoped Next.js transport
patch.

## KRI-15: controlled build-cache experiment

The source was locked at base
`fbffa62e7844bb9b07849d01182a3d123fc25823` plus only the three
KRI-16 patch/lock/test files. The only A/B config difference was
`turbopackFileSystemCacheForBuild: false` versus `true`. Node
24.14.0, pnpm 11.17.0, Next.js 16.2.9, lockfile and environment
were otherwise identical.

| Variant | Build |   Total | Compile | 131 pages | `.next/cache` |
| ------- | ----- | ------: | ------: | --------: | ------------: |
| `false` | cold  | 32.67 s |  12.1 s |      pass |        2.1 MB |
| `false` | warm  | 48.52 s |  19.4 s |      pass |        2.1 MB |
| `true`  | cold  | 43.04 s |  17.9 s |      pass |        533 MB |
| `true`  | warm  | 25.59 s |   2.4 s |      pass |        538 MB |

All four artifacts contained 542 identical PPR payload paths, 68
metadata files and 60 non-empty postponed states. Every artifact
passed the 16/16 PPR/RSC probe and 4/4 shell smoke with no
truncation, `Z_BUF_ERROR` or `Connection closed` signature.

The warm `true` build improved compile time by 86.6% and total
time by 40.5%, but introduced roughly 536 MB of additional cache.
The controlled local experiment did not support the narrower
hypothesis that Turbopack filesystem-cache reuse alone corrupts
the generated PPR artifacts under these test conditions. That
local hypothesis is rejected for the measured environment. A
contribution from Vercel's distributed cache-restore/CDN chain
remains unresolved because it cannot be reproduced locally.

Decision: keep `false`. The flag is opt-in and experimental in
the official Next.js 16.2.9 documentation, and the local speed
gain does not justify restoring the production risk surface.
Reconsider only after an upstream correction or Next.js upgrade
plus a Vercel cache-restore stress test and explicit rollback.

## KRI-16: resume-body matrix

`pnpm test:ppr-resume-decompress` covers:

| Case                                  | Expected result                                   |
| ------------------------------------- | ------------------------------------------------- |
| Uncompressed                          | Return bytes unchanged                            |
| Empty                                 | Return empty bytes unchanged                      |
| Gzip header                           | Decode                                            |
| Gzip magic without header             | Decode                                            |
| Brotli header                         | Decode                                            |
| Deflate header, case/array normalized | Decode                                            |
| Stacked encodings                     | Decode in reverse application order               |
| Truncated gzip trailer                | Recover only after CRC32/ISIZE validation         |
| One to seven missing trailer bytes    | Reject recovery and preserve original bytes       |
| Mid-stream gzip truncation            | Warn and preserve original bytes                  |
| Gzip with mismatched header           | Prefer gzip magic and recover                     |
| Non-gzip with incorrect gzip header   | Preserve raw bytes                                |
| Corrupt gzip                          | Warn with controlled metadata; preserve raw bytes |
| Invalid Brotli                        | Warn with controlled metadata; preserve raw bytes |
| Decompressed output above limit       | Warn and preserve original bytes                  |
| Resume plus Server Action             | Decode prefix; preserve action bytes              |
| Installed Server Action split         | Split raw action body before decode               |

Result on 2026-07-30: 18/18 passed. A clean production build and
the final shell/runtime probes also passed after the hardening
change.

### Same-source unpatched control

The control used the registry tarball for `next@16.2.12`, with
npm SHA-1 `70c834b297c9ac573a41b00555b507a827506a52` and SHA-256
`47fe82a46552cde8dd5af57f6e7f93e04eb0a587b19f17b20fc586fdfaa76b60`.
The pristine and patched package trees were executed on Node
24.17.0. `diff -qr` showed exactly the six files named by
`patches/next@16.2.12.patch`; no other package source differed.
The patch SHA-256 was
`22b8ba3dbc7620038662c11849931cf8129091860bad05b7fc2886a9aa8deadf`.

| Input                                      | Pristine 16.2.12                      | Patched 16.2.12                                 |
| ------------------------------------------ | ------------------------------------- | ----------------------------------------------- |
| Full gzip, 4,107 B decoded / 60 B encoded  | Raw UTF-8 differs from state          | Exact decoded state; no warning                 |
| Trailer removed, 52 B                      | Raw UTF-8 differs; native `Z_BUF`     | Exact state; controlled recovery warning        |
| Mid-stream cut, 40 B                       | Raw UTF-8 differs; native `Z_BUF`     | Exact raw input; controlled failure warning     |
| `gzip, br` stacked encoding, 64 B          | Raw UTF-8 differs from state          | Exact state after reverse-order decode          |
| 4,107 B decoded with 64 B configured limit | No decompression helper or output cap | Exact raw input; `ERR_BUFFER_TOO_LARGE` warning |

The pristine module exports no `decompressBody`, and both
pristine request handlers convert incoming resume bytes directly
with `.toString('utf8')`. The patched module exports the helper
and both handlers call it before conversion. This satisfies the
same-source with/without-patch control without treating raw-byte
preservation as successful resume recovery.

## KRI-17: cart cookie boundary

Before the refactor, the request-specific cart-cookie read
blocked the entire visible storefront:

| Route                        | Old static shell | Visible structure |
| ---------------------------- | ---------------: | ----------------- |
| `/`                          |          7,881 B | none              |
| `/produkter`                 |          7,651 B | none              |
| `/produkter/comfyrobe`       |          7,301 B | none              |
| `/produkter/utekos-techdown` |          7,321 B | none              |

After moving the cookie read out of server render:

| Route                        | New static shell | Visible structure                                       |
| ---------------------------- | ---------------: | ------------------------------------------------------- |
| `/`                          |        378,804 B | `header`, `main`, `footer`, closed document             |
| `/produkter`                 |        237,183 B | `header`, `main`, `footer`, closed document             |
| `/produkter/comfyrobe`       |         29,718 B | `header`, `main`, `footer` plus dynamic product segment |
| `/produkter/utekos-techdown` |         33,836 B | `header`, `main`, `footer` plus dynamic product segment |

The global provider is intentionally retained. Splitting header
and route content into separate providers would create multiple
cart ids, QueryClient caches and mutation machines, risking a
stale header after a product mutation.

The bootstrap has explicit `pending`/`ready` state. The cart
trigger is not rendered until the Server Action returns a cart
id, no cart id, a controlled error or the three-second fail-open
timeout. The pure resolver test and a browser race with a held
Server Action response prove that a mutation-created cart wins
over a late stale cookie result.

The client never supplies the authenticated cart id to the read
action. The action reads the request cookie and accepts only a
canonical `gid://shopify/Cart/...` value with its secret `key`
query. It rejects whitespace, credentials, ports, extra paths,
fragments, malformed queries, keyless ids and oversized inputs.
The result is normalized to the keyless public id before it can
reach client state. No persistent server cart-read cache receives
the authenticated id; TanStack Query is the only cart-read cache.

Focused tests cover encoded valid cookies, malformed and legacy
cookies, ownership binding, secret redaction, public action
results, Klarna references and A-to-B identity changes. Browser
verification on the combined build proved add-to-cart 0-to-1,
hard-reload 1-to-1, invalid-cookie recovery, protected cookie
attributes and zero authenticated-cart-key occurrences in DOM,
request/response bodies, browser storage and dataLayer. The
server checkout redirect returned 307 to the trusted HTTPS host
with an empty body and `private, no-store, max-age=0`.

This intentionally adds one client-initiated Server Action POST
on each full provider mount. It was retained instead of a nested
async Server Component because it removes `cookies()` from the
initial server-render/PPR tree entirely; the nested alternative
would add a request-time Suspense/resume segment to every route.
Preview must measure the exact request count and time-to-ready
before acceptance. On a transient bootstrap failure the cart
control becomes ready with no client cart id; later cart
mutations still read the authoritative cookie server-side, but
the temporary empty-cart presentation and the null-to-B cross-tab
residual must be exercised and recorded in the browser gate.

## KRI-18: verification record

Required local gates:

```bash
pnpm install --frozen-lockfile
pnpm test:ppr-resume-decompress
pnpm test:cart-cookie-bootstrap
pnpm test:ppr-rsc-probe
pnpm exec next typegen
pnpm typecheck
pnpm lint
pnpm build
```

Local results on 2026-07-30:

- frozen install: pass;
- resume-body tests: 18/18;
- combined focused cart, Klarna and analytics tests: 29/29;
- PPR probe unit tests: 12/12;
- Next typegen: pass;
- TypeScript: pass;
- repository-wide ESLint after PR #87: pass with 0 errors and 45
  pre-existing warnings;
- production build on exact Next.js 16.2.12: pass, 132/132
  routes;
- largest generated postponed state: 20,624 bytes, 0.39% of the
  configured 5 MB ceiling;
- generated control shells contain visible `header`, `main` and
  `footer`;
- local production runtime shell smoke: 4/4 routes returned
  complete HTML with 200 status;
- local PPR/Flight runtime probe: 16/16 complete observations,
  zero failures;
- server reference manifest: 56 action ids, all unique, and zero
  forbidden raw cart helpers;
- `/discount/NBCC128?utm_source=gate`: 308 with location
  `/nbcc?utm_source=gate`;
- desktop/mobile route browser smoke: 8/8 HTTP 200 with visible
  `header`, `main` and `footer`, zero page errors;
- cart browser security and persistence gate: pass, including
  zero secret occurrences across 16 request and 113 response
  bodies;
- server-only checkout handoff: 307 to `kasse.utekos.no`, empty
  body, trusted HTTPS target and explicit no-store policy.

The unused-code cleanup is integrated as `ee89aaa8c`. It changes
39 files with 2,379 deletions and 3 insertions, including 28 dead
production files, one direct test and 15 unused symbols. Its
independent gates passed 107/107 tests, Next typegen, TypeScript,
the production build, diff validation and lint with 0 errors and
45 warnings. Repository reference scans found no remaining live
imports of the removed exports or paths.

### Open phase gates

The previous repository-wide lint blocker is cleared by PR #87,
merged as `84e92d47bc3bc11ea9db1284a5cc033d829e4a49`; the
combined local PPR candidate passes full lint. The separately
reviewed unused-code cleanup is integrated without removing the
required cart actions. The local browser gate is complete. KRI-12
remains open until the exact combined tree passes Preview and
production runtime gates.

`pnpm audit --prod` is not repository-clean: it reports 18
transitive advisories (11 high, 7 moderate) outside the local
Next.js patch. The Next.js 16.2.9 advisories that forced this
port are absent after the 16.2.12 upgrade. The remaining
dependency findings require a separately reviewed dependency
remediation; this record must not be read as a whole-repository
audit-clean claim.

### Runtime gates

```bash
PPR_RSC_PROBE_BASE_URL=<preview-url> pnpm ppr:rsc:probe
PPR_RSC_PROBE_BASE_URL=https://utekos.no pnpm ppr:rsc:probe
```

For both Preview and production:

1. run two sequences across `/`, `/produkter`,
   `/produkter/comfyrobe` and `/produkter/utekos-techdown`;
2. verify hard load and real client navigation on desktop and
   mobile;
3. verify empty and existing cart bootstrap, cart drawer and one
   non-purchasing add-to-cart flow;
4. query deployment-scoped logs for `Z_BUF_ERROR`,
   `unexpected end of file`, postponed-state failures,
   `Connection closed` and `invalid response from cache`;
5. distinguish READY/build success from observed browser/runtime
   health.

The production deployment before this completion candidate,
`dpl_6KodbboiBVefaeEhn2qaPqzeeh7z` at
`84e92d47bc3bc11ea9db1284a5cc033d829e4a49`, is the current
known-good baseline. Its READY and runtime evidence applies to PR
#87, not yet to this completion candidate.

## Rollback

Treat the merged completion PR as one release unit.

1. If Preview regresses, do not merge or promote it.
2. If production regresses, immediately point production back to
   the previous known-good deployment.
3. Revert the completion PR merge commit and let the normal
   protected `main` deployment build the rollback.
4. Re-run the production PPR probe, browser navigation and
   deployment-scoped error scan on the rollback deployment.

Do not re-enable the Turbopack filesystem build cache, disable
Cache Components or remove only one half of the transport/cart
fix as an emergency workaround. Those changes require their own
Preview, measurement and rollback plan.

When a future Next.js release contains an equivalent upstream
correction, remove the local patch only after verifying the
installed source, full encoding matrix, clean Preview build, cart
bootstrap, PPR/Flight probes and production runtime behavior.

## Documentation sources

- [Next.js Cache Components](https://nextjs.org/docs/app/api-reference/config/next-config-js/cacheComponents)
- [Next.js Partial Prerendering](https://nextjs.org/docs/app/getting-started/partial-prerendering)
- [Turbopack filesystem cache](https://nextjs.org/docs/app/api-reference/config/next-config-js/turbopackFileSystemCache)
- [Turbopack build caching](https://nextjs.org/docs/app/api-reference/turbopack)
- [PPR platform guide](https://nextjs.org/docs/app/guides/ppr-platform-guide)
- [Next.js July 2026 security release](https://nextjs.org/blog/july-2026-security-release)
- [Next.js Server Actions security](https://nextjs.org/docs/app/api-reference/directives/use-server)
- [Next.js redirects](https://nextjs.org/docs/app/api-reference/config/next-config-js/redirects)
- [Shopify Storefront cart management](https://shopify.dev/docs/storefronts/headless/building-with-the-storefront-api/cart/manage)
- [Node.js 24 zlib API](https://nodejs.org/docs/latest-v24.x/api/zlib.html)
- [RFC 9110 Content-Encoding](https://www.rfc-editor.org/rfc/rfc9110.html#name-content-encoding)
- Local version-pinned Next.js 16.2.12 source and documentation
- Context7 library `/vercel/next.js/v16.2.9` for the unchanged
  Cache Components and Server Action APIs; 16.2.12 was not yet
  indexed at review time
