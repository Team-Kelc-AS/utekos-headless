# Codex Repository Rules

## Zero-Assumption Protocol

These rules apply in local checkouts, Git worktrees, CI, and Codex
Cloud.

1. Read `AGENTS.md`, `PLAN.md`, and `DEPLOYMENT.md` before changing
   code or making architectural recommendations.
2. Read the portable documentation entry points:
   - `.codex/docs/main-documentation/agents.txt`
   - `.codex/docs/main-documentation/sitemap.xml`
   - `.codex/docs/main-documentation/README.md`
   - `.codex/docs/main-documentation/llms.txt`
3. Use those entry points to identify relevant project sources. For
   volatile APIs, framework behavior, provider requirements, tracking
   semantics, and deployment state, verify against current official
   documentation or the authoritative live system before proceeding.
4. Do not depend on paths inside a named developer's home directory;
   repository contracts must work in Linux cloud containers and on
   other developer machines.
5. If a required source is genuinely unavailable, report
   `Dokumentasjonsstatus: Nei`, name the missing source, and stop the
   affected implementation work.
6. Final delivery must list completed verification and any blocked
   verification. Do not describe unverified UI, tracking, provider,
   deployment, or data-flow behavior as complete.

The files in `.codex/docs/main-documentation/` are entry-point
snapshots, not a substitute for current provider documentation. Update
the snapshots from the canonical Utekos documentation workspace when
its generated indexes change.
