# Canonical Event Control Plane — Stape cutover delta

Date: 2026-09-17.
Parent plan: `2026-09-16-canonical-event-control-plane.md` in this directory.
Status: additive planning/evidence update, not an implementation or release claim.
Code owner remains `utekos-platform-tools`; event definitions and storefront runtime remain owned by `utekos-headless`.

## 1. Changed operating requirement

The operator reports that Stape has replaced the GCP-hosted sGTM upstream in production. The active hosting label is exactly `EU North (Netherlands)`; the supplied domains are `edge.utekos.no` and `load.edge.utekos.no`.

This delta supersedes GCP/Cloud Run as the current sGTM route in the earlier plan. It does not authorize deleting Cloud Run resources, removing Cloud Run MCP for unrelated uses, changing provider delivery ownership, or installing Stape power-ups. Historical GCP observations remain historical evidence.

Stape is the sGTM hosting/configuration evidence source, not a newly invented CanonicalEvent destination. Do not add `stape` to the business-event provider registry or build a second event pipeline.

## 2. Freshly verified evidence

### Repository and deployment

- GitHub `main`: `884848efbf96c5ad40f2dea801acdb636a8215f2` — `Route server GTM through Stape`.
- Vercel production alias lookup for `utekos.no`: deployment `dpl_Fgq332aZqiqS5D72EKqqrwx3KbTc`, state `READY`, target `production`, matching GitHub SHA above.
- The returned aliases include `utekos.no`, `www.utekos.no` and `feed.utekos.no`.
- Deployment readiness timestamp: `2026-09-17T19:39:15.835Z`. This is not evidence of the exact instant of production traffic cutover.

### Source files read at the pinned production SHA

| Source | Verified content |
| --- | --- |
| `src/lib/analytics/serverGtmGateway/buildServerGtmUpstreamUrl.ts` | `SERVER_GTM_ORIGIN` is `https://edge.utekos.no`; path validation and query forwarding remain in this function. |
| `src/lib/analytics/serverGtmGateway/proxyServerGtmRequest.ts` | Gateway calls that URL builder, uses `cache: no-store` and `redirect: manual`, and preserves failure no-store headers. |
| `src/components/analytics/stapeCustomLoader.ts` | The actual browser loader URL uses `https://utekos.no/__sgtm/apgqnrnczg.js` plus the existing configured query; it is not a direct `load.edge.utekos.no` request in this source. |
| `src/components/analytics/GoogleTagManagerLoader.tsx` | Consent-default script precedes Stape Custom Loader in the component. Both are declared `beforeInteractive`. |
| `src/components/analytics/GoogleTagManagerNoScript.tsx` | Fallback iframe uses `https://edge.utekos.no/ns.html?id=GTM-5TWMJQFP`. |

The exact role and account configuration of `load.edge.utekos.no` is operator-reported, not independently established by these files. An indexed repository search for that hostname returned no results; search absence is not proof of absence from all configuration. Preserve the domain and its reported role without inventing an observed browser hop or marking it broken.

### New production health observation

A Vercel connector GET to `https://utekos.no/__sgtm/healthy` returned:

```json
{
  "status": 200,
  "body": "ok",
  "cache-control": "no-store, max-age=0",
  "cdn-cache-control": "no-store",
  "x-vercel-cache": "MISS",
  "x-matched-path": "/api/tracking/server-gtm/[[...path]]",
  "response_date": "2026-09-17T20:21:20Z"
}
```

This proves this gateway health response. It does not prove event acceptance, container/tag publication, checkout consent, provider reporting or attribution.

A Vercel Runtime Logs count query, scoped to the production deployment above, `since=2026-09-17T19:39:15.835Z`, `statusCode=5xx`, `query=__sgtm`, grouped by `requestPath`, returned no matching groups. The end of the query window was the tool's default `now`. Treat this as no matches in the requested log query, not a guarantee about all traffic, unlogged requests or older deployments.

### Operator-reported evidence not rerun in this continuation

The user supplied successful browser checks on `/` and `/skreddersy-varmen`, one Custom Loader request, one `gtm.start`, consent defaults first, one Cookiebot `uc.js` with `implementation=gtm`, no legacy loader request, working service-worker resources, GET/POST collect checks, 25 targeted tests, type generation, typecheck, build and release/log checks.

Keep these as operator-reported results. Do not relabel them as this assistant's executed tests. No synthetic conversion was sent in this continuation.

## 3. Required Control Plane behavior

1. Resolve the source route from the configured source checkout and attach its SHA/hash. Source reads at the old `ff6306d...` revision must remain visibly old; do not present them as the current Stape deployment.
2. Keep the stable logical sGTM path separate from hosting: browser/dataLayer, first-party gateway, Stape-hosted server container, tag execution, provider response. Do not add a mandatory queue stage to a browser/sGTM route.
3. Keep direct canonical provider outboxes separate from GTM-hosted delivery. The hosting cutover alone does not move Meta, Microsoft, Pinterest or Snapchat delivery into Stape.
4. Model `edge.utekos.no` as source-declared upstream with matching deployed-source evidence. Model the Custom Loader's first-party path separately. Preserve `load.edge.utekos.no` and `EU North (Netherlands)` with operator-report provenance until actual Stape configuration is read.
5. Classify GCP-hosted sGTM references as historical/retired from this route, not unhealthy required dependencies. GCP/Cloud Run availability must not gate Stape sGTM readiness. Resource deletion is not verified or required here.
6. Keep hosting configuration, published GTM container state, ingress receipt, tag execution, provider acceptance and provider reporting as separate evidence dimensions. HTTP 200, `READY` and a successful MCP call do not collapse these dimensions.
7. Reuse the existing ledger, source evidence, provider attempts and appropriate observation stores. Do not introduce Stape Store as another purchase ledger or a copied parameter/provider catalog.
8. Preserve provider-neutral observation names such as `sgtm_ingress`; attach hosting identity to evidence rather than renaming event contracts or migrating tables solely for this cutover.
9. Correlate live evidence by the actual supported event/environment/deployment keys. Old receipts cannot be labeled Stape receipts solely because Stape is current now. Exact traffic cutover time remains unknown unless a reliable source supplies it.
10. Public health checks may use the validated read-only route. Do not probe `/g/collect` with synthetic marketing events or activate browser tracking merely to make a health indicator green.

