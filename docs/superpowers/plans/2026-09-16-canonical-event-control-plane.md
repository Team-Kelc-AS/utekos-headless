# Canonical Event Control Plane v1 — implementation plan

Date: 2026-09-16
Repository: Team-Kelc-AS/utekos-headless
Implementation branch: codex/canonical-event-control-plane-20260916
Inspected source baseline: ff6306dfa426e6cf07413f3c8e9acf48762aa6dd
Status: planning and source review only; no control-plane runtime implementation or deployment is claimed by this document.

## Goal and authority

Make the existing CanonicalEvent ecosystem discoverable, inspectable and verifiable by agents through a read-only control-plane core and an MCP binding. Index, link and verify the existing implementation, contracts, configuration and receipts. Do not create a second event pipeline, business-event schema, provider registry or warehouse.

This plan follows the supplied 2026-09-16 repository inventory and the user's request to continue the original observability architecture. That inventory describes a clean worktree and read-only investigation, not an implementation. It does not establish the current state of another local checkout or deployment.

An inconsistency in the supplied inventory must not become a constant in code: its summary says 32 schema members and 34 catalog events, but its enumerated event list contains 33 names and its provider table contains 35 event rows. Reading canonicalEvent.ts at the baseline also shows 33 schema entries. Counts must be derived and compared from the actual sources; the inventory's numeric headings are not authoritative. Do not edit or replace the supplied inventory.

## Architecture decisions

1. CanonicalEvent retains its precise meaning: the parseable union exported by src/lib/analytics/canonicalEvent.ts. Discovery additionally includes catalog entries outside that union and shows schema membership separately from catalog lifecycle. Do not promote checkout_error or payment_error into the union to make counts match.
2. Keep business events, journey observations, Shopify checkout observations and web vitals in separate namespaces. Link them only through supported, explicit correlations; do not normalize all of them into the commerce ledger.
3. GA4 via browser/GTM/sGTM is in functional scope. Google Data Manager/Google Ads business logic is not. Existing Data Manager routes remain visible as out_of_scope_dependency. Pinterest and Snapchat remain discoverable in inventory, health and drift results.
4. Source-declared state, runtime registration, deployment, warehouse observation, provider acceptance and provider reporting are separate dimensions. A declaration is not a runtime check; registration is not execution; accepted_unverified is not reported, deduplicated or attributed.
5. Live adapters are optional enrichment. Static inspection works without cloud credentials or live tools. An unavailable adapter produces an explicit unavailable/unknown result and never a green health result or an empty-success result.
6. Reuse the existing MCP host/operator surface after its source and registration contract have been inspected. Previously mentioned apps/insight-mcp files and scripts/mcp were not found at this GitHub baseline. Their absence at this revision is not proof that no separate/local host exists. Do not invent that host's interfaces or create a parallel server by default.
7. The control plane does not sit in the event-delivery critical path. Failures in indexing, MCP, telemetry readback or optional live verification must not stop commerce events or provider dispatch.
8. v1 is read-only. No replay, backfill, checkout mutation, provider write, GTM/Shopify publication, migration or production deployment is authorized by invoking an inspection tool. Separate any future remediation execution from inspection and planning.

## Improvements to the initial design

### Use a route graph, not one mandatory stage sequence

The inventory's stage sequence is useful vocabulary, not a universally required pipeline. Model actual branches: browser delivery, first-party collector, ledger/outbox, GA4 through sGTM, Shopify source observation and canonical promotion. A route may legitimately have no queue stage. A missing optional stage must not become a false failure.

Each graph edge includes its source reference, its applicability and a verification state. Report the first unsupported or unobserved boundary without inferring a cause that the evidence cannot establish.

### Make provenance and completeness part of every response

Define an observation envelope before tool handlers. Required concepts are source kind, repository revision or deployment identity where applicable, environment, observation time, evidence references, coverage, truncation and warnings. Distinguish not queried, unavailable, not found in the inspected window, stale evidence and not applicable.

A live observation must be scoped to the actual environment, deployment/service and query window. Source code evidence has a commit, not a fabricated live observation timestamp. Mixed revisions or environments cannot silently support one health conclusion.

### Optimize the agent interaction rather than listing every low-level API

Expose a small generic interface for discovery, event/route inspection, event tracing, drift comparison, environment capability inspection and health. Names and input/output contracts will be fixed in the contract task, before implementation. Return a bounded summary and source references by default; make detail opt-in. Do not generate one MCP tool per event/provider combination.

