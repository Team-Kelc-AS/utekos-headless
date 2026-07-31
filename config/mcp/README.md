# Docker AI MCP Workspace

## Status

- Docker Desktop Engine: `29.5.3`
- Docker MCP Toolkit CLI: `0.42.2`
- Devcontainer base: Node 24, Debian Bookworm
- Production deployment target: Vercel
- Next.js custom adapter: not used

## Commands

```bash
npm run mcp:build
npm run mcp:doctor
npm run mcp:docker:doctor
npm run mcp:chatgpt:apply
npm run mcp:chatgpt:doctor
npm run mcp:tunnel:check
```

## Docker MCP Profiles

| Profile                     | Purpose                                             | Required State                  |
| --------------------------- | --------------------------------------------------- | ------------------------------- |
| `utekos_core_safe`          | Safe docs, GitHub, code inspection, fetch, Context7 | Required                        |
| `utekos_observability_live` | Sentry and observability tools                      | Required for live incident work |
| `utekos_commerce_live`      | Reserved for commerce catalog servers               | Empty in Docker catalog V1      |
| `utekos_research_browser`   | Browser, Playwright, Firecrawl, Next DevTools       | Optional live-research profile  |

## Client Wiring

- Codex host stdio: user config references
  `docker mcp gateway run --profile utekos_core_safe`.
- Codex Docker Sandbox HTTP: project config uses
  `MCP_DOCKER_CORE_HTTP` at
  `http://host.docker.internal:8812/mcp`.
- Gordon: mapped to `utekos_core_safe` in Docker MCP profile
  config.
- Cursor, Claude Desktop, Gemini, and VS Code can use generated
  `mcp.json` / `.vscode/mcp.json` or Docker Desktop client
  wiring.

### Google Developer Knowledge

`google-developer-knowledge` authenticates only with a restricted
`X-Goog-Api-Key`. Generated client files start the pinned
`mcp-remote@0.1.38` bridge through `scripts/mcp/run-server.mjs`,
which reads the key from `.env.mcp.local` at runtime. The
generated files must never contain the key. Do not add Google
credential auth or a quota-project header to this server.

Context7 is an optional documentation fallback and may be
supplied by the installed connector instead of a local API key.

## Shadcn Access

Use two complementary MCP surfaces for local clients, and one
combined ChatGPT workbench profile:

- `shadcn`: official registry MCP via `npx -y shadcn@latest mcp`.
  Use this for current registry docs, search, examples, audit
  checklist, and install command generation.
- `utekos-shadcn-context`: local read-only Utekos workbench via
  `node scripts/mcp/utekos-shadcn-context-server.mjs`. Use this
  for `scripts/shadcn/academy/*`, `components.json`,
  `src/globals.css`, `src/components/ui/*`, scoped Utekos
  card-production sources, and namespaced proxy calls to the
  official shadcn MCP.
- `utekos_chatgpt_shadcn`: ChatGPT tunnel profile that exposes
  `utekos-shadcn-context` as a single app surface. Use it when
  ChatGPT needs both local Utekos shadcn context and live
  official registry operations.

Run:

```bash
npm run mcp:shadcn-context:doctor
npm run mcp:build
npm run mcp:doctor
```

The local context server exposes:

- `shadcn_context_bootstrap`
- `shadcn_source_inventory`
- `read_shadcn_sources`
- `search_shadcn_sources`
- `shadcn_registry_get_project_registries`
- `shadcn_registry_list_items`
- `shadcn_registry_search_items`
- `shadcn_registry_view_items`
- `shadcn_registry_get_examples`
- `shadcn_registry_get_add_command`
- `shadcn_registry_get_audit_checklist`

Required workflow for UI/shadcn work:

1. Call `shadcn_context_bootstrap`.
2. Call `shadcn_source_inventory`.
3. Read `components.json`, `src/globals.css`, relevant
   `scripts/shadcn/academy/*` docs, exact `src/components/ui/*`
   files, and affected Utekos wrapper files such as
   `src/components/cards/utekos-card.tsx` /
   `src/app/inspirasjon/cardproduction/cards/CardShowCase.tsx`
   before editing.
