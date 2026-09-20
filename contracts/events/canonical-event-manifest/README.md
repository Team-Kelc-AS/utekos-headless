# Canonical Event Control

## Authority and discovery

The TypeScript/Zod union, event catalog, parameter catalog, route
contracts and provider registries are authoritative. The v1
manifest is generated from these sources, not maintained as a
second hand-written event list. It covers the full canonical
union and explicitly separates catalog-only entries. Source
hashes bind the generated artifact to its inputs; `prebuild`
rejects drift. The Vercel source allowlist retains this manifest
directory and the generator/catalog modules required by that
check; other contract exports stay excluded. A local build alone
does not verify deployment packaging.

`/canonical-control` is the private operator surface. It uses the
existing Utekos WorkOS Production application, a dedicated
host-only encrypted session cookie, and an exact user +
organization allowlist. Verified email is required; impersonation
is rejected. No customer session or local-auth bypass is used.
The existing admin callback remains unchanged. Session cookies
expire after one hour. Local logout clears only the Control
session, not the wiki session. The approved Vercel-linked
operator belongs to the dedicated
`Utekos Canonical Event Control` organization with the Member
role (no WorkOS management permissions). The legacy wiki operator
and organization are not authorized for Control. Identity
selection uses the verified WorkOS user ID, not an assumed match
between a Vercel email and an existing wiki account.

The protected `GET /canonical-control/context` accepts either
`name`, `query`, or neither (inventory), plus an integer `limit`
between 1 and 5. It returns the definition, structural JSON
Schema, parameter lineage, provider mapping, source pipeline
references, checksum and deployment SHA in one request. It
performs no warehouse read, event dispatch, replay, tag
publication or provider mutation.

The browser registers `canonical_event_context` through native
`document.modelContext.registerTool` after authentication.
Registration uses an owned AbortSignal; logout/unmount removes
it. Execution rechecks authentication on the server. Browsers
without native support retain the ordinary UI. Native
registration, browser invocation and compatibility with a
particular agent are separate verification claims; no polyfill is
used to claim native support. Some browser agent bridges omit the
invocation AbortSignal. In that case the tool retains its owned
registration signal; when an invocation signal exists, both
cancellation signals are honored. Logout/unmount cancellation is
never optional.

The local Insight MCP implementation remains owned by
`utekos-platform-tools`. Its `canonical_event_context` uses the
app's dependency-free `projectCanonicalContext.mjs`, not a
separately maintained projection. The MCP host loads the
generated v2 result schema, verifies its manifest-bound checksum,
checks source freshness, and validates `structuredContent.data`
against that schema. The app validates with the source Zod schema
before the HTTP response; UI and WebMCP consume that same
endpoint. MCP's outer audit envelope is separate from the
identical context data. A local MCP checkout sets
`deployment_sha` to null; it does not claim to be the deployed
revision. Existing explicitly scoped warehouse trace tools remain
separate.

## Bounded runtime-rule pilot (local implementation)

The executable ownership pilot covers `add_to_cart` and
`purchase`. It derives provider event-name mappings for Google,
Meta, Microsoft UET, Pinterest and Snapchat from the same mapping
objects consumed by the catalog and server mappers. Dispatch
ownership for Supabase plus the five server providers is derived
from `eventCatalog`.

For each pilot event, the generator inspects imports,
declarations and symbol use before recording source-verified
connections. The graph starts at the real collection route,
continues through acceptance, dispatch planning, persistence and
queue publication, and then covers targeted/batch registries,
provider adapters, dispatchers, mappers and sender boundaries.
Generation fails closed if a declared connection is missing.

Microsoft UET transaction ID/event label and item-price selection
remain the only parameter-level semantics migrated to executable
ownership. `src/lib/analytics/microsoftCommerceRules.ts` owns
these rules. Both real server mappers call
`resolveMicrosoftCommerceRule`, which consumes them. The selected
parameter-lineage entries are generated from these rules rather
than copied from the descriptive catalog. Each lineage entry
identifies `runtime_rule` or `catalog_declaration`.

The result declares
`pilot_event_runtime_and_provider_connections` for these two
events and `not_migrated` for the remaining events. The source
graph does **not** prove runtime execution, deployed code,
provider acceptance, reporting, deduplication or attribution.
Browser transport labels and remaining parameter descriptions are
still catalog declarations unless an explicit connection says
otherwise. Remaining metadata is
`catalog_declarations_not_runtime_verified`.

