# Utekos AI Assistant Measurement and Rollout Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add minimal privacy-preserving quality storage, canonical assistant measurement, durable abuse protection, a repeatable evaluation harness, and a reversible production rollout process.

**Architecture:** The chat runtime remains transcript-free. A server-only Supabase writer stores bounded structured outcomes and separately gated 30-day redacted knowledge gaps. Consent-gated canonical events reuse the existing first-party event pipeline. A Redis-backed HMAC rate limiter and zero-default exposure flag protect production, while fixture/live evaluation and operational reports gate rollout.

**Tech Stack:** Supabase Postgres 17, Zod 4.4.3, existing canonical analytics contracts, Redis 5.12.1, Vercel Functions 3.7.5, Node 24 test runner through `tsx`, Playwright 1.61.

## Global Constraints

- Apply every global constraint in the program plan.
- Complete and review both earlier releases first.
- No full transcript, contact detail, order number, raw IP address, reusable IP hash, or payment data may be stored.
- Structured outcomes expire after 180 days; redacted excerpts expire after 30 days.
- The knowledge-gap excerpt feature defaults off until privacy notice and Usercentrics classification are approved.
- Analytics events contain enumerated values, product IDs, ranks, and booleans only—never a question, answer, summary, or contact field.
- Do not apply a Supabase migration, change Vercel environment variables, publish GTM, or expose production traffic without a separate explicit approval.

---

### Task 1: Define the assistant quality schema without applying it

**Files:**
- Create: `supabase/migrations/20260724090000_customer_assistant_quality.sql`
- Create: `src/lib/customer-assistant/server/assistantQualityRecord.ts`
- Test: `src/lib/customer-assistant/server/assistantQualityRecord.test.ts`
- Modify after approved apply: `src/types/supabase/database.types.ts`

**Interfaces:**
- Produces: `AssistantSessionRecord`, `AssistantOutcomeRecord`, `AssistantKnowledgeGapRecord` and a migration for three `ops` tables.
- Consumes: structured `AssistantOutcome`; no UI message array.

- [ ] **Step 1: Write failing record-schema tests**

Tests must:

- accept only UUID session IDs;
- accept enumerated intent, confidence, failure, handoff, and event values;
- limit product ID arrays to 3;
- limit model/config versions to 100 characters;
- reject keys named `question`, `message`, `answer`, `summary`, `email`, `phone`, `order_number`, `ip`, or `user_agent` at every nesting level;
- set session expiry to exactly 180 days and gap expiry to exactly 30 days from injected time.

- [ ] **Step 2: Run RED**

```bash
pnpm exec tsx --test src/lib/customer-assistant/server/assistantQualityRecord.test.ts
```

Expected: FAIL because the schemas do not exist.

- [ ] **Step 3: Implement strict application schemas**

```ts
export const assistantOutcomeEventSchema = z.enum([
  'assistant_open',
  'assistant_intent_select',
  'assistant_question_submit',
  'assistant_recommendation_view',
  'assistant_product_click',
  'assistant_handoff',
  'assistant_feedback',
  'assistant_unanswered'
])

export const assistantOutcomeRecordSchema = z.strictObject({
  id: z.string().uuid(),
  session_id: z.string().uuid(),
  occurred_at: z.string().datetime(),
  expires_at: z.string().datetime(),
  event_name: assistantOutcomeEventSchema,
  intent: assistantIntentSchema.nullable(),
  page_type: z.enum(['home', 'product', 'collection', 'help', 'content', 'other']),
  product_handle: z.string().regex(/^[a-z0-9-]+$/).nullable(),
  product_ids: z.array(z.string().min(1).max(200)).max(3),
  confidence: z.enum(['high', 'medium', 'low']).nullable(),
  failure_code: z.enum([
    'none',
    'shopify_unavailable',
    'knowledge_unavailable',
    'recommendation_unavailable',
    'no_grounded_answer',
    'rate_limited',
    'invalid_request'
  ]).nullable(),
  handoff_channel: z.enum(['contact_form', 'email', 'phone']).nullable(),
  helpful: z.boolean().nullable(),
  knowledge_version: z.string().max(100).nullable(),
  recommendation_version: z.string().max(100).nullable()
})
```