4. Use `shadcn_registry_*` tools, the official `shadcn` MCP, or
   `npx shadcn@latest docs <component>` for current component/API
   details.
5. Mutate files only through normal code-edit tooling;
   `utekos-shadcn-context` is read-only.

## Sandbox Gateway

Start only when using Docker Sandbox Codex:

```bash
MCP_GATEWAY_AUTH_TOKEN=<local-runtime-token> \
  docker mcp gateway run --profile utekos_core_safe --transport streaming --port 8812
```

The same `MCP_GATEWAY_AUTH_TOKEN` must be available to Codex
inside the sandbox session.

## OpenAI Secure MCP Tunnel

Use this when ChatGPT, Codex, the Responses API, or another
supported OpenAI surface must reach the local Docker MCP gateway
without exposing it publicly.

## ChatGPT Agent Insight Fabric

Declarative profile source:

```bash
config/mcp/chatgpt-profiles.json
```

Apply Docker MCP profiles:

```bash
npm run mcp:chatgpt:apply
npm run mcp:chatgpt:doctor
```

The applier manages only profiles whose id starts with
`utekos_chatgpt_`. It also disables Docker MCP `dynamic-tools`,
because those tools expose profile mutation and execution tools
in otherwise safe ChatGPT profiles.

| Profile                            | ChatGPT App              | Mode                                              |
| ---------------------------------- | ------------------------ | ------------------------------------------------- |
| `utekos_chatgpt_insight`           | Utekos Local Insight     | Default read/verify; no write tools               |
| `utekos_chatgpt_browser`           | Utekos Browser Workbench | Runtime, DOM, console, network, screenshot        |
| `utekos_chatgpt_live_ops`          | Utekos Live Ops          | Explicit write mode only                          |
| `utekos_chatgpt_commerce_tracking` | Utekos Commerce/Tracking | Live diagnostics where Docker catalog supports it |
| `utekos_chatgpt_shopify_readonly`  | Utekos Shopify Read Only | Bounded orders and protected customer reads       |
| `utekos_chatgpt_codex_bridge`      | Utekos Codex Bridge      | Read analysis + isolated local implementation     |

Run target-specific tunnel profiles:

```bash
npm run mcp:insight:doctor
npm run mcp:tunnel:init:insight
npm run mcp:tunnel:doctor:insight
npm run mcp:tunnel:run:insight
npm run mcp:tunnel:start:insight
npm run mcp:tunnel:status:insight
npm run mcp:chatgpt:accept:insight
npm run mcp:tunnel:stop:insight
```

Other active targets: `browser`, `shadcn`, `live-ops`,
`shopify-readonly`, `codex-bridge`.

`utekos_chatgpt_insight` uses the local canonical server:

```bash
node scripts/mcp/utekos-insight-server.mjs
```

This is intentional. ChatGPT should see seven schema-bound
read-only tools:

- `insight_bootstrap`
- `read_context_bundle`
- `tool_inventory`
- `connector_surface_audit`
- `safe_git_overview`
- `project_locate`
- `read_project_files`

It should not call Docker MCP admin tools such as `mcp-find`,
`mcp-add`, `mcp-activate-profile`, or `mcp-exec` in the default
insight app. If ChatGPT still sees those tools, Docker catalog
tools, or "OutputSchema anbefales" warnings in default Insight,
call `connector_surface_audit`, then recreate or reconnect the
ChatGPT app while `npm run mcp:tunnel:start:insight` is running
so the connector discovers the canonical Utekos tool surface.

Do not ask ChatGPT to activate `utekos_chatgpt_insight` with
`mcp-activate-profile`. The profile is already selected by the
tunnel-client command. If ChatGPT tries `mcp-activate-profile` or
`mcp-find`, it is using stale connector metadata from an older
Docker MCP surface. Restarting `tunnel-client` is not enough by
itself; refresh or recreate the ChatGPT app so tool discovery
runs against `node scripts/mcp/utekos-insight-server.mjs`.

Point-1 acceptance requires local evidence from the tunnel log,
not only a ChatGPT prose answer:

```bash
npm run mcp:tunnel:stop:insight
npm run mcp:tunnel:start:insight
npm run mcp:chatgpt:accept:insight:watch
```

