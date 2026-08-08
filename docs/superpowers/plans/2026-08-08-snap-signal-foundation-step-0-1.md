# Snap Signal Foundation Step 0–1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add consent-gated capture and checkout persistence for Snap `ScCid` and `_scid` without activating Snap Pixel or Conversions API delivery.

**Architecture:** Reuse the existing canonical browser context, durable click-ID store, checkout-attribution snapshot and Shopify attribute handoff. Normalize only provider transport names (`ScCid` -> `snap_click_id`, `_scid` -> `sc_cookie1`), preserve values unchanged, and keep historical signal-audit payloads parseable. Database changes are forward-only nullable columns committed as migration/schema source but not applied to production in this plan.

**Tech Stack:** Next.js 16.2, TypeScript, Zod, Node 24.17.0, `node:test`, Shopify cart attributes, Supabase/PostgreSQL.

## Global Constraints

- Start from `d4a529c77a9eb613be24ac0d01a9d426c4ce8b6c` on `feat/snap-signal-foundation-step-0-1`.
- No Snap Pixel initialization, `snaptr()` call, CAPI HTTP request, token/env change, GTM/sGTM change, provider registry change or provider-outbox activation.
- No production Supabase migration apply, Vercel deploy, GTM publish, Snap asset mutation or replay.
- Marketing identifiers are exposed only when Cookiebot marketing consent is `granted`.
- Snap identifiers are opaque and case-sensitive; never lowercase, hash, synthesize or reconstruct `ScCid`/`_scid` in canonical storage.
- Existing Google, Meta and Microsoft identifier behavior must remain unchanged.
- Historical `signal_audit` payloads without Snap-specific fields must continue to parse.
- Follow `DEPLOYMENT.md`: runtime must never be deployed before an approved required production schema change is applied and verified.

---

## File Structure

**Modify**

- `src/lib/analytics/clickIdSessionStore.ts` — recognize external `ScCid`, expose/persist canonical `snap_click_id`.
- `src/lib/analytics/clickIdSessionStore.test.ts` — URL capture, persistence, exact casing and URL precedence.
- `src/lib/analytics/pageViewClientContext.ts` — read `_scid` as `browser_id.sc_cookie1` under marketing consent.
- `src/lib/analytics/pageViewClientContext.test.ts` — consent and cookie extraction regression tests.
- `src/lib/analytics/checkoutAttributionSnapshot.ts` — allowlist Snap click/cookie identifiers and Shopify attribute mapping.
- `src/lib/analytics/checkoutAttributionSnapshot.test.ts` — complete snapshot/cart/order round-trip plus denial behavior.
- `src/lib/analytics/canonicalSignalContract.ts` — add `snap_click_id` to click schema and additive optional Snap signal-audit members.
- `src/lib/analytics/canonicalSignalContract.test.ts` — click-schema and backward-compatibility tests.
- `src/lib/analytics/eventCatalogSignalContracts.ts` — define canonical provenance/delivery policy for new signal names while current non-Snap providers remain `not_applicable` for Snap-specific members.
- `src/lib/analytics/server/recordAcceptedGenerateLead.ts` — populate Snap audit members for the existing producer that materializes signal audits.
- `src/lib/analytics/server/recordAcceptedGenerateLead.test.ts` — verify Snap audit provenance/denial without changing lead delivery semantics.
- `supabase/schemas/20_marketing.sql` — declarative nullable `sc_click_id`/`sc_cookie1` columns.

**Create**

- `supabase/migrations/20260808110500_add_snap_checkout_attribution_signals.sql` — additive production migration, committed but not applied.

**Do not modify in Step 1**

- `src/lib/analytics/eventCatalog.ts`
- `src/lib/analytics/server/providerAdapterRegistry.ts`
- `src/lib/analytics/server/providerOutboxWorkerRegistry.ts`
- `config/gtm/*`
- `vercel.json`
- any Snap credentials/configuration

---

### Task 1: Canonical Snap Click ID Capture