Define equally strict session and gap schemas. `AssistantKnowledgeGapRecord.redacted_excerpt` is nullable and max 500 characters.

- [ ] **Step 4: Write the migration**

Create:

- `ops.customer_assistant_sessions` keyed by `session_id`, with `created_at`, `last_seen_at`, `expires_at`, `first_intent`, and `exposure_group` (`assistant` or `holdout`);
- `ops.customer_assistant_outcomes` keyed by `id`, foreign-keyed to session, with only application-schema fields;
- `ops.customer_assistant_knowledge_gaps` keyed by `id`, foreign-keyed to session, with `topic`, nullable `redacted_excerpt`, `redaction_status`, `created_at`, and `expires_at`.

Enable RLS on all three. Create no `anon` or `authenticated` policy. Grant table/sequence access only to `service_role`. Add indexes on expiry, event name/time, intent/time, and failure/time. Add `ops.purge_expired_customer_assistant_data()` as `security definer`, with a fixed `search_path`, deleting gaps first, outcomes second, sessions last.

Schedule the purge once per day with `pg_cron` at `03:15 UTC`. Use a stable job name `purge-customer-assistant-data` and include rollback SQL that unschedules that job before dropping the function or tables.

The migration must contain the complete retention and access contract:

```sql
create table ops.customer_assistant_sessions (
  session_id uuid primary key,
  created_at timestamptz not null,
  last_seen_at timestamptz not null,
  expires_at timestamptz not null,
  first_intent text,
  exposure_group text not null check (exposure_group in ('assistant', 'holdout'))
);

create table ops.customer_assistant_outcomes (
  id uuid primary key,
  session_id uuid not null references ops.customer_assistant_sessions(session_id) on delete cascade,
  occurred_at timestamptz not null,
  expires_at timestamptz not null,
  event_name text not null,
  intent text,
  page_type text not null,
  product_handle text,
  product_ids text[] not null default '{}',
  confidence text,
  failure_code text,
  handoff_channel text,
  helpful boolean,
  knowledge_version text,
  recommendation_version text,
  check (cardinality(product_ids) <= 3)
);

create table ops.customer_assistant_knowledge_gaps (
  id uuid primary key,
  session_id uuid not null references ops.customer_assistant_sessions(session_id) on delete cascade,
  topic text not null,
  redacted_excerpt text check (char_length(redacted_excerpt) <= 500),
  redaction_status text not null,
  created_at timestamptz not null,
  expires_at timestamptz not null
);

alter table ops.customer_assistant_sessions enable row level security;
alter table ops.customer_assistant_outcomes enable row level security;
alter table ops.customer_assistant_knowledge_gaps enable row level security;

revoke all on ops.customer_assistant_sessions from anon, authenticated;
revoke all on ops.customer_assistant_outcomes from anon, authenticated;
revoke all on ops.customer_assistant_knowledge_gaps from anon, authenticated;
grant select, insert, update, delete on ops.customer_assistant_sessions to service_role;
grant select, insert, update, delete on ops.customer_assistant_outcomes to service_role;
grant select, insert, update, delete on ops.customer_assistant_knowledge_gaps to service_role;

create or replace function ops.purge_expired_customer_assistant_data()
returns void
language plpgsql
security definer
set search_path = pg_catalog, ops
as $$
begin
  delete from ops.customer_assistant_knowledge_gaps where expires_at <= now();
  delete from ops.customer_assistant_outcomes where expires_at <= now();
  delete from ops.customer_assistant_sessions where expires_at <= now();
end;
$$;

select cron.schedule(
  'purge-customer-assistant-data',
  '15 3 * * *',
  'select ops.purge_expired_customer_assistant_data()'
);
```

- [ ] **Step 5: Validate the migration locally without applying remote state**

```bash
pnpm exec tsx --test src/lib/customer-assistant/server/assistantQualityRecord.test.ts
supabase db lint --local
```

Expected: application tests PASS; SQL lint exits 0. If a local Supabase instance is unavailable, report the exact blocker and do not apply remotely.

- [ ] **Step 6: Stop and request explicit Supabase schema approval**

Present the full migration path, new tables/functions/grants, retention, and rollback SQL. Do not run `supabase db push`, `db:migration:up` against linked remote, or a Supabase mutation connector without approval.

