# Snap Signal Foundation — Step 0–1 Design

**Status:** implementation slice approved by owner on 2026-08-08.

**Start SHA:** `d4a529c77a9eb613be24ac0d01a9d426c4ce8b6c`

**Branch:** `feat/snap-signal-foundation-step-0-1`

## Goal

Prepare Utekos' canonical event system for a later redundant Snap Pixel + Conversions API v3 rollout without sending any new Snap network traffic in this slice. Step 0 freezes current ownership and assets. Step 1 captures and preserves Snap's click/cookie identifiers through the existing consent-aware browser context and checkout-attribution handoff.

## Step 0 — frozen facts and ownership

- The application remains the semantic event owner. GTM, Pixel, sGTM and provider APIs remain delivery adapters.
- Snap browser/server deduplication will later reuse the canonical `event_id`: Pixel `client_dedup_id` must equal CAPI `event_id` for the same Snap event and Pixel ID.
- Snap's outgoing ad click query parameter is `ScCid`; Utekos stores it under the provider-neutral canonical key `snap_click_id` and later maps it to CAPI `sc_click_id`.
- Snap Pixel's first-party `_scid` cookie is stored in canonical `browser_id.sc_cookie1` and later maps to CAPI `user_data.sc_cookie1`.
- Current conversion campaigns on the Utekos Master ad account use Pixel `3b3c8f0c-51f8-4b21-bf44-cc5e1121588a` (`Utekos SnapPixel`). This is the provisional canonical Snap conversion Pixel for the later delivery slice.
- The current Shopify-imported Snap commerce catalog is bound to Pixel `69c1dde1-55c2-47f1-89f6-d7062d2e82c2`, so catalog/DPA alignment is an explicit Step 0 finding and must be resolved before Snap commerce delivery is activated. This slice does not mutate either Snap asset.
- No existing Google, Meta, Microsoft or Shopify tracking owner is changed.

## Step 1 — scope

### In scope

1. Extend canonical click IDs with `snap_click_id`.
2. Read only the exact external query key `ScCid` and normalize only the key name, never its value.
3. Persist `snap_click_id` through the existing session + 90-day durable click-ID store, using the same overwrite/merge semantics as other provider click IDs.
4. Read `_scid` only when Cookiebot marketing consent is granted and expose it as `browser_id.sc_cookie1`.
5. Preserve both identifiers in checkout-attribution snapshots and Shopify cart/order attributes:
   - canonical `snap_click_id` -> Shopify attribute `ScCid`
   - canonical `sc_cookie1` -> Shopify attribute `_scid`
6. Parse the same attributes back into the canonical checkout snapshot for paid-order recovery.
7. Extend the canonical signal contract with additive, backwards-compatible optional audit fields `snap_click_id` and `snap_cookie1`.
8. Extend signal policies so new canonical events can express provenance for those signals while existing providers explicitly treat them as not applicable until the Snap provider is added.
9. Add nullable `sc_click_id` and `sc_cookie1` columns to `marketing.checkout_attribution_snapshots` in the declarative schema and a forward migration. The migration is committed only; it is not applied to production in this slice.
10. Update focused tests for case preservation, consent denial, persistence, URL precedence and Shopify round-trip.

### Explicitly out of scope

- Snap Pixel JavaScript initialization or `snaptr()` calls.
- GTM workspace or published-container changes.
- sGTM changes.
- Snap CAPI HTTP calls, access tokens or environment variables.
- `eventCatalog.ts` Snap provider registration.
- provider adapter/worker registry changes.
- provider-outbox rows with provider `snap`.
- catalog/DPA resource mutation.
- production Supabase migration apply.
- Vercel deployment or production alias movement.
- historical replay/backfill.

## Data model

### Click ID

```text
Snap ad URL ?ScCid=<opaque-value>
        |
        v
resolveClickIds()
        |
        +-- click_id.snap_click_id = <opaque-value>
        +-- sessionStorage: utekos_click_ids
        +-- localStorage: utekos_click_ids_v1
        |
        v
canonical browser event
        |
        v
checkout attribution snapshot
        |
        +-- Shopify cart/order attribute: ScCid
        +-- DB projection after migration: sc_click_id
```

The value is an opaque, case-sensitive string. Utekos must not lowercase, hash, reconstruct or synthesize it.

### Snap cookie

```text
Cookiebot marketing=granted
        |
        v
existing document.cookie parser
        |
        +-- _scid -> browser_id.sc_cookie1
        |
        v
canonical browser event
        |
        v
checkout attribution snapshot
        |
        +-- Shopify cart/order attribute: _scid
        +-- DB projection after migration: sc_cookie1
```

Without marketing consent, `_scid` and `ScCid` must not enter a canonical payload or checkout snapshot.

## Backwards compatibility

`canonicalSignalAuditSchema` is already persisted in historical ledger payloads. The two new Snap-specific audit members are therefore optional in schema version 1. New producers may populate them, but old stored events remain parseable.

The generic `click_ids` audit signal remains authoritative for the existence of provider click IDs. The Snap-specific audit fields provide provider-level provenance without replacing that generic signal.

## Database strategy

The existing checkout-attribution snapshot table remains the durable cross-checkout store. Add only:

```sql
sc_click_id text,
sc_cookie1 text
```

No new table, index or retention regime is required in Step 1. These fields inherit the table's existing RLS, service-role-only access and privacy retention policy.

The schema migration is deliberately not applied as part of this branch because production schema mutation requires a separate explicit release approval under `DEPLOYMENT.md`.

## Verification gates

Focused tests must prove:

- `ScCid` is captured as `snap_click_id` with exact value casing.
- unknown/incorrect Snap query-key casing is not silently normalized.
- fresh URL `ScCid` wins over older persisted `snap_click_id`.
- durable click-ID persistence retains Snap alongside existing provider IDs.
- `_scid` is absent without marketing consent.
- `_scid` is exposed as `sc_cookie1` with marketing consent.
- checkout snapshot -> Shopify attributes -> parsed order snapshot round-trips both Snap values.
- full marketing denial persists neither Snap value.
- existing Meta/Google/Microsoft identifiers remain unchanged.
- historical signal-audit payloads without Snap members still parse.

Repository-wide gates after the code slice should include targeted unit tests, `next typegen`, TypeScript, build, tracking gateway smoke and Supabase lint because the declarative schema changes. Any gate that cannot run in the current tool surface must be recorded as blocked rather than claimed green.

## Rollback

This branch sends no Snap events and mutates no production resource. Before deployment, rollback is simply dropping the branch/commit. After a future approved schema migration, the added nullable columns are harmless if runtime rollout is aborted; no destructive rollback is required for this slice.