**Files:**
- Modify: `src/lib/analytics/clickIdSessionStore.test.ts`
- Modify: `src/lib/analytics/clickIdSessionStore.ts`
- Modify: `src/lib/analytics/canonicalSignalContract.test.ts`
- Modify: `src/lib/analytics/canonicalSignalContract.ts`

**Interfaces:**
- Consumes: external landing parameter `ScCid`.
- Produces: `CanonicalClickIds.snap_click_id?: string`; `resolveClickIds()` returns canonical key `snap_click_id`.

- [ ] **Step 1: Write failing URL-capture tests**

Add to `clickIdSessionStore.test.ts`:

```ts
test('maps Snap ScCid to canonical snap_click_id without changing the value', () => {
  assert.deepEqual(
    resolveClickIds(
      'https://utekos.no/?ScCid=AbC-123_XyZ',
      createMemoryStorage(),
      createMemoryStorage()
    ),
    { snap_click_id: 'AbC-123_XyZ' }
  )
})

test('does not invent support for incorrectly-cased Snap query keys', () => {
  assert.equal(
    resolveClickIds(
      'https://utekos.no/?sccid=wrong-case',
      createMemoryStorage(),
      createMemoryStorage()
    ),
    undefined
  )
})

test('lets a fresh ScCid replace an older persisted Snap click id', () => {
  const session = createMemoryStorage({
    [CLICK_ID_SESSION_KEY]: JSON.stringify({
      snap_click_id: 'old-snap',
      fbclid: 'keep-meta'
    })
  })

  assert.deepEqual(
    resolveClickIds(
      'https://utekos.no/?ScCid=new-Snap-Value',
      session,
      createMemoryStorage()
    ),
    { snap_click_id: 'new-Snap-Value', fbclid: 'keep-meta' }
  )
})
```

- [ ] **Step 2: Run the focused test and verify red**

```bash
source "$HOME/.nvm/nvm.sh" && nvm use --silent
corepack pnpm exec tsx --test src/lib/analytics/clickIdSessionStore.test.ts
```

Expected: the new Snap assertions fail because `ScCid` is not yet recognized.

- [ ] **Step 3: Add canonical key and exact external alias mapping**

Keep persisted keys provider-neutral:

```ts
export const CLICK_ID_PARAMETERS = [
  'dclid',
  'fbclid',
  'gbraid',
  'gclid',
  'msclkid',
  'snap_click_id',
  'ttclid',
  'twclid',
  'wbraid'
] as const
```

In `readClickIdsFromSearchParams`, read `ScCid` only for `snap_click_id`:

```ts
const value = (
  parameter === 'snap_click_id'
    ? searchParams.get('ScCid')
    : searchParams.get(parameter)
)?.trim()
```

Do not modify persistence precedence or TTL.

- [ ] **Step 4: Extend the strict canonical click schema**

Add to `canonicalClickIdsSchema`:

```ts
snap_click_id: z.string().min(1).optional(),
```

Extend the case-preservation test with `snap_click_id: 'SnapCaseSensitiveValue'` and assert it is unchanged.

- [ ] **Step 5: Run both focused suites**

```bash
corepack pnpm exec tsx --test \
  src/lib/analytics/clickIdSessionStore.test.ts \
  src/lib/analytics/canonicalSignalContract.test.ts
```

Expected: PASS; existing Meta/Google/Microsoft assertions unchanged.

- [ ] **Step 6: Commit Task 1**

```bash
git add src/lib/analytics/clickIdSessionStore.ts \
  src/lib/analytics/clickIdSessionStore.test.ts \
  src/lib/analytics/canonicalSignalContract.ts \
  src/lib/analytics/canonicalSignalContract.test.ts
git commit -m "feat: capture canonical Snap click id"
```

---

### Task 2: Consent-Gated `_scid` Browser Identity

**Files:**
- Modify: `src/lib/analytics/pageViewClientContext.test.ts`
- Modify: `src/lib/analytics/pageViewClientContext.ts`