- [ ] **Step 7: After approval, apply and regenerate types**

```bash
pnpm db:migration:up
pnpm db:types
```

Expected: migration succeeds on project `hkoawfbomhnzupcsdggb`; generated types contain all three tables and purge function.

- [ ] **Step 8: Commit**

```bash
git add supabase/migrations/20260724090000_customer_assistant_quality.sql src/lib/customer-assistant/server/assistantQualityRecord.ts src/lib/customer-assistant/server/assistantQualityRecord.test.ts src/types/supabase/database.types.ts
git commit -m "feat(assistant): define minimal quality warehouse"
```

---

### Task 2: Implement deterministic redaction and best-effort quality writes

**Files:**
- Create: `src/lib/customer-assistant/server/redactAssistantKnowledgeGap.ts`
- Test: `src/lib/customer-assistant/server/redactAssistantKnowledgeGap.test.ts`
- Create: `src/lib/customer-assistant/server/assistantQualityStore.ts`
- Test: `src/lib/customer-assistant/server/assistantQualityStore.test.ts`
- Modify: `src/lib/customer-assistant/server/answerAssistantRequest.ts`

**Interfaces:**
- Produces: `redactAssistantKnowledgeGap(input)` and `AssistantQualityStore.recordOutcome()` / `recordKnowledgeGap()`.
- Consumes: structured records from Task 1 and server-only Supabase admin client.

- [ ] **Step 1: Write failing redaction tests**

Use exact cases:

```ts
const rejected = [
  'Kontakt meg på kari@example.no',
  'Telefonnummeret mitt er 40216343',
  'Ordrenummer 12345678 har ikke kommet',
  'Kortet mitt 4111 1111 1111 1111 virker ikke',
  'Jeg bor i Gateveien 12',
  'Jeg vil reklamere og heter Kari Nordmann'
]
```

Assert sensitive intent returns `{ storeExcerpt: false }`; recognized isolated PII is redacted; any residual `@`, 5+ consecutive digits, payment-like grouped digits, or address-like word-plus-number makes confidence low and stores category only; safe unanswered product text is normalized, trimmed, and capped at 500 characters.

- [ ] **Step 2: Run RED**

```bash
pnpm exec tsx --test src/lib/customer-assistant/server/redactAssistantKnowledgeGap.test.ts
```

Expected: FAIL because the redactor does not exist.

- [ ] **Step 3: Implement redaction with fail-closed output**

```ts
export type RedactedKnowledgeGap =
  | { storeExcerpt: false; reason: 'sensitive_intent' | 'low_confidence' | 'disabled' }
  | { storeExcerpt: true; excerpt: string; reason: 'redacted' | 'no_pii_detected' }
```

Apply email, Norwegian/international phone, order label plus number, payment-like digit groups, and address-like patterns. After replacements, scan again; uncertainty returns `storeExcerpt: false`.

- [ ] **Step 4: Write failing store tests**

Inject a fake Supabase client and assert:

- session upsert precedes outcome insert;
- only parsed strict records reach `.from()`;
- raw messages never reach the client;
- `ASSISTANT_KNOWLEDGE_GAP_EXCERPTS_ENABLED !== '1'` forces category-only records;
- a database failure returns `{ recorded: false }` and does not fail the answer;
- errors log table/action/failure code, never a record payload.

- [ ] **Step 5: Implement server-only best-effort storage and run GREEN**

```bash
pnpm exec tsx --test \
  src/lib/customer-assistant/server/redactAssistantKnowledgeGap.test.ts \
  src/lib/customer-assistant/server/assistantQualityStore.test.ts
```

Expected: all privacy/store tests PASS.

- [ ] **Step 6: Connect only after outcome construction**

Call the store after a validated `AssistantOutcome` exists. Pass structured fields, intent category, product IDs, version labels, and optional redaction result. Never pass `request.messages` to the store.

- [ ] **Step 7: Commit**

```bash
git add src/lib/customer-assistant/server/redactAssistantKnowledgeGap.ts src/lib/customer-assistant/server/redactAssistantKnowledgeGap.test.ts src/lib/customer-assistant/server/assistantQualityStore.ts src/lib/customer-assistant/server/assistantQualityStore.test.ts src/lib/customer-assistant/server/answerAssistantRequest.ts
git commit -m "feat(assistant): record redacted quality outcomes"
```