The first acceptance run should normally report
`RESULT ready_pending_chatgpt_call` until ChatGPT has called the
canonical tools. The watch command keeps polling the current
tunnel log while you complete the ChatGPT-side step. In ChatGPT,
select the Utekos Local Insight app and ask exactly:

```text
Call insight_bootstrap and connector_surface_audit. Return structuredContent.profile, structuredContent.mode, and the tool names you used. Do not call mcp-* tools.
```

Then rerun:

```bash
npm run mcp:chatgpt:accept:insight
```

`RESULT accepted` means the latest tunnel run is healthy, targets
`scripts/mcp/utekos-insight-server.mjs`, local doctors pass, no
stale `mcp-*` tool calls were observed, and the tunnel log
contains canonical `insight_bootstrap` plus
`connector_surface_audit` tool-call events.

Each acceptance run writes ignored status artifacts for
handoff/debugging:

- `.agent-artifacts/chatgpt/insight-acceptance.json`
- `.agent-artifacts/chatgpt/insight-acceptance.md`

`utekos_chatgpt_browser` uses the local canonical Browser
Workbench server:

```bash
npm run mcp:browser:doctor
npm run mcp:tunnel:init:browser
npm run mcp:tunnel:doctor:browser
npm run mcp:tunnel:run:browser
npm run mcp:tunnel:stop:browser
```

It exposes schema-bound tools for navigation, viewport resize,
ARIA/DOM snapshot, console logs, network request summaries,
screenshot artifacts, axe-core accessibility audit, local browser
performance timing, and Chrome DevTools Protocol metrics.
Screenshot artifacts are written under
`.agent-artifacts/browser/`.

Known V1 gap: Docker MCP catalog currently does not provide the
repo's direct Shopify, Merchant, GA4, GTM, Meta, Microsoft,
PostHog, or Vercel servers as Docker profile entries. Use native
ChatGPT connectors, generated direct MCP clients, or a future
Utekos bridge server for those live-provider surfaces. External
Google PageSpeed remains public-URL oriented; localhost
performance verification is handled by
`browser_performance_audit`.

## Official Google Analytics MCP

`google-analytics` uses Google's official experimental read-only
server from `googleanalytics/google-analytics-mcp`. The source
template launches the persistent `analytics-mcp` CLI installed
and pinned to PyPI package `analytics-mcp==0.6.0` through `pipx`.
It replaces the previous third-party `mcp-google-analytics`
server and does not expose Measurement Protocol write tools.

Credentials are isolated through:

```dotenv
GOOGLE_ANALYTICS_APPLICATION_CREDENTIALS=src/api/lib/cloud-credentials/tag-manager-credentials.json
GOOGLE_PROJECT_ID=project-c683eb2c-20ae-4ec2-ac3
```

The credential path is mapped to the official server's required
`GOOGLE_APPLICATION_CREDENTIALS` environment variable only for
this server. Verify package version, MCP handshake, all nine
tools, account access, property `489598217`, and a live seven-day
event report with:

```bash
npm run mcp:google-analytics:doctor
```

### Private ChatGPT app and dedicated tunnel

`utekos_chatgpt_google_analytics` is the tool-only private
ChatGPT surface for the same official server. The local proxy
preserves the official nine-tool catalog and adds the output
schemas, structured content, and
read-only/destructive/idempotent/open-world annotations required
by ChatGPT. It adds no Analytics mutation tools.

```bash
npm run mcp:google-analytics:chatgpt:doctor
npm run mcp:tunnel:init:google-analytics
npm run mcp:tunnel:doctor:google-analytics
npm run mcp:tunnel:start:google-analytics
npm run mcp:tunnel:status:google-analytics
```

The private app name is `Utekos Google Analytics`. Its dedicated
tunnel target is `google-analytics`; the real tunnel id belongs
only in ignored `.env.tunnel.local`. Create or refresh the app in
ChatGPT Developer Mode while the tunnel status reports
`healthz=ok` and `readyz=ok`.

## Official Google Ads MCP authentication

