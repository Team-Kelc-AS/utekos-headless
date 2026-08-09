# Abandoned Checkout Recovery Step 2B Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use
> superpowers:subagent-driven-development (recommended) or
> superpowers:executing-plans to implement this plan task-by-task. Steps use
> checkbox (`- [ ]`) syntax for tracking.

**Goal:** Claim due recovery dispatches exclusively and require authoritative
Shopify revalidation plus current lease ownership before the future Resend
adapter can receive delivery data.

**Architecture:** Postgres owns claim, reclaim, renewal, and all state
transitions. Narrow TypeScript adapters validate every RPC response. A
dependency-injected processor passes ephemeral delivery data to a provider
boundary only after Shopify authorization and lease renewal.

**Tech Stack:** PostgreSQL 17, Supabase Data API, `@supabase/supabase-js`
2.108, Shopify Admin GraphQL 2026-07, TypeScript 6, Zod 4, Node test runner.

## Global Constraints

- Do not send email or call Resend in Step 2B.
- Do not mutate production Supabase, Shopify, Vercel, or Resend.
- Persist no email address, recovery URL, address, line item, cookie, or raw
  provider payload.
- Grant RPC execution to `service_role` only.
- Every state transition must compare both dispatch ID and processing owner.
- Use deterministic Resend idempotency keys at the future delivery boundary.

---

### Task 1: Restore the Step 2A authorization gate

**Files:**

- Create: `src/lib/email/abandonedCheckoutRecovery/authorizeAbandonedCheckoutRecoverySend.test.ts`
- Create: `src/lib/email/abandonedCheckoutRecovery/fetchShopifyAbandonedCheckoutPreSendState.test.ts`
- Create: `src/lib/email/abandonedCheckoutRecovery/revalidateAbandonedCheckoutBeforeSend.test.ts`
- Create: `src/lib/email/abandonedCheckoutRecovery/authorizeAbandonedCheckoutRecoverySend.ts`
- Create: `src/lib/email/abandonedCheckoutRecovery/fetchShopifyAbandonedCheckoutPreSendState.ts`
- Create: `src/lib/email/abandonedCheckoutRecovery/revalidateAbandonedCheckoutBeforeSend.ts`

**Interfaces:**

- Consumes: a claimed dispatch's Shopify IDs and checkout timestamps.
- Produces: `revalidateAbandonedCheckoutBeforeSend(input)` returning either an
  authorized ephemeral `{ to, recoveryUrl }` value or a durable suppression
  reason.

- [ ] Write authorization and GraphQL normalization tests first.
- [ ] Run the focused tests and confirm missing-module failures.
- [ ] Implement the smallest strict Zod contracts and authorization policy.
- [ ] Run the tests and retain only behavior-protecting cases.

### Task 2: Add atomic database ownership and transitions

**Files:**

- Create: `supabase/migrations/*_claim_abandoned_checkout_recovery_dispatches.sql`
- Create: `supabase/tests/database/abandoned_checkout_recovery_claims.test.sql`

**Interfaces:**

- Produces: `ops.claim_abandoned_checkout_recovery_dispatches`,
  `ops.renew_abandoned_checkout_recovery_dispatch_lease`,
  `ops.suppress_abandoned_checkout_recovery_dispatch`,
  `ops.complete_abandoned_checkout_recovery_dispatch`, and
  `ops.retry_abandoned_checkout_recovery_dispatch`.

- [ ] Write SQL behavior tests for exclusive claim, reclaim, renewal, stale
  owner rejection, terminal immutability, retry, and attempt exhaustion.
- [ ] Run against the pre-2B schema and confirm the missing-function failure.
- [ ] Create the migration with the repository Supabase CLI when available;
  if the managed runtime blocks its home directory, create the timestamped
  migration once and record that tooling limitation.
- [ ] Implement validated `SECURITY INVOKER` functions with explicit grants.
- [ ] Apply the three recovery migrations to an isolated Postgres runtime and
  run the SQL behavior suite.

### Task 3: Add typed Supabase adapters

**Files:**

- Create: `src/lib/email/abandonedCheckoutRecovery/abandonedCheckoutRecoveryDispatch.ts`
- Create: `src/lib/email/abandonedCheckoutRecovery/claimAbandonedCheckoutRecoveryDispatches.test.ts`
- Create: `src/lib/email/abandonedCheckoutRecovery/claimAbandonedCheckoutRecoveryDispatches.ts`
- Create: `src/lib/email/abandonedCheckoutRecovery/transitionAbandonedCheckoutRecoveryDispatch.test.ts`
- Create: `src/lib/email/abandonedCheckoutRecovery/transitionAbandonedCheckoutRecoveryDispatch.ts`

**Interfaces:**

- Consumes: the Step 2B RPCs through the existing privileged Supabase client.
- Produces: validated claim records and boolean compare-and-set transition
  results without forwarding raw PostgREST errors.

- [ ] Write failing input/output/error-contract tests.
- [ ] Implement the narrow database type extension and Zod parsers.
- [ ] Run the adapter tests and mutation-check ownership and response branches.

### Task 4: Wire the pre-send processor

**Files:**

- Create: `src/lib/email/abandonedCheckoutRecovery/processAbandonedCheckoutRecoveryClaim.test.ts`
- Create: `src/lib/email/abandonedCheckoutRecovery/processAbandonedCheckoutRecoveryClaim.ts`

**Interfaces:**

- Consumes: one claim plus injected revalidate, renew, suppress, retry,
  complete, and delivery functions.
- Produces: a PII-free processing result suitable for a later batch/cron
  summary.

- [ ] Write failing tests proving suppression never calls delivery, lost
  renewal blocks delivery, authorization precedes renewal and delivery, and
  accepted/rejected provider outcomes transition correctly.
- [ ] Implement the processor without a default Resend dependency.
- [ ] Run the processor and all recovery tests.

### Task 5: Verify and hand off

**Files:**

- Modify only if required by generated schema parity:
  `src/types/supabase/database.types.ts`.

- [ ] Run focused recovery tests.
- [ ] Run SQL behavior tests in an isolated Postgres runtime when available.
- [ ] Run ESLint on changed TypeScript files.
- [ ] Run Next type generation and TypeScript typecheck.
- [ ] Run `git diff --check` and inspect the complete diff for PII and grants.
- [ ] Report production schema, deployment, Shopify, and Resend verification as
  blocked/not performed because Step 2B has no release approval.