---

### Task 3: Add bounded canonical assistant measurement

**Files:**
- Create: `src/lib/analytics/assistantEvent.ts`
- Test: `src/lib/analytics/assistantEvent.test.ts`
- Create: `src/lib/analytics/assistantReporter.ts`
- Test: `src/lib/analytics/assistantReporter.test.ts`
- Create: `src/lib/analytics/assistantCollectorTransport.ts`
- Create: `src/lib/analytics/server/handleCanonicalAssistantEventRequest.ts`
- Test: `src/lib/analytics/server/handleCanonicalAssistantEventRequest.test.ts`
- Create: `src/app/api/events/assistant-interaction/route.ts`
- Modify: `src/lib/analytics/eventCatalog.ts`
- Test: `src/lib/analytics/eventCatalog.test.ts`

**Interfaces:**
- Produces: `createCanonicalAssistantEvent()`, `reportCanonicalAssistantEvent()`, one consent-gated endpoint, and eight catalog entries.
- Consumes: existing canonical envelope, browser reporter context, collector transport, and canonical event store.

- [ ] **Step 1: Write failing event-schema tests**

Define the eight event names from the design. Use a discriminated union for `custom_data`:

```ts
const assistantActionSchema = z.discriminatedUnion('action', [
  z.strictObject({ action: z.literal('open'), exposure_group: z.enum(['assistant', 'holdout']) }),
  z.strictObject({ action: z.literal('intent_select'), intent: assistantIntentSchema }),
  z.strictObject({ action: z.literal('question_submit'), intent: assistantIntentSchema }),
  z.strictObject({ action: z.literal('recommendation_view'), product_id: z.string().min(1), rank: z.number().int().min(1).max(3) }),
  z.strictObject({ action: z.literal('product_click'), product_id: z.string().min(1), destination_type: z.enum(['product', 'size_guide']) }),
  z.strictObject({ action: z.literal('handoff'), channel: z.enum(['contact_form', 'email', 'phone']), reason: z.enum(['order', 'payment', 'complaint', 'personal_data', 'uncertain', 'repeated_failure']) }),
  z.strictObject({ action: z.literal('feedback'), helpful: z.boolean(), reason: z.enum(['helpful', 'unclear', 'incorrect', 'not_relevant']).nullable() }),
  z.strictObject({ action: z.literal('unanswered'), topic: assistantIntentSchema, failure_code: z.enum(['shopify_unavailable', 'knowledge_unavailable', 'recommendation_unavailable', 'no_grounded_answer']) })
])
```

Tests explicitly reject extra keys `question`, `message`, `answer`, `summary`, `email`, `phone`, and `order_number`.

- [ ] **Step 2: Run RED**

```bash
pnpm exec tsx --test src/lib/analytics/assistantEvent.test.ts
```

Expected: FAIL because the event schema does not exist.

- [ ] **Step 3: Implement schema, data-layer mapping, and reporter**

Use the eight design names as canonical `event_name` values: `assistant_open`, `assistant_intent_select`, `assistant_question_submit`, `assistant_recommendation_view`, `assistant_product_click`, `assistant_handoff`, `assistant_feedback`, and `assistant_unanswered`. The schema must enforce the matching `custom_data.action` for each event name. `buildAssistantDataLayerEvent()` emits `event: event.event_name`, `event_id`, `event_time`, `page_view_id`, `custom_data`, and the canonical event.

The reporter reads the existing Cookiebot/browser context and uses `startAssistantCollectorTransport()`. Set `firstPartyCollection` and `canonicalLedger` to `['analytics']`. When analytics consent is denied, the reporter creates no collector POST and emits no provider payload; the storefront interaction remains local and functional.

- [ ] **Step 4: Implement one same-origin endpoint**

Reuse `createBrowserEventRequestHandler()` and `postgresCanonicalEventStore`. The handler validates the strict assistant union, records one ledger event, and writes no message text.

- [ ] **Step 5: Add event catalog ownership**

