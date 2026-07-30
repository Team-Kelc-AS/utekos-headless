# Development Environment

This project supports both direct local development and Docker-based development.

## Prerequisites

- Node.js `24.17.0`
- pnpm `11.17.0`
- Docker Desktop or Docker Engine with Compose

Use `.nvmrc` or `.node-version` to align the host Node version.

## Secrets

App runtime secrets belong in `.env.local`.

```bash
vercel env pull .env.local
```

MCP and agent-tool secrets stay separate:

```bash
cp .env.mcp.example .env.mcp.local
npm run mcp:build
npm run mcp:doctor
```

## Direct Local Dev

```bash
pnpm install --frozen-lockfile
pnpm dev
```

`pnpm dev` clears shell-level `DEBUG` and `NEXT_PRIVATE_DEBUG_CACHE` variables before starting Next.js.
Turbopack treats any inherited `DEBUG` value as test/debug mode, and Next's private cache debug flag floods
local render/HMR logs.

## Docker Dev

```bash
npm run docker:dev
```

The dev service:

- runs Next.js on `0.0.0.0:3000`
- bind-mounts the repository into `/app`
- keeps `node_modules`, `.next`, and pnpm store in named Docker volumes
- reruns `pnpm install --frozen-lockfile` only when `package.json` or `pnpm-lock.yaml` changes
- enables polling-based file watching for Docker/devcontainer environments

To rebuild after Dockerfile or dependency changes:

```bash
npm run docker:dev:build
```

To reset all Docker dev volumes:

```bash
npm run docker:reset
```

## Production Container Smoke

Production Docker builds use Next.js standalone output only when `NEXT_OUTPUT_STANDALONE=1` is set inside the
Docker build. `.env.local` is provided to the build as a BuildKit secret, not copied into the image.

```bash
npm run docker:prod:build
npm run docker:prod
```

The production smoke server is exposed on `http://localhost:3001`.

## Optional Local Database

Supabase local development is still managed by the Supabase CLI:

```bash
npm run db:start
npm run db:reset
```