**Interfaces:**
- Consumes: existing first-party cookie `_scid`.
- Produces: `browser_id.sc_cookie1` only with marketing consent.

- [ ] **Step 1: Write failing consent tests**

Update the denial fixture to include `_scid=snap-cookie-denied` and assert the result is still `undefined` when all consent is denied.

Update the granted fixture:

```ts
const cookie =
  '_fbp=fb.1.123; _fbc=fb.1.456; _scid=Snap.Cookie.Value; _ga=GA1.1.123.456'
```

and expect:

```ts
{
  fbp: 'fb.1.123',
  fbc: 'fb.1.456',
  sc_cookie1: 'Snap.Cookie.Value',
  ga_client: 'GA1.1.123.456'
}
```

- [ ] **Step 2: Run test and verify red**

```bash
corepack pnpm exec tsx --test src/lib/analytics/pageViewClientContext.test.ts
```

Expected: granted test fails because `sc_cookie1` is absent.

- [ ] **Step 3: Implement minimal cookie mapping**

Inside the existing marketing-consent block in `extractBrowserIds()`:

```ts
const snapCookie = cookies.get('_scid')
if (snapCookie) identifiers.sc_cookie1 = snapCookie
```

Do not create `_scid`; this task only reads an existing cookie.

- [ ] **Step 4: Run focused test**

```bash
corepack pnpm exec tsx --test src/lib/analytics/pageViewClientContext.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit Task 2**

```bash
git add src/lib/analytics/pageViewClientContext.ts \
  src/lib/analytics/pageViewClientContext.test.ts
git commit -m "feat: capture consented Snap cookie"
```

---

### Task 3: Preserve Snap Attribution Through Shopify Checkout

**Files:**
- Modify: `src/lib/analytics/checkoutAttributionSnapshot.test.ts`
- Modify: `src/lib/analytics/checkoutAttributionSnapshot.ts`

**Interfaces:**
- Consumes: `browser_id.sc_cookie1`, `click_id.snap_click_id`.
- Produces: snapshot members with the same canonical names; Shopify attributes `_scid` and `ScCid`; order parser restores the canonical names.

- [ ] **Step 1: Extend the round-trip fixture**

Add:

```ts
browser_id: {
  fbc: 'fb.1.1784195000000.meta-click',
  fbp: 'fb.1.1784194900000.123456789',
  sc_cookie1: 'Snap.Cookie.123',
  ga_client_id: '123456789.1784194900',
  unrelated: 'drop-me'
},
click_id: {
  fbclid: 'meta-click',
  gclid: 'google-click',
  snap_click_id: 'Snap-Click-AbC123',
  unknown: 'drop-me'
}
```

Expect the parsed snapshot to preserve `sc_cookie1` and `snap_click_id` exactly.

Also add `_scid` and `ScCid` to the full-denial input and assert the output attribute list remains exactly `['utekos_consent']`.

- [ ] **Step 2: Run test and verify red**

```bash
corepack pnpm exec tsx --test src/lib/analytics/checkoutAttributionSnapshot.test.ts
```

Expected: new Snap fields are dropped by the current allowlists.

- [ ] **Step 3: Extend the allowlisted attribute maps**

Add:

```ts
const browserAttributeKeys = {
  fbc: '_fbc',
  fbp: '_fbp',
  sc_cookie1: '_scid',
  // existing GA entries...
} as const
```

and:

```ts
const clickAttributeKeys = {
  // existing click ids...
  snap_click_id: 'ScCid',
  // remaining ids...
} as const
```

Include `sc_cookie1` in the marketing browser-id selection/parsing path alongside `fbc` and `fbp`.

- [ ] **Step 4: Run snapshot + browser-context + click-store regression suite**

```bash
corepack pnpm exec tsx --test \
  src/lib/analytics/clickIdSessionStore.test.ts \
  src/lib/analytics/pageViewClientContext.test.ts \
  src/lib/analytics/checkoutAttributionSnapshot.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit Task 3**