The official `googleads/google-ads-mcp` server uses Google
Application Default Credentials with the `adwords` scope. It does
not require a standalone `GOOGLE_ADS_REFRESH_TOKEN` environment
variable. Create an isolated authorized-user ADC file with the
existing dedicated OAuth client by running:

```bash
npm run mcp:google-ads:login
```

The browser consent grants `adwords` and `cloud-platform`. The
command stores the resulting refresh token inside the ignored,
mode-0600 file
`.agent-artifacts/google-ads-adc/application_default_credentials.json`
and never prints it. `google-ads-mcp` receives that path through
`GOOGLE_ADS_APPLICATION_CREDENTIALS` mapped to
`GOOGLE_APPLICATION_CREDENTIALS`. Keep the developer token and
account ids in `.env.mcp.local`; do not copy the refresh token
into chat, documentation, generated MCP JSON, or a tracked env
file.

**Historical — removed:** `utekos_chatgpt_commerce_tracking` used
the local canonical Commerce/Tracking server. The commands below
are retained for audit value and are not active runbooks:

```bash
npm run mcp:commerce-tracking:doctor
npm run mcp:tunnel:init:commerce-tracking
npm run mcp:tunnel:doctor:commerce-tracking
npm run mcp:tunnel:run:commerce-tracking
npm run mcp:tunnel:stop:commerce-tracking
```

It exposed 28 canonical read-only tools, including schema-bound
provider probes for provider credential readiness, provider
access remediation, Shopify Admin catalog reads, Shopify
Storefront product/variant/SKU reads, GA4 event-status reads,
Merchant Center status reads, Google Ads account access, Google
Ads campaign performance, Google Ads conversion action, Google
Ads search-term reads, PostHog project discovery reads, PostHog
HogQL event reads, Sentry issue reads, Vercel deployment reads,
public sGTM/GTM endpoint reads, authenticated GTM API workspace
reads, Meta Dataset Quality reads, public Microsoft UET endpoint
reads, Microsoft Advertising auth/account/campaign/Ad Insight
status reads, Microsoft Shopping Content status reads, Microsoft
Clarity Ads readiness reads, tracking architecture inventory,
canonical event contracts, and local docs/source routing. It
never returns secret values and does not mutate Shopify, GTM, ads
platforms, Vercel, Supabase, PostHog, or Sentry.

`utekos_chatgpt_shopify_readonly` is a separate, explicitly
selected app with its own Secure MCP Tunnel:

```bash
npm run mcp:shopify-readonly:doctor
npm run mcp:tunnel:init:shopify-readonly
npm run mcp:tunnel:doctor:shopify-readonly
npm run mcp:tunnel:start:shopify-readonly
npm run mcp:tunnel:status:shopify-readonly
npm run mcp:tunnel:stop:shopify-readonly
```

The app exposes only four tools: bootstrap, access-scope status,
bounded order reads, and bounded customer search. It does not
expose GraphQL mutation passthrough, catalog writes, bulk
exports, arbitrary GraphQL, or the existing broad
`SHOPIFY_ADMIN_API_TOKEN`. Configure a dedicated Shopify Dev
Dashboard app in `.env.mcp.local`:

```dotenv
SHOPIFY_CHATGPT_STORE_DOMAIN=your-store.myshopify.com
SHOPIFY_CHATGPT_CLIENT_ID=
SHOPIFY_CHATGPT_CLIENT_SECRET=
SHOPIFY_CHATGPT_API_VERSION=2026-04
```

Request only `read_orders`, `read_all_orders`, and
`read_customers`. `read_all_orders` extends order access beyond
the default 60-day window and accompanies `read_orders`;
`read_customers` is protected customer data. Customer name,
email, and phone are excluded by default. Contact fields require
`include_contact=true` plus one declared purpose:
`customer_service`, `order_support`, or `account_verification`.

After the tunnel is healthy and the ChatGPT custom app has been
created with **No Authentication**, select
`Utekos Shopify Read Only` and smoke-test with:

```text
Call shopify_readonly_bootstrap and shopify_access_scope_status. Return the three required scope statuses.
Do not query orders or customers yet.
```

Then test a non-contact customer lookup:

```text
Search for customer id 0 with a maximum of one result. Do not include contact data.
```

