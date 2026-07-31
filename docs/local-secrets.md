# Local secrets and MCP configuration

This repository generates local MCP client files from committed
templates. Secrets belong in ignored local files and must never
be written to generated or committed configuration.

## Files and precedence

| Layer                    | Path                                   | Committed | Purpose                                                    |
| ------------------------ | -------------------------------------- | --------- | ---------------------------------------------------------- |
| Server source            | `config/mcp/servers.base.json`         | yes       | Canonical server definitions and `${ENV_VAR}` placeholders |
| Credential manifest      | `config/mcp/credentials.manifest.json` | yes       | Credential ownership and optional/required classification  |
| Editor overrides         | `config/mcp/vscode-overrides.json`     | yes       | VS Code-only transport overrides                           |
| MCP secrets              | `.env.mcp.local`                       | no        | Primary MCP credential source                              |
| App secrets              | `.env.local`                           | no        | Next.js runtime values and MCP fallback                    |
| Generated Cursor config  | `mcp.json`                             | no        | Generated output                                           |
| Generated VS Code config | `.vscode/mcp.json`                     | no        | Generated output                                           |
| Cursor link              | `.cursor/mcp.json`                     | no        | Symlink to `mcp.json`                                      |

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
  Sentry MCP. `SENTRY_AUTH_TOKEN` remains separate for
  application/SDK workflows.
- Remote OAuth servers keep OAuth state in the client. Do not
  copy cached tokens into repository files.
- A successful build proves configuration generation only.
  Restart the client and run a safe read tool before reporting a
  provider MCP as usable.

See `config/mcp/README.md` for profiles, tunnel operations and
server-specific doctors.