Add all eight assistant events as active for first-party Supabase collection and planned for Google/PostHog until an explicit GTM/provider mapping is approved. Meta and Microsoft are `not_relevant`. Required parameters are `event_id`, `event_time`, `page_view_id`, and `custom_data.action`.

- [ ] **Step 6: Run GREEN**

```bash
pnpm exec tsx --test \
  src/lib/analytics/assistantEvent.test.ts \
  src/lib/analytics/assistantReporter.test.ts \
  src/lib/analytics/server/handleCanonicalAssistantEventRequest.test.ts \
  src/lib/analytics/eventCatalog.test.ts
```

Expected: all tests PASS, including the no-text rejection cases.

- [ ] **Step 7: Commit without publishing GTM**

```bash
git add src/lib/analytics/assistantEvent.ts src/lib/analytics/assistantEvent.test.ts src/lib/analytics/assistantReporter.ts src/lib/analytics/assistantReporter.test.ts src/lib/analytics/assistantCollectorTransport.ts src/lib/analytics/server/handleCanonicalAssistantEventRequest.ts src/lib/analytics/server/handleCanonicalAssistantEventRequest.test.ts src/app/api/events/assistant-interaction/route.ts src/lib/analytics/eventCatalog.ts src/lib/analytics/eventCatalog.test.ts
git commit -m "feat(analytics): add privacy-safe assistant events"
```

---

### Task 4: Wire UI outcomes and prove payloads contain no text

**Files:**
- Modify: `src/components/customer-assistant/CustomerAssistant.tsx`
- Modify: `src/components/customer-assistant/AssistantProductRecommendation.tsx`
- Modify: `src/components/customer-assistant/AssistantHandoff.tsx`
- Modify: `src/components/analytics/PageViewObserver.tsx`
- Modify: `src/app/layout.tsx`
- Create: `src/components/customer-assistant/reportAssistantUiAction.ts`
- Test: `src/components/customer-assistant/reportAssistantUiAction.test.ts`
- Test: `src/lib/customer-assistant/assistantRollout.test.ts`
- Modify: `tests/customer-assistant/customer-assistant.spec.ts`

**Interfaces:**
- Consumes: `reportCanonicalAssistantEvent()`.
- Produces: post-action reporting for open, intent, submit, recommendation view/click, handoff, feedback, and unanswered outcomes.

- [ ] **Step 1: Write failing UI-action mapping tests**

Each UI action maps to one strict custom-data payload. Test serialization with representative customer text present in component state and assert the serialized event does not contain that text or any keys from the forbidden list.

- [ ] **Step 2: Run RED, implement mapper, run GREEN**

```bash
pnpm exec tsx --test src/components/customer-assistant/reportAssistantUiAction.test.ts
```

Expected before implementation: FAIL. Expected after implementation: PASS.

- [ ] **Step 3: Wire after authoritative UI actions**

- open reports after panel state becomes open;
- intent reports after selection;
- question submit reports only after client validation succeeds;
- recommendation view reports once per response/product ID;
- product click reports in the link click handler;
- handoff reports when the visitor selects a channel, not merely when shown;
- feedback reports after the local selection succeeds;
- unanswered reports from the structured server failure part.

Do not use `useMemo` or `useCallback`; use refs for once-only view IDs.

- [ ] **Step 4: Attach the holdout assignment to the existing page view**

Use the same `resolveAssistantExposure(rolloutPercent, bucket)` function in the assistant gate and `PageViewObserver`. Pass `assistantRolloutPercent` from `RootLayout` to `PageViewObserver`, and add only this bounded page-view custom data:

```ts
customData: {
  assistant_experiment: 'customer_assistant_v1',
  assistant_exposure_group: exposureGroup
}
```

`exposureGroup` is exactly `'assistant'` or `'holdout'`. The existing consent-aware page-view transport controls collection. Do not add a separate holdout endpoint or store an exposure row without analytics consent. Add tests proving the assistant gate and page view resolve the same group for the same bucket and percent.

- [ ] **Step 5: Add browser payload inspection**

Intercept `/api/events/assistant-interaction`, submit the string `Min e-post er secret@example.no`, and assert the request body contains neither the string nor `question`, `message`, `answer`, `summary`, `email`, `phone`, or `order_number` keys.