`utekos_chatgpt_codex_bridge` is a private, controlled
ChatGPT-to-Codex bridge with its own Secure MCP Tunnel. It wraps
the official local `codex mcp-server` instead of exposing its raw
`codex` and `codex-reply` tools directly. Read analysis stays
read-only. Explicit implementation requests run in a new isolated
Git worktree and `codex/...` branch:

```bash
npm run mcp:codex-bridge:doctor
npm run mcp:codex-bridge:doctor:live
npm run mcp:codex-bridge:doctor:live-write
npm run mcp:tunnel:init:codex-bridge
npm run mcp:tunnel:doctor:codex-bridge
npm run mcp:tunnel:start:codex-bridge
npm run mcp:tunnel:status:codex-bridge
npm run mcp:chatgpt:accept:codex-bridge:watch
npm run mcp:tunnel:stop:codex-bridge
```

The app exposes seven tools:

- `codex_bridge_bootstrap`: returns the fixed bridge policy and
  upstream capability status.
- `ask_utekos_codex`: starts a dedicated read-only Codex thread
  job for a new question and returns immediately with a `job_id`.
- `implement_utekos_change`: creates an isolated `.worktrees/`
  checkout and `codex/chatgpt-...` branch from `origin/main`,
  then lets Codex edit and verify only that checkout. Pass a
  completed write `thread_id` to continue in the same worktree.
- `deliver_utekos_change`: after a completed write job, runs Git
  integrity checks and creates a local commit. It can non-force
  push only the new `codex/chatgpt-*` branch to `origin` when the
  call sets `push_to_origin=true` and supplies the exact
  `CONFIRM_PUSH_TO_ORIGIN` confirmation token.
- `continue_utekos_codex`: continues that thread using the
  returned read-only `thread_id` and returns a new `job_id`.
- `get_utekos_codex_result`: polls an asynchronous Codex job
  without exceeding the ChatGPT tunnel response deadline.
- `codex_bridge_status`: verifies the local Codex runtime and
  bridge connection.

The wrapper fixes the repository root and
`approval-policy=never`. Read jobs use `sandbox=read-only`. Write
jobs use `sandbox=workspace-write`, but their writable root is
the bridge-created worktree, never the dirty main checkout.
ChatGPT cannot override the model configuration, working
directory, sandbox, approval policy, or developer instructions.
Requests to retrieve or reveal `.env` values, credentials, API
keys, tokens, passwords, or private keys are denied before Codex
is called.

All internal Codex jobs have a fixed 15-minute total timeout. The
bridge pins `gpt-5.6-sol`, high reasoning, high verbosity, a
1,050,000-token context window, and automatic compaction at
900,000 tokens. ChatGPT receives `queued` or `running` promptly
and polls `get_utekos_codex_result`, so a long Codex turn does
not hold the tunnel request open.

The agent can use built-in web search with high search context
for current official documentation. Shell subprocesses inherit
only the core environment, keep default secret-variable
exclusions, and have workspace-write network access disabled.
Package installs or other shell operations that require network
access therefore fail closed.

The implementation lane never writes directly to `main`. Codex
must run relevant verification and returns the branch, worktree
path, changed files, `git status`, and diff summary for review.
Delivery is a separate explicit tool intent: it may commit and
non-force push the new branch, but never force-pushes, merges,
deploys, publishes GTM, mutates schemas, changes providers, or
performs other external writes.

After the tunnel is healthy, create the ChatGPT app using the
dedicated tunnel id and **No Authentication**. Select
`Utekos Codex Bridge` and ask:

```text
Call codex_bridge_bootstrap. Then call implement_utekos_change with:
"Create CODEX_BRIDGE_CHATGPT_ACCEPTANCE.md in the repository root with exactly one line:
ChatGPT to Codex isolated write accepted. Verify the file content and git status.
Do not change any other file."
Poll get_utekos_codex_result with the returned job_id until status is completed.
Then call deliver_utekos_change with that thread_id, commit_message
"test: verify ChatGPT Codex Bridge delivery", verification_confirmation
CONFIRM_VERIFICATION_PASSED, and push_to_origin false.
Return thread_id, branch, worktree_path, changed_files, git_status, diff_stat,
commit_sha, pushed, and the Codex summary. Do not push, merge, deploy, publish
GTM, or mutate an external provider.
```

