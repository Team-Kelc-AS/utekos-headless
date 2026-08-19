# Utekos Headless

Headless Shopify storefront and telemetry runtime for Utekos, built with
Next.js.

Operator- and agent-specific instructions, plans, evidence, and operational
documentation are intentionally local-only. A provisioned local workspace
contains files such as `AGENTS.md`, `DEVELOPMENT.md`, `FLOW.md`, and
`DEPLOYMENT.md`; they are readable by local agents but are neither published to
GitHub nor included in Vercel deployments.

All repository-owned MCP configuration, ChatGPT profiles, tunnels, MCP servers,
provider diagnostics, and local authentication helpers are owned by the
independent repository:

```text
/Users/kristofferohnstadhjelmeland/dev/utekos-platform-tools
```

This application must not depend on platform-tools for install, build, tests, or
production runtime. Generated MCP editor files in this checkout are ignored
operator configuration, not release inputs.

`utekos-headless` contains only storefront runtime code and its own build,
contract, regression, migration, and operational verification scripts. It does
not own MCP servers or MCP credentials.
