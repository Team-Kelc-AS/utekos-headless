# Canonical Event Control

## Authority and discovery

The TypeScript/Zod union, event catalog, parameter catalog, route contracts and
provider registries are authoritative. The v1 manifest is generated from these
sources, not maintained as a second hand-written event list. It covers the full
canonical union and explicitly separates catalog-only entries. Source hashes
bind the generated artifact to its inputs; `prebuild` rejects drift.
The Vercel source allowlist retains this manifest directory and the five
generator/catalog modules required by that check; other contract exports stay
excluded. A local build alone does not verify deployment packaging.

`/canonical-control` is the private operator surface. It uses the existing
Utekos WorkOS Production application, a dedicated host-only encrypted session
cookie, and an exact user + organization allowlist. Verified email is required;
impersonation is rejected. No customer session or local-auth bypass is used.
The existing admin callback remains unchanged. Session cookies expire after
one hour. Local logout clears only the Control session, not the wiki session.
The approved Vercel-linked operator belongs to the dedicated `Utekos Canonical
Event Control` organization with the Member role (no WorkOS management
permissions). The legacy wiki operator and organization are not authorized for
Control. Identity selection uses the verified WorkOS user ID, not an assumed
match between a Vercel email and an existing wiki account.

The protected `GET /canonical-control/context` accepts either `name`, `query`,
or neither (inventory), plus an integer `limit` between 1 and 5. It returns the
definition, structural JSON Schema, parameter lineage, provider mapping, source
pipeline references, checksum and deployment SHA in one request. It performs no
warehouse read, event dispatch, replay, tag publication or provider mutation.

The browser registers `canonical_event_context` through native
`document.modelContext.registerTool` after authentication. Registration uses an
owned AbortSignal; logout/unmount removes it. Execution rechecks authentication
on the server. Browsers without native support retain the ordinary UI. Native
registration, browser invocation and compatibility with a particular agent are
separate verification claims; no polyfill is used to claim native support.
Some browser agent bridges omit the invocation AbortSignal. In that case the
tool retains its owned registration signal; when an invocation signal exists,
both cancellation signals are honored. Logout/unmount cancellation is never
optional.

The local Insight MCP implementation remains owned by `utekos-platform-tools`.
Its `canonical_event_context` combines the same manifest with the live source
index and detailed source topology. Source reads are checksum-verified and fail
closed on drift. Existing explicitly scoped warehouse trace tools remain separate.

## Evidence boundaries

- Current web tracking authorization is the source-defined `operator_policy`.
  Cookiebot state is not consulted by that resolver. Older consent declarations
  and fields are retained as source facts, not interpreted as new gating logic.
- JSON Schema is structural. Custom Zod refinements remain authoritative in code.
- A registry entry or source path does not prove deployed execution.
- `accepted_unverified`, HTTP success and queue acknowledgments do not establish
  provider reporting, deduplication or attribution.
- Catalog-only entries must not be submitted as canonical schema members.

## Maintenance and tests

After normative source changes:

```sh
pnpm contracts:canonical-manifest:generate
pnpm contracts:canonical-manifest:check
pnpm contracts:canonical-manifest:test
pnpm exec tsx --test src/lib/canonical-control/control.test.ts
```

Release additionally requires Next type generation, app and edge typechecks,
build, focused proxy regression tests, UI/runtime checks and the repository's
release gates. Release only through `pnpm sync` from synchronized `main`.
The platform repository's Control Plane tests are run independently.

`scripts/ops/provisionCanonicalControlAuth.mjs` is an explicit, operator-approved
setup utility, never a build hook. It verifies the existing WorkOS identity,
adds missing sensitive Production variables, and leaves existing variables
untouched. `.env.canonical-control.local` is ignored and mode 0600. It contains
server configuration, not a password for the operator to type. Do not log it.

## Text embeddings

Do not make embeddings authoritative for names, types, required parameters,
consent/authorization, routing or evidence status. The current bounded catalog
supports exact identifiers and deterministic text search without a vector
service. Embeddings become useful for Norwegian/English intent queries and
larger troubleshooting/documentation collections. Use hybrid keyword + vector
ranking, then resolve every hit back to a canonical event and the current
manifest checksum. Reject stale embeddings. Index definitions only, not raw
events, customer identity or credentials. Add this only after a measured query
evaluation demonstrates better retrieval than the deterministic baseline.

## Documentation consulted

- WorkOS AuthKit Next.js installed 4.2.0 source and official API documentation
  (`workos/authkit-nextjs`), including middleware header sanitization and PKCE.
- Next.js installed 16.3.1 Route Handlers and current official auth documentation.
- WebMCP current draft (`webmachinelearning/webmcp`), native registration and
  AbortSignal lifecycle; WebMCP Enable source-integration checks.
- Zod 4 library-author/core documentation for shared Mini/classic schema access.
- TypeScript compiler API documentation for declaration/import inspection.
- Supabase hybrid-search documentation for the optional embedding assessment.

No Supabase migration or paid-media/provider configuration change is required.