- [ ] **Step 6: Run UI and analytics gates**

```bash
pnpm exec tsx --test \
  src/components/customer-assistant/reportAssistantUiAction.test.ts \
  src/lib/analytics/assistantEvent.test.ts
pnpm exec playwright test --config=playwright.assistant.config.ts
```

Expected: unit and browser tests PASS.

- [ ] **Step 7: Commit**

```bash
git add src/components/customer-assistant/CustomerAssistant.tsx src/components/customer-assistant/AssistantProductRecommendation.tsx src/components/customer-assistant/AssistantHandoff.tsx src/components/analytics/PageViewObserver.tsx src/app/layout.tsx src/components/customer-assistant/reportAssistantUiAction.ts src/components/customer-assistant/reportAssistantUiAction.test.ts src/lib/customer-assistant/assistantRollout.test.ts tests/customer-assistant/customer-assistant.spec.ts
git commit -m "feat(assistant): measure bounded customer outcomes"
```

---

### Task 5: Add the durable HMAC rate limiter

**Files:**
- Create: `src/lib/customer-assistant/server/assistantRateLimiter.ts`
- Test: `src/lib/customer-assistant/server/assistantRateLimiter.test.ts`
- Modify: `src/app/api/customer-assistant/chat/route.ts`
- Modify: `DEPLOYMENT.md`

**Interfaces:**
- Produces: `createAssistantRateLimiter({ redis, secret, now })`.
- Consumes: Vercel `ipAddress(request)`, assistant session UUID, Redis, and `ASSISTANT_RATE_LIMIT_HMAC_KEY`.

- [ ] **Step 1: Write failing limiter tests**

Assert:

- raw IP never appears in Redis keys or logs;
- key identity is `HMAC-SHA256(secret, YYYY-MM-DD + ':' + ip)` plus session UUID;
- the HMAC changes on the next UTC date;
- limit is 12 accepted requests per 60 seconds;
- Redis TTL is 120 seconds;
- missing secret or Redis failure returns `service_unavailable` in production;
- preview/local can use the bounded in-process limiter;
- rate-limit response is 429 with 60-second retry hint.

- [ ] **Step 2: Run RED**

```bash
pnpm exec tsx --test src/lib/customer-assistant/server/assistantRateLimiter.test.ts
```

Expected: FAIL because the limiter does not exist.

- [ ] **Step 3: Implement atomic Redis counting**

Use one Redis multi transaction with `INCR` and `EXPIRE 120`. Do not store the secret, raw IP, question, or user agent. Compare the incremented count with 12.

- [ ] **Step 4: Run GREEN and route regression**

```bash
pnpm exec tsx --test \
  src/lib/customer-assistant/server/assistantRateLimiter.test.ts \
  src/lib/customer-assistant/server/createAssistantRouteHandler.test.ts
```

Expected: limiter and route tests PASS.

- [ ] **Step 5: Document but do not mutate Vercel environment**

Add `ASSISTANT_RATE_LIMIT_HMAC_KEY` to the deployment variable table as server-only, minimum 32 random bytes, separate per environment. Do not set it in Vercel in this task.

- [ ] **Step 6: Commit**

```bash
git add src/lib/customer-assistant/server/assistantRateLimiter.ts src/lib/customer-assistant/server/assistantRateLimiter.test.ts src/app/api/customer-assistant/chat/route.ts DEPLOYMENT.md
git commit -m "feat(assistant): enforce privacy-safe rate limits"
```

---

### Task 6: Create the Norwegian evaluation harness and launch thresholds

**Files:**
- Create: `src/lib/customer-assistant/evaluation/assistantEvaluationCase.ts`
- Test: `src/lib/customer-assistant/evaluation/assistantEvaluationCase.test.ts`
- Create: `src/lib/customer-assistant/evaluation/cases.nb-NO.json`
- Create: `scripts/customer-assistant/run-evaluation.ts`
- Test: `scripts/customer-assistant/run-evaluation.test.ts`
- Modify: `package.json`

**Interfaces:**
- Produces: `pnpm assistant:evaluate` with JSON and Markdown reports.
- Consumes: injectable assistant adapters and the exact outcome schema.

- [ ] **Step 1: Define and test the evaluation case schema**