Use explicit output schemas and structured results with a compatible text representation. Treat read-only annotations as descriptions, not access control. Cached live responses retain their original observation time and scope. Prefer no new cache or data store until a measured requirement justifies one.

### Protect existing information boundaries

Use allowlisted response projections, not raw ledger/provider payloads or full environment dumps. Report configuration presence, reference and revision where appropriate, without exposing secret values. Keep provider credentials server-side and separate from the MCP client's authentication. Do not forward a client's MCP token to downstream providers. Review transport/authentication against the actual negotiated MCP revision and existing host implementation.

## Execution sequence and acceptance gates

### 1. Establish a reproducible source baseline

Sources: canonicalEvent.ts, eventCatalog.ts, eventCatalogSignalContracts.ts, providerAdapterRegistry.ts, providerOutboxWorkerRegistry.ts, scripts/contracts and the generated contracts.

- [ ] Obtain an isolated executable checkout of the agreed branch; inspect current HEAD and any applicable agent instructions before editing source.
- [ ] Use the repository-declared Node 24.x and pinned pnpm from package.json. Do not count tests on a different Node major as equivalent certification.
- [ ] Run contracts:events:check, contracts:dispatch:check, contracts:events:test and contracts:dispatch:test. Record actual results against the tested SHA.
- [ ] Enumerate schema members, catalog entries, adapter keys and worker keys from source; reconcile counts and memberships instead of hardcoding the inventory's totals.

Deliverable: baseline report with source identities, executable counts and explicit discrepancies. Gate: missing source or failed baseline checks is recorded, not interpreted as an absent feature or silently repaired outside scope.

### 2. Implement the derived inventory core

Read sources: src/lib/analytics/canonicalEvent.ts, eventCatalog.ts, the event contract catalog, runtime registries and implementation matrices. Place additive implementation and tests under scripts/control-plane unless inspection of an existing shared operator core establishes a better extension point; record that choice before code is written.

- [ ] Write failing tests for a schema member with a matching catalog entry, a blocked catalog-only event, and separate observability namespaces.
- [ ] Implement derived membership and links to file/symbol/revision. Before importing a runtime registry, inspect its initialization for side effects; inventory must never dispatch events or initialize live connections implicitly.
- [ ] Add tests for missing source files, duplicate/conflicting source keys, mismatched adapter/worker keys and catalog-active mappings with blocked_no_worker.
- [ ] Derive routes and parameter references from existing generators/contracts; do not maintain a second provider mapping table or a copied union.
- [ ] Prove a newly added source event appears without editing a control-plane event list.

Deliverable: usable static inventory/inspect function plus a local read-only CLI entry point. Gate: all new tests pass; source counts and ownership links are reproducible without live credentials.

### 3. Implement evidence and route verification

- [ ] Define and test the observation envelope and graph edge contract before implementing reducers.
- [ ] Test that source active cannot become deployed or observed, and accepted_unverified cannot become provider-reported or attributed.
- [ ] Test unknown/unavailable/stale/partial/not-applicable independently; an empty query result is bounded by its inspected window and coverage.
- [ ] Implement verification over the derived graph rather than one hardcoded linear sequence.
- [ ] Test Page View provisional capture versus canonical acceptance, Shopify observation versus promotion, and GA4/sGTM versus Data Manager routing as separate boundaries.
- [ ] Refuse cross-environment or cross-deployment evidence joins unless an explicit supported relationship is provided.

Deliverable: deterministic inspection/verification responses with provenance. Gate: no false promotion of evidence strength, and no required stage invented for a route that does not contain it.

### 4. Add bounded warehouse readback

Inspect first: scripts/ops/journey-timeline.ts, provider-dispatch-feedback-report.mjs, relevant schema/migrations, and their current query contracts. Reuse existing query/report logic where suitable; inspect and address import side effects before reuse.

- [ ] Verify live table/view and migration availability before claiming that repository-defined storage exists in the target database.
- [ ] Use parameterized identifiers, read-only transactions, deadlines, result limits and explicit truncation.
- [ ] Project only safe operational fields from marketing.event_ledger, source-evidence relations, ops.provider_dispatch_attempts and relevant separate observations.
- [ ] Test a ledger record without dispatch evidence, a consent-skipped route, a retry, a dead letter, and accepted_unverified without terminal provider readback.
- [ ] Test that source, journey, checkout and provider correlations use the actual defined keys and cannot join unrelated events solely because an identifier happens to match.
- [ ] Keep ops.tagging_observations writer/readback coverage explicitly unknown until its actual writer and records are identified.