To request a local change from ChatGPT:

```text
Use Utekos Codex Bridge. Call implement_utekos_change with the complete
implementation request and acceptance criteria. Poll
get_utekos_codex_result with the returned job_id until completed. Report
the branch, worktree_path, changed_files, git_status, diff_stat, Codex
summary, verification performed, and blocked verification. If the user also
explicitly requested commit and push, call deliver_utekos_change with a concise
commit_message, verification_confirmation CONFIRM_VERIFICATION_PASSED,
push_to_origin true, and push_confirmation CONFIRM_PUSH_TO_ORIGIN. Report
commit_sha and remote_ref. Never merge, deploy, publish GTM, force-push, or
mutate external providers.
```

Run `npm run mcp:chatgpt:accept:codex-bridge` after the ChatGPT
call. `RESULT accepted` proves that the tunnel targeted the
canonical wrapper and that ChatGPT called bootstrap, the Codex
implementation tool, and the asynchronous result tool. The
acceptance worktree remains available for inspection until it is
removed deliberately.

Provider status is env-dependent. Treat the current workspace
doctor output as authoritative. The status below is the last full
local-provider baseline from the configured main environment;
isolated worktrees can fail closed until the same ignored env and
credential paths are available:

- Shopify Admin catalog probe: live query OK.
- Shopify Storefront probe: live query OK.
- Public sGTM/GTM endpoint probe: live endpoint checks OK for
  `healthz`, `gtm.js`, `ns.html`, and canonical Google tag
  destination.
- Public Microsoft UET endpoint probe: live endpoint checks OK
  for `bat.js` and configured action loader.
- Provider access remediation report: implemented and read-only;
  use it after `provider_env_readiness` for exact
  provider-by-provider fix steps.
- GA4 probe: live query OK. The separate official Google
  Analytics MCP also verifies account summary, property details,
  and report reads.
- Merchant Center probe: implemented, currently returns
  structured partial API/access failure.
- Google Ads probes: implemented for accessible customer
  resources, campaign performance, conversion actions, and search
  terms; currently require `GOOGLE_ADS_CUSTOMER_ID`,
  `GOOGLE_ADS_DEVELOPER_TOKEN`, optional
  `GOOGLE_ADS_LOGIN_CUSTOMER_ID`, and `GOOGLE_ADS_ACCESS_TOKEN`,
  `GOOGLE_ADS_OAUTH_ACCESS_TOKEN`, or read-capable Google Ads
  service-account credentials.
- PostHog project discovery probe: implemented, currently
  requires `POSTHOG_ORGANIZATION_ID` plus
  `POSTHOG_PERSONAL_API_KEY` or `POSTHOG_CUSTOM_API_KEY`.
- PostHog event-status probe: implemented, currently requires
  `POSTHOG_PROJECT_ID` plus `POSTHOG_PERSONAL_API_KEY` or
  `POSTHOG_CUSTOM_API_KEY`.
- Sentry probe: implemented, currently returns permission/scope
  failure for the configured token.
- Vercel probe: implemented, currently requires `VERCEL_TOKEN`
  and `VERCEL_PROJECT_ID`.
- Meta Dataset Quality probe: implemented, currently returns
  `Malformed access token` for the configured token.
- Authenticated GTM API workspace probe: implemented, currently
  requires `GTM_ACCESS_TOKEN` or
  `GOOGLE_TAG_MANAGER_ACCESS_TOKEN` plus numeric `GTM_ACCOUNT_ID`
  and `GTM_CONTAINER_ID`.

Operational note: most generated or provider-specific
`scripts/mcp/*` files and `docs/CODEX.md` are intentionally local
operational files ignored by git. The canonical ChatGPT Insight
server, Insight doctor, OpenAI tunnel runner, ChatGPT profile
doctor/apply scripts, and Insight acceptance script are versioned
because tracked package scripts and ChatGPT profiles depend on
them.

Local setup:

```bash
npm run mcp:tunnel:bootstrap-env
```

Then fill `.env.tunnel.local`:

- `CONTROL_PLANE_TUNNEL_ID`: from OpenAI Platform tunnel
  settings.
- `CONTROL_PLANE_API_KEY`: runtime API key with Tunnels Read +
  Use.
- `MCP_GATEWAY_AUTH_TOKEN`: generated locally by `bootstrap-env`;
  keep it private.

Initialize the tunnel-client profile after `.env.tunnel.local` is
filled:

```bash
npm run mcp:tunnel:init
```

Start the insight tunnel for ChatGPT connector work:

```bash
npm run mcp:tunnel:start:insight
npm run mcp:tunnel:status:insight
```

The dedicated `source-insight` target is a separate
least-privilege, read-only ChatGPT surface for implementation
discovery. It exposes only:

- `src/`
- `supabase/`, except `supabase/md.md`
- `next.config.mts`
- `package.json`
- `vercel.json`
- `global.d.ts`

Environment files and `src/api/lib/cloud-credentials/` remain
denied. The canonical tools are `source_access_bootstrap`,
`source_file_inventory`, `search_source_files`, and
`read_source_files`; no write, shell, Git mutation, network,
database, or provider tool is exposed.

```bash
npm run mcp:source-insight:doctor
npm run mcp:tunnel:init:source-insight
npm run mcp:tunnel:doctor:source-insight
npm run mcp:tunnel:start:source-insight
npm run mcp:tunnel:status:source-insight
```

Set the dedicated local values in the ignored `.env.tunnel.local`
using the `*_SOURCE_INSIGHT` names documented in
`.env.tunnel.example`. Reuse the local runtime project key from
`.env.local` through the profile's `runtimeApiKeyEnv`; never use
the OpenAI admin key as tunnel runtime auth. Assign the dedicated
tunnel ID to `CONTROL_PLANE_TUNNEL_ID_SOURCE_INSIGHT`.

The active insight and browser tunnel profiles use stdio and let
`tunnel-client` start local Utekos canonical MCP servers
directly. The live-ops target still uses Docker MCP gateway
profiles unless replaced by a future Utekos bridge server. The
older HTTP/proxy path is still available for debugging, but it is
not the recommended ChatGPT connector path.

For local development, run `tunnel-client` on the host beside
Docker Desktop. Prefer `npm run mcp:tunnel:start:<target>` for
ChatGPT connector work; it starts the profile as a local daemon,
writes logs under `.agent-artifacts/tunnel/`, and lets
`npm run mcp:tunnel:status:<target>` verify `/healthz` and
`/readyz`. Use `npm run mcp:tunnel:run:<target>` only when you
deliberately want a foreground process. Moving it into Docker is
only useful for a long-lived deployment where a container can
reliably reach the private MCP server and store the runtime key
outside the image.

## Secret Rules

- Do not commit `mcp.json`, `.vscode/mcp.json`,
  `.cursor/mcp.json`, `.env.mcp.local`, `.env.local`, or
  `src/api/lib/cloud-credentials/`.
- Do not commit `.env.tunnel.local` or OpenAI runtime/admin API
  keys.
- Do not use `docker mcp client ls` in ordinary logs; it can
  expose client config details.
- Generated MCP stdio servers with secret placeholders run
  through `scripts/mcp/run-server.mjs`, which resolves local env
  at runtime.
- `npm run mcp:doctor` fails if generated MCP configs contain
  known inline secret values.
- See `docs/local-secrets.md` for credential layering.

## Remaining Manual Gates

- Rotate any API tokens that were exposed in previous local
  terminal/client output.
- Firecrawl key has been rotated and set in Docker MCP secret
  storage.
- If Firecrawl is rotated again, set the new key:

```bash
docker mcp secret set firecrawl.api_key
```

- Fill or intentionally leave empty `GTM_CLIENT_SECRET`;
  `npm run mcp:doctor` reports it as an optional warning.

## Verification Notes

- `npm run mcp:docker:doctor` should pass with only the sandbox
  gateway warning when port `8812` is intentionally stopped.
- `utekos_commerce_live` currently reports internal gateway tools
  only because Docker's catalog does not provide the required
  Shopify/Merchant/GA/GTM/Meta split used by this repo.