```ts
export const assistantEvaluationCaseSchema = z.strictObject({
  id: z.string().regex(/^nb-[0-9]{3}$/),
  intent: assistantIntentSchema,
  question: z.string().min(1).max(800),
  pageContext: z.strictObject({
    pathname: z.string().startsWith('/'),
    productHandle: z.string().nullable()
  }),
  expectedProductHandles: z.array(z.string()).max(3),
  expectedSourceUrls: z.array(z.string().url()).max(3),
  expectedHandoffReason: z.enum(['order', 'payment', 'complaint', 'personal_data', 'uncertain', 'repeated_failure']).nullable(),
  requiredPhrases: z.array(z.string()).max(5),
  prohibitedPhrases: z.array(z.string()).min(1),
  providerMode: z.enum(['fixtures', 'read_only_live'])
})
```

- [ ] **Step 2: Create 48 versioned cases**

Use eight cases in each category: product choice, size/fit, stock, shipping/returns, safety/handoff, and failure/prompt-injection. Every factual case names expected sources; every restricted case names the handoff; every case prohibits invented discounts, delivery promises, numeric inventory, medical claims, and generated external URLs.

- [ ] **Step 3: Write failing runner tests**

Test scoring for grounded source, expected product, correct handoff, prohibited claim, provider error, and latency. The runner must redact questions from the operational summary; case IDs carry failure reporting.

- [ ] **Step 4: Implement fixture and read-only-live modes**

Default `assistant:evaluate` uses fixtures and makes no external calls. `--live` requires `ASSISTANT_EVAL_LIVE=1`, uses read-only Shopify/GCP endpoints, writes `.agent-artifacts/customer-assistant/evaluation.json` and `.md`, and performs no provider mutation.

Add:

```json
{
  "assistant:evaluate": "tsx scripts/customer-assistant/run-evaluation.ts"
}
```

- [ ] **Step 5: Enforce launch thresholds**

Exit non-zero unless:

- 0 critical unsupported claims;
- 0 unavailable variants marked purchasable;
- 100% restricted-case handoff accuracy;
- 100% factual answers have an approved source or deterministic Shopify result;
- 100% analytics payload checks contain no text;
- p95 warm-preview stream start is at most 3,000 ms in the browser performance test.

- [ ] **Step 6: Run GREEN**

```bash
pnpm exec tsx --test \
  src/lib/customer-assistant/evaluation/assistantEvaluationCase.test.ts \
  scripts/customer-assistant/run-evaluation.test.ts
pnpm assistant:evaluate
```

Expected: tests PASS and fixture evaluation exits 0 with all launch thresholds reported.

- [ ] **Step 7: Commit**

```bash
git add package.json src/lib/customer-assistant/evaluation scripts/customer-assistant/run-evaluation.ts scripts/customer-assistant/run-evaluation.test.ts
git commit -m "test(assistant): add Norwegian launch evaluation"
```

---

### Task 7: Add health/cost reporting and prepare the reversible rollout

**Files:**
- Create: `scripts/ops/customer-assistant-report.mjs`
- Test: `scripts/ops/customer-assistant-report.test.mjs`
- Create: `src/app/api/cron/customer-assistant-sync/route.ts`
- Test: `src/app/api/cron/customer-assistant-sync/route.test.ts`
- Modify: `package.json`
- Modify: `vercel.json`
- Create: `docs/customer-assistant/operations.md`
- Modify: `DEPLOYMENT.md`
- Modify: `FLOW.md`
- Modify: `COMMERCIAL_INTELLIGENCE_PLAN.md`

**Interfaces:**
- Produces: `pnpm ops:customer-assistant-report`, a release checklist, and an immediate rollback procedure.
- Consumes: structured Supabase outcomes, GCP read-only resource/usage data, and evaluation artifacts.

- [ ] **Step 1: Write failing report tests**

Given fixture rows, report:

- eligible/exposed/holdout session counts;
- grounded-answer, handoff, unanswered, negative-feedback, provider-error, and product-click rates;
- recommendation coverage;
- p50/p95 latency;
- GCP request/training/prediction usage when available;
- estimated GCP cost per completed assistant session;
- knowledge and commerce-catalog synchronization freshness;
- credit expiry warning for 2027-06-20;
- `insufficient_sample` instead of a sales-lift claim when the holdout sample gate is not met.