Deliverable: an event trace with per-source completeness and justified edges, not raw event dumps. Gate: no database write, no PII/secret leakage and no inferred provider finality.

### 5. Add optional live configuration/readback adapters

Targets: Vercel deployment/runtime, Cloud Run sGTM, GTM published containers, Shopify source/pixel state and available Meta/GA4/Microsoft readback.

- [ ] Give each adapter a capability/status result; distinguish accessible reads from merely advertised tools.
- [ ] Inspect existing adapters before writing new clients. Bind results to explicit source/environment/revision and observation time.
- [ ] Read back the actual Cloud Run service/revision and deployed configuration; never treat the exported hardening file or a configured project default as verified live state.
- [ ] Read actual published GTM and Shopify state; a file or Vercel deploy does not establish pixel/container publication.
- [ ] Treat each provider's real readback granularity and finality separately. Do not manufacture event-level reporting evidence from an aggregate report.
- [ ] Test adapter permission failures, timeouts, partial responses and stale snapshots. The static core must still work.

Deliverable: evidence-backed configuration drift and capability results. Gate: every live claim has a successful scoped readback; denied tools remain unavailable rather than bypassed.

### 6. Bind the core to the verified MCP host

- [ ] Inspect the host source, SDK/version, authentication, deployment path and existing registration interface.
- [ ] Define strict inputs/outputs for generic list, inspect, trace, compare/verify, environment and health operations; keep implementation function names and registration names consistent in tests.
- [ ] Add discovery and tools/call integration tests using the actual host and supported transport. Test invalid input, unknown event, partial live evidence and error results.
- [ ] Enforce authorization and allowlisted reads independently of read-only annotations. Do not expose arbitrary SQL, shell execution, unrestricted URL fetching or environment dumps.
- [ ] Verify bounded output, stable ordering, pagination/detail expansion and compatible structured/text responses.

Deliverable: an actual callable MCP surface, not only a JSON inventory or design document. Gate: successful authenticated tool discovery and invocation against the tested host; an HTTP 200 alone does not satisfy this gate.

### 7. Integrate verification into the existing release workflow

- [ ] Run the new tests and relevant existing contract checks on Node 24.x. Run repository typecheck/lint/build where affected; record skipped or blocked checks explicitly.
- [ ] Add drift checks to the existing CI workflow after inspecting that workflow; avoid an independent competing contract generation system.
- [ ] Exercise representative traces: Page View, AddToCart, checkout observation/promotion and an existing naturally occurring Purchase. Do not create a test payment or send synthetic marketing conversions.
- [ ] Review the exact branch diff for unrelated changes before merge/release.
- [ ] Before remote deployment, identify and confirm the destination project/service, authentication boundary and established release mechanism. Do not create a billing-linked project or overwrite the existing gtm-server to host the control plane.
- [ ] After an authorized release, read back the exact deployed revision and run MCP invocation/readback smoke tests. Preserve unknowns for provider reporting not yet observable.

Deliverable: release evidence and an operational handoff that distinguishes implemented, tested, deployed and live-verified.

## Current blockers and limits

- GitHub branch access has been verified. Before this document's creation, the branch was identical to the inspected baseline.
- Cloud Run MCP tool discovery exposes eight operations. A real list_services call was rejected with: FORBIDDEN: This conversation does not support developer MCPs. No Cloud Run service, revision, logging or IAM state has been read. This message does not establish a GCP IAM diagnosis.
- Resource Manager is not part of the continuation path.
- The available execution sandbox cannot resolve github.com for a git clone and currently provides Node 22.16.0, not the repository-required Node 24.x. GitHub connector reads/writes work; a complete executable checkout and compliant verification runtime have not been established in this session.
- The existing MCP host's local/separate source and registration contract are not yet verified.
- No new runtime code, migration, provider write, production deployment or successful runtime test is claimed by this planning commit.

## Documentation references

Project implementation and the supplied inventory define business semantics. External protocol references inform only the MCP integration; they do not prove local deployment:

- https://modelcontextprotocol.io/specification/2025-11-25/server/tools
- https://modelcontextprotocol.io/specification/2025-11-25/schema
- https://modelcontextprotocol.io/specification/2025-06-18/basic/authorization

These are explicitly versioned references, not a claim that the existing host uses those revisions or that they are the latest revision. Verify the actual host and negotiated protocol before binding.