```bash
git add src/lib/analytics/checkoutAttributionSnapshot.ts \
  src/lib/analytics/checkoutAttributionSnapshot.test.ts
git commit -m "feat: persist Snap checkout attribution"
```

---

### Task 4: Add Backwards-Compatible Snap Signal Provenance

**Files:**
- Modify: `src/lib/analytics/canonicalSignalContract.ts`
- Modify: `src/lib/analytics/canonicalSignalContract.test.ts`
- Modify: `src/lib/analytics/eventCatalogSignalContracts.ts`
- Modify: `src/lib/analytics/server/recordAcceptedGenerateLead.ts`
- Modify: `src/lib/analytics/server/recordAcceptedGenerateLead.test.ts`

**Interfaces:**
- Produces optional `signal_audit.snap_click_id` and `signal_audit.snap_cookie1` in schema v1.
- Existing providers receive `not_applicable` delivery policy for Snap-specific fields until a Snap provider is introduced in a later plan.

- [ ] **Step 1: Add a historical compatibility test**

Keep the existing audit fixture with only the current eight keys and assert it still parses after Snap fields are added.

Add a second fixture with:

```ts
snap_click_id: presentCanonicalSignal('browser_request_url', timestamp),
snap_cookie1: presentCanonicalSignal('first_party_cookie', timestamp)
```

and assert both states are `present`.

- [ ] **Step 2: Extend signal names and audit schema additively**

Add `snap_click_id` and `snap_cookie1` to `canonicalSignalNames`.

In `canonicalSignalAuditSchema`, add the two members with `.optional()` so old persisted v1 audits remain valid:

```ts
snap_click_id: canonicalSignalAuditEntrySchema.optional(),
snap_cookie1: canonicalSignalAuditEntrySchema.optional()
```

- [ ] **Step 3: Extend event signal policies**

For `websiteSignals`:

- `snap_click_id`: `required_when_observed`, sources `browser_request_url`, `durable_click_id_store`, `checkout_attribution_snapshot`, unavailable reasons `noClickReasons`.
- `snap_cookie1`: `required_when_marketing_granted`, sources `first_party_cookie`, `checkout_attribution_snapshot`, unavailable reasons `marketingUnavailableReasons`.

For transaction-attribution signals, allow `no_applicable_click` for `snap_click_id` the same way as generic click IDs/Meta click fields.

For Google/Meta/Microsoft provider signal policies, add both new fields as `not_applicable`. First-party persistence remains generated from `canonicalSignalNames` and therefore records them canonically.

- [ ] **Step 4: Populate the existing generate-lead audit producer**

Read:

```ts
const snapClickId = clickId?.snap_click_id
const snapCookie1 = marketingGranted
  ? extractedBrowserId?.sc_cookie1
  : undefined
```

When marketing is denied, populate both optional audit members as `consent_denied`. When granted:

- `snap_click_id` present -> source `browser_request_url`, otherwise `no_applicable_click`.
- `snap_cookie1` present -> source `first_party_cookie`, otherwise `not_observed`.

This does not add any Snap provider dispatch.

- [ ] **Step 5: Run focused signal/lead tests**

```bash
corepack pnpm exec tsx --test \
  src/lib/analytics/canonicalSignalContract.test.ts \
  src/lib/analytics/server/recordAcceptedGenerateLead.test.ts
```

Expected: PASS and old audit fixture remains valid.

- [ ] **Step 6: Commit Task 4**

```bash
git add src/lib/analytics/canonicalSignalContract.ts \
  src/lib/analytics/canonicalSignalContract.test.ts \
  src/lib/analytics/eventCatalogSignalContracts.ts \
  src/lib/analytics/server/recordAcceptedGenerateLead.ts \
  src/lib/analytics/server/recordAcceptedGenerateLead.test.ts
git commit -m "feat: audit Snap attribution signals"
```

