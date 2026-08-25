# Cursor Cloud instructions for utekos-headless

Cloud Agents clone this GitHub repository onto an isolated Ubuntu VM.
The full local `AGENTS.md` is gitignored and is not present in the clone.
This file is copied to `AGENTS.md` during Cloud install when that file is
missing, so Cloud Agents still get an operating contract.

## Git and release

- Isolation on a Cloud branch/PR is approved for compute offload.
- Do not run `pnpm sync`, `git push` to `main`, `vercel --prod`, GTM
  publish, Shopify catalog/customer mutations, or Supabase schema
  changes from Cloud.
- Do not merge a Cloud PR as the production deploy. Review the PR, then
  land on local `main` and release with `pnpm sync` only after the usual
  gates.
- "Move to Cloud" does not take uncommitted local files.

## Runtime

- Install: `.cursor/cloud-install.sh` via `.cursor/environment.json`
  (Node `24.17.0`, Corepack pnpm `11.17.0`, `pnpm install --frozen-lockfile`).
- Do not assume `next dev` is already running. Start it only when the
  task needs a live app and Storefront secrets are set.
- Verify with `pnpm typecheck` and targeted tests.
- `pnpm build` requires `SHOPIFY_ADMIN_API_TOKEN` because cron routes
  import the Admin client at module load. A missing-secret build failure
  is blocked setup, not a code defect.
- Production Shopify verification remains on `https://utekos.no` after
  the commit is `READY`. Cloud browser/computer-use is not that gate.

## MCP

- HTTP only. See `mcpServerAllowlist` in `.cursor/environment.json`.
- Add those servers in the Cloud Agents MCP dropdown.
- Do not copy laptop `stdio` commands or `mcp-remote`. SSE is unsupported.
- facebook-ads, data-manager, trends, and utekos-microsoft-ads stdio stay
  on the laptop until they exist as HTTP MCP in the Cloud dashboard.
- Never enable write-capable Meta, GTM, or Merchant tools without a
  separate explicit user approval for that Cloud run.

## Secrets

Use the Cloud Agents Secrets tab, not a snapshotted `.env.local`.

- Storefront: `VERCEL_SHOPIFY_STORE_DOMAIN` or `STORE_DOMAIN`, and
  `VERCEL_SHOPIFY_STOREFRONT_ACCESS_TOKEN` or
  `STOREFRONT_API_ACCESS_TOKEN`.
- `pnpm build`: `SHOPIFY_ADMIN_API_TOKEN`.
- HTTP MCP: matching dashboard/OAuth credentials only as needed.
