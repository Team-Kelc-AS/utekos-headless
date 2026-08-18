# Local secrets and MCP configuration

This repository generates local MCP client files from committed
templates. Secrets belong in ignored local files and must never
be written to generated or committed configuration.

## Files and precedence

| Layer                    | Path                                   | Committed | Purpose                                                    |
| ------------------------ | -------------------------------------- | --------- | ---------------------------------------------------------- |
| Server source            | `config/mcp/servers.base.json`         | yes       | Canonical server definitions and `${ENV_VAR}` placeholders |
| Project autostart profile | `.mcp.json`                            | yes       | Small automatic profile; excludes interactive OAuth bridges |
| Cursor runtime policy    | `config/mcp/cursor-runtime.json`       | yes       | Remote servers excluded from automatic Cursor startup      |
| Credential manifest      | `config/mcp/credentials.manifest.json` | yes       | Credential ownership and optional/required classification  |
| Editor overrides         | `config/mcp/vscode-overrides.json`     | yes       | VS Code-only transport overrides                           |
| MCP secrets              | `.env.mcp.local`                       | no        | Primary MCP credential source                              |
| App secrets              | `.env.local`                           | no        | Next.js runtime values and MCP fallback                    |
| Generated full config    | `mcp.json`                             | no        | Full generated output for explicit/on-demand clients       |
| Cursor runtime profile   | `.cursor/mcp.remote.json`              | no        | Generated remote-only profile; no local stdio fan-out      |
| Generated VS Code config | `.vscode/mcp.json`                     | no        | Generated output                                           |
| Cursor link              | `.cursor/mcp.json`                     | no        | Symlink to `.cursor/mcp.remote.json`                       |

`.env.mcp.local` wins over `.env.local`. Empty fallback values
are ignored. Credential JSON files remain under ignored
`src/api/lib/cloud-credentials/` or the documented agent-artifact
path.

## Setup

```bash
cp .env.mcp.example .env.mcp.local
npm run mcp:build
npm run mcp:doctor
```

Activate the repository runtime first:

```bash
source "$HOME/.nvm/nvm.sh"
nvm use --silent
corepack enable
```

Reload the MCP client after generation.

Cursor uses the remote-only runtime profile by default. This
prevents every editor window from launching the full local stdio
catalog and avoids orphaned subprocess fan-out after agent or
extension-host restarts. The complete generated catalog remains
in `mcp.json` for explicit, on-demand clients and diagnostics.
Remote servers with persistent background failures can be kept
out of automatic startup through `config/mcp/cursor-runtime.json`
without removing them from the full catalog.

The Stape GTM server remains in the canonical source and generated
full catalog, but not in `.mcp.json`. Starting its `mcp-remote` bridge
without a valid session launches an interactive OAuth browser flow, so
it must only be started deliberately. This does not disable the local
service-account-backed `gtm-mcp` server.

## Safety rules

- Never hand-edit `mcp.json`, `.vscode/mcp.json`, or
  `.cursor/mcp.json`.
- Never commit `.env.mcp.local`, `.env.local`, generated MCP
  files, access tokens, OAuth codes, service-account JSON, DSNs
  with credentials, or local identity metadata.
- Keep placeholders in `config/mcp/servers.base.json`; the
  generated runner resolves secret-bearing stdio arguments at
  process start.
- `SENTRY_ACCESS_TOKEN` is the documented token name for the
  Sentry MCP. `SENTRY_ORG_TOKEN` is the optional org-scoped
  companion for org-wide reads. `SENTRY_AUTH_TOKEN` remains
  separate for application/SDK workflows. All three are declared
  in `credentials.manifest.json` under `optionalEnv`, so a
  missing value degrades that server only and never the build.
- Remote OAuth servers keep OAuth state in the client. Do not
  copy cached tokens into repository files.
- Meta token roles:
  - `META_ACCESS_TOKEN` — Pixel CAPI (app runtime `/events`)
  - `META_SYSTEM_USER_TOKEN` — System User reads / dataset
    quality
  - `META_APP_USER_TOKEN` — USER token with `ads_mcp_management`
    for the official Ads MCP
- `facebook-ads` uses `mcp-remote` +
  `Authorization: Bearer ${META_APP_USER_TOKEN}` via
  `run-server.mjs`. Cursor OAuth against Meta is unreliable
  because Meta's DCR rewrites `localhost` → `127.0.0.1` while
  Cursor listens on `http://localhost:8787/callback`.
- `meta-developer-tools` keeps Cursor OAuth with static
  `META_DEVTOOLS_MCP_CLIENT_ID` (Meta's public Cursor client). A
  System User token cannot authorize `/devtools`.
- There is no official hosted Google Data Manager MCP. The local
  `data-manager-mcp` server provides read-only diagnostics and is
  explicitly allowlisted in `config/mcp/cursor-runtime.json`.
- `trends-mcp` uses the local `scripts/mcp/trendsmcp.js` stdio
  wrapper so `TRENDS_MCP_API_KEY` is resolved only when the
  process starts. The wrapper exposes the provider's three
  documented read-only tools and never writes the key to
  generated client files. Each live tool call consumes TrendsMCP
  quota; `npm run mcp:trends:doctor` performs discovery without a
  live API request.
- A successful build proves configuration generation only.
  Restart the client and run a safe read tool before reporting a
  provider MCP as usable.

See `config/mcp/README.md` for profiles, tunnel operations and
server-specific doctors.