## 4. Live Stape connector boundary

The official Stape documentation describes an account-authenticated MCP connection and distinct Stape Global/EU account environments. Stape EU requires `X-Stape-Region: EU`. The hosting label `EU North (Netherlands)` alone does not establish the account/API environment; inspect the existing authorized configuration before selecting it.

Discover real tools and their input schemas before binding a live adapter. Expose allowlisted read operations only; the provider's MCP also advertises mutation capabilities. Keep missing access, unsupported capability, not queried, query failure, partial results and empty in-window results distinct. Do not assume a configuration-listing tool also supplies logs or provider receipts.

No callable Stape integration was resolved in this conversation's plugin-directory search. No Stape account configuration or API credentials were read. Optional live Stape reads must not prevent source-index or already-authorized warehouse inspection from working.

The Stape Node.js SDK documented in the supplied link is an event-sending integration to Data Client. It is not required merely to inspect Stape-hosted sGTM. Do not install it as an observability shortcut.

## 5. Case-study use and explicit non-goals

The attached Sengesnedkeren/Obsidian Digital case describes consent and click-identity continuity across headless storefront and Shopify, product identifier alignment and verification through server-side receipts. Use those topics as trace/coverage acceptance criteria, not as evidence that Utekos has the same failures.

That case uses `orders/create`, a Stape Store ledger and a 15-minute Request Delay for its draft-order flow. Do not transplant that architecture into Utekos's existing paid-order canonical semantics and deduplication model. Do not change the paid-order source, add a second purchase ledger, configure a delay, activate Cookie Keeper, change consent behavior, or install tags/apps as part of this increment. All optional Stape features are explicitly deferred by the user.

## 6. Resume sequence and acceptance tests

- [ ] Read the current local diff and final trace-test log before changing code. The previous continuation had 11 passing database tests, but the last MCP integration/test process had not been read back. Do not infer completion or restart/kill a process solely by its old PID.
- [ ] Preserve both original checkouts and all uncommitted trace work. Inspect the local and remote plan-branch commits before merging; the earlier local plan commit `18e7db071e3ae6c303e144b7de74ccfe16d1b041` was not present on the remote branch when this delta was added. No force-push, reset or blind overwrite.
- [ ] Update the isolated source baseline to include the inspected Stape production commit without losing the local plan additions; rerun source-index and contract checks. Do not silently continue validating only the old GCP baseline.
- [ ] Complete `canonical_event_trace` and its real-database and MCP tests. Preserve exact event-name/ID/environment/window joins, separate consent snapshots, read-only transactions, deadlines, result limits and safe projections.
- [ ] Add topology tests: old source revision remains GCP-historical; new source revision resolves Stape; old Cloud Run health cannot mark Stape healthy or unhealthy; loader first-party route is distinct from configured hosting domains.
- [ ] Add provenance tests: operator-reported region/domain versus source/deployment observations; mixed revisions cannot produce current-health success; a health response cannot create provider acceptance or reporting evidence.
- [ ] Add capability tests: missing Stape access leaves static inventory usable; unadvertised logs/metrics reads remain unsupported; account environment is not inferred from hosting location; read tools cannot activate tags, create stores or replay events.
- [ ] Run all source-index, warehouse, actual MCP discovery/call, doctor and syntax checks. Record the exact tested commits and whether results use synthetic/local or live evidence.
- [ ] Only after verification, prepare local commits and the established review/activation path. Restarting a live tunnel/profile, production publishing or deployment is not implied by this documentation change.

## 7. Execution boundary in this continuation

Remote Desktop Commander lists `Kristoffers-MacBook-Air.local` as offline and ping reports no available device; last seen `2026-09-17T17:55:50.661Z`. A real Desktop Commander MCP `get_config` call was rejected with `FORBIDDEN: This conversation does not support developer MCPs`. These are local-access limitations, not Stape or GCP-IAM failures.

GitHub and Vercel reads succeeded. This delta adds only this new document on the existing planning branch. It does not alter runtime code, the local worktrees, production configuration, Stape features or the supplied case study. Runtime completion and the final trace-test outcome remain unverified.

## References

- Pinned Utekos source: https://github.com/Team-Kelc-AS/utekos-headless/tree/884848efbf96c5ad40f2dea801acdb636a8215f2
- Official Stape MCP setup: https://stape.io/helpdesk/documentation/how-to-set-up-stape-mcp-server
- Official Stape MCP scope: https://stape.io/solutions/stape-mcp-server
- Official Stape Node.js SDK: https://stape.io/helpdesk/documentation/stape-node-js-sdk
- Attached case study: `case_studie.md`, published 2026-09-10; operational details belong to Sengesnedkeren, not Utekos.