---

### Task 5: Prepare the Checkout Attribution Schema Migration

**Files:**
- Modify: `supabase/schemas/20_marketing.sql`
- Create: `supabase/migrations/20260808110500_add_snap_checkout_attribution_signals.sql`

**Interfaces:**
- Produces nullable `marketing.checkout_attribution_snapshots.sc_click_id text` and `.sc_cookie1 text`.
- Does not apply the migration remotely.

- [ ] **Step 1: Add declarative schema columns**

Place directly after the existing paid-click/Meta identifier columns:

```sql
  dclid text,
  sc_click_id text,
  fbp text,
  fbc text,
  sc_cookie1 text,
```

No new index is required: these fields are delivery/matching context, not a lookup key in Step 1.

- [ ] **Step 2: Create the additive migration**

```sql
alter table marketing.checkout_attribution_snapshots
  add column if not exists sc_click_id text,
  add column if not exists sc_cookie1 text;

comment on column marketing.checkout_attribution_snapshots.sc_click_id is
  'Consent-gated Snap Click ID captured from the exact ScCid landing parameter; stored unchanged.';

comment on column marketing.checkout_attribution_snapshots.sc_cookie1 is
  'Consent-gated Snap first-party _scid cookie value for later CAPI matching; stored unchanged.';
```

No grant/RLS changes are needed because existing table permissions apply to new columns.

- [ ] **Step 3: Local schema verification only**

Run the repository's Supabase schema lint/local migration path appropriate for the current clean worktree. Do **not** use `--linked` and do not apply against production.

At minimum:

```bash
supabase db lint --local --schema marketing
```

If a full local reset is blocked by a pre-existing unrelated migration, record the exact blocker and do not alter unrelated migrations.

- [ ] **Step 4: Commit Task 5**

```bash
git add supabase/schemas/20_marketing.sql \
  supabase/migrations/20260808110500_add_snap_checkout_attribution_signals.sql
git commit -m "feat: add Snap checkout attribution columns"
```

---

### Task 6: Step 1 Verification and Stop Gate

**Files:** no new runtime files.

- [ ] **Step 1: Run all focused changed-domain tests**

```bash
source "$HOME/.nvm/nvm.sh" && nvm use --silent
corepack pnpm exec tsx --test \
  src/lib/analytics/clickIdSessionStore.test.ts \
  src/lib/analytics/pageViewClientContext.test.ts \
  src/lib/analytics/checkoutAttributionSnapshot.test.ts \
  src/lib/analytics/canonicalSignalContract.test.ts \
  src/lib/analytics/server/recordAcceptedGenerateLead.test.ts
```

- [ ] **Step 2: Run required repository gates**

```bash
npm run mcp:build
npm run mcp:doctor
corepack pnpm exec next typegen
corepack pnpm exec tsc --noEmit
corepack pnpm build
npm run tracking:gateway:smoke
```

Run Supabase lint because the declarative schema changed. Classify any existing unrelated baseline failure separately; never mark the Snap slice green based on ignored failures.

- [ ] **Step 3: Static no-network audit**

Confirm the branch contains no new references to:

```text
snaptr(
tr.snapchat.com
SNAP_CAPI
SNAP_ACCESS_TOKEN
snap providerAdapterRegistry entry
snap providerOutboxWorkerRegistry entry
```

Expected: none outside documentation.

- [ ] **Step 4: Diff review against start SHA**

```bash
git diff --stat d4a529c77a9eb613be24ac0d01a9d426c4ce8b6c...HEAD
git diff --check d4a529c77a9eb613be24ac0d01a9d426c4ce8b6c...HEAD
```

Confirm every runtime path is in this plan's allowlist.

- [ ] **Step 5: STOP**

Do not apply the production migration, deploy Vercel, publish GTM, alter Snap Pixel/catalog assets, create a CAPI token or start Step 2. Report the exact verification state and request the separate release/next-step authorization only after this slice is reviewed.