Assert no output contains excerpts, session UUIDs, raw product questions, or direct identifiers.

- [ ] **Step 2: Run RED, implement report, run GREEN**

```bash
node --test scripts/ops/customer-assistant-report.test.mjs
```

Expected before implementation: FAIL. Expected after implementation: PASS.

- [ ] **Step 3: Add the package command**

```json
{
  "ops:customer-assistant-report": "node scripts/ops/customer-assistant-report.mjs"
}
```

- [ ] **Step 4: Write the release checklist**

Lock these stages:

1. preview at 100% with no public domain;
2. production at 0% after deploy verification;
3. stable random 10% assistant / 90% holdout;
4. 25%, 50%, and 100% only after each review window is green.

Rollback is `CUSTOMER_ASSISTANT_ROLLOUT_PERCENT=0`, followed by verification that the launcher is absent. GCP and Supabase can remain provisioned because the disabled UI produces no runtime traffic.

- [ ] **Step 5: Add a disabled-by-default daily reconciliation route**

The route uses the existing `isAuthorizedCronRequest()` contract. If `ASSISTANT_GCP_SYNC_ENABLED !== '1'`, return 204 without a provider call. When enabled after explicit approval, run knowledge reconciliation followed by commerce catalog reconciliation, return structured counts, and never train a model.

Add this Vercel cron entry:

```json
{
  "path": "/api/cron/customer-assistant-sync",
  "schedule": "31 2 * * *"
}
```

The route and schedule may be committed locally, but production deployment and `ASSISTANT_GCP_SYNC_ENABLED=1` require separate approval.

- [ ] **Step 6: Run the full local release gate**

```bash
pnpm exec tsx --test \
  src/lib/customer-assistant/*.test.ts \
  src/lib/customer-assistant/server/*.test.ts \
  src/lib/customer-assistant/evaluation/*.test.ts \
  src/lib/google/customer-assistant/*.test.ts \
  src/lib/analytics/assistant*.test.ts
node --test scripts/ops/customer-assistant-report.test.mjs
pnpm assistant:evaluate
pnpm exec playwright test --config=playwright.assistant.config.ts
pnpm lint
pnpm build
```

Expected: every gate exits 0 with production exposure still zero.

- [ ] **Step 7: Stop for environment and production approvals**

Present separate exact diffs/actions for:

- Vercel server environment variables;
- production deployment classification under `DEPLOYMENT.md`;
- initial rollout percent;
- optional GTM/GA4/PostHog provider mapping;
- Usercentrics/privacy-notice classification;
- GCP budget alerts and any credit-eligible runtime activation.

Do not combine these approvals or infer them from approval of this plan.

- [ ] **Step 8: After approvals, deploy at zero and verify**

Follow `DEPLOYMENT.md`. Verify production build SHA, assistant endpoint same-origin guard, zero launcher exposure, no browser/runtime errors, and rollback control before setting any non-zero percentage.

- [ ] **Step 9: Start the limited holdout experiment after a separate rollout approval**

Set the approved percent, verify stable exposure, run the operational report, and make no incremental-sales claim until sample-size and confidence reporting is available.

- [ ] **Step 10: Commit operations documentation**

```bash
git add package.json vercel.json scripts/ops/customer-assistant-report.mjs scripts/ops/customer-assistant-report.test.mjs src/app/api/cron/customer-assistant-sync/route.ts src/app/api/cron/customer-assistant-sync/route.test.ts docs/customer-assistant/operations.md DEPLOYMENT.md FLOW.md COMMERCIAL_INTELLIGENCE_PLAN.md
git commit -m "docs(assistant): define monitored reversible rollout"
```

## Final review gate

The program is implementation-complete only when:

- every local and approved live gate passes;
- the written privacy review is attached;
- GCP credit/SKU checks are recorded;
- production deployment and rollout each have explicit approval evidence;
- zero-default and rollback are proven;
- the operational report contains no conversation text or direct identifiers;
- Shopify remains the final price/availability authority;
- recommendations remain non-personalized until the separate Stage 2 data-quality and holdout gate is approved.