`canonical-event-context.v2.schema.json` is the full
success-result contract. Business objects are closed, enums are
constrained, and the embedded event JSON Schema uses a bounded
recursive vocabulary, not arbitrary unknown values. Typed maps
remain for dynamic JSON Schema property names. This is strict
application and MCP output validation, **not** a claim of
compatibility with every model's restricted Structured Outputs
schema dialect. Native WebMCP has no `outputSchema` property;
validation belongs to the shared server boundary and exported
schema. The response is validated before `Response.json`; invalid
output returns a sanitized `INVALID_CONTROL_OUTPUT` with HTTP
500, not a partial success.

The pilot tests change one in-memory Microsoft commerce rule and
one catalog dispatch rule, proving that the actual mapper/planner
and newly generated strict result change together. They verify
all five provider event mappings, inspect the 51 source
connections per pilot event, and disconnect a mapper in an
isolated source fixture to require generation failure. No real
tracking event or provider request is sent by these tests.

## Evidence boundaries

- Current web tracking authorization is the source-defined
  `operator_policy`. Cookiebot state is not consulted by that
  resolver. Existing Microsoft and Meta mapper guards still
  inspect the supplied consent snapshot. This pilot preserves
  those guards; it does not prove consent has disappeared from
  all runtime paths. Older catalog consent declarations are not
  promoted to runtime-verified rules.
- JSON Schema is structural. Custom Zod refinements remain
  authoritative in code.
- A source-verified connection proves a checked code binding, not
  deployed or observed execution.
- `accepted_unverified`, HTTP success and queue acknowledgments
  do not establish provider reporting, deduplication or
  attribution.
- Catalog-only entries must not be submitted as canonical schema
  members.

## Maintenance and tests

After normative source changes:

```sh
pnpm contracts:canonical-manifest:generate
pnpm contracts:canonical-manifest:check
pnpm contracts:canonical-manifest:test
pnpm exec tsx --test src/lib/canonical-control/control.test.ts
pnpm exec tsx --test src/lib/canonical-control/strictControl.test.ts scripts/contracts/canonicalPilot.test.ts
```

Release additionally requires Next type generation, app and edge
typechecks, build, focused proxy regression tests, UI/runtime
checks and the repository's release gates. Release only through
`pnpm sync` from synchronized `main`. The platform repository's
Control Plane tests are run independently.

`scripts/ops/provisionCanonicalControlAuth.mjs` is an explicit,
operator-approved setup utility, never a build hook. It verifies
the existing WorkOS identity, adds missing sensitive Production
variables, and leaves existing variables untouched.
`.env.canonical-control.local` is ignored and mode 0600. It
contains server configuration, not a password for the operator to
type. Do not log it.

## Text embeddings

Do not make embeddings authoritative for names, types, required
parameters, consent/authorization, routing or evidence status.
The current bounded catalog supports exact identifiers and
deterministic text search without a vector service. Embeddings
become useful for Norwegian/English intent queries and larger
troubleshooting/documentation collections. Use hybrid keyword +
vector ranking, then resolve every hit back to a canonical event
and the current manifest checksum. Reject stale embeddings. Index
definitions only, not raw events, customer identity or
credentials. Add this only after a measured query evaluation
demonstrates better retrieval than the deterministic baseline.

## Documentation consulted

- WorkOS AuthKit Next.js installed 4.2.0 source and official API
  documentation (`workos/authkit-nextjs`), including middleware
  header sanitization and PKCE.
- Next.js installed 16.3.1 Route Handlers and current official
  auth documentation.
- WebMCP current draft (`webmachinelearning/webmcp`), native
  registration and AbortSignal lifecycle; WebMCP Enable
  source-integration checks.
- Zod 4 library-author/core documentation for shared Mini/classic
  schema access.
- Zod 4 strict objects, recursive schema and draft 2020-12 JSON
  Schema conversion; installed `z.fromJSONSchema` is used by the
  separate MCP host.
- Google Data Manager's official event-ingestion and recommended
  commerce-event documentation (accessed through the native
  documentation MCP).
- Meta's official Conversions API parameter and best-practice
  documentation (accessed through the native documentation MCP).
- Microsoft Advertising's official UET Conversions API
  integration guide for event identity, deduplication and
  commerce fields (accessed through the native documentation
  MCP).
- TypeScript compiler API documentation for declaration/import
  inspection.
- Supabase hybrid-search documentation for the optional embedding
  assessment.

No Supabase migration or paid-media/provider configuration change
is required.
