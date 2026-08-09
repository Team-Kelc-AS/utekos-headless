# Abandoned Checkout Recovery Step 2B Design

## Goal

Add exclusive, expiring ownership of due abandoned-checkout recovery  
dispatches and make Shopify pre-send revalidation an unavoidable gate before  
the future Resend delivery adapter can receive an email address or recovery  
URL.

## Scope

Step 2B includes:

- an atomic Postgres claim/reclaim operation;
    
- lease renewal immediately before the provider boundary;
    
- compare-and-set transitions to `sent`, `suppressed`, `pending`, or `failed`;
    
- typed Supabase adapters for those operations;
    
- reconstruction of the pruned Step 2A Shopify revalidation gate;
    
- an orchestration boundary that can call a future Resend adapter only after  
    authorization and lease renewal.
    

Step 2B does not include a customer email template, a Resend adapter, a cron  
route, Vercel configuration, deployment, or a production Supabase mutation.

## Architecture

`ops.abandoned_checkout_recovery_dispatches` remains the durable state owner.  
The database exposes narrow `SECURITY INVOKER` functions to `service_role`  
only. The claim function locks due `pending` rows and expired `processing`  
rows with `FOR UPDATE SKIP LOCKED`, changes their owner and lease timestamps in  
the same transaction, and returns only non-PII dispatch metadata.

The runtime processes one claim through this fixed order:

1. Fetch authoritative `Abandonment` state from Shopify by abandoned checkout  
    ID.
    
2. Authorize or suppress using checkout completion, order and draft-order  
    state, significance, inventory, Shopify email state, customer identity,  
    email consent, timestamps, and the HTTPS recovery URL.
    
3. If suppressed, compare-and-set the owned row to `suppressed`.
    
4. If authorized, renew the same owner lease. Ownership loss stops processing  
    before delivery.
    
5. Call the injected delivery boundary with the ephemeral email and recovery  
    URL.
    
6. Compare-and-set the row to `sent`, or schedule a bounded retry/final  
    failure with a machine-readable code.
    

No database row, batch summary, exception, Sentry tag, or log contains the  
email address or recovery URL.

## State machine

| From | Operation | To | Guard |
| --- | --- | --- | --- |
| `pending` | claim | `processing` | due and row lock acquired |
| `processing` | reclaim | `processing` | prior lease expired and row lock acquired |
| `processing` | renew | `processing` | dispatch ID and owner match |
| `processing` | suppress | `suppressed` | dispatch ID and owner match |
| `processing` | provider accepted | `sent` | dispatch ID and owner match |
| `processing` | retryable failure | `pending` | owner match and attempt limit not reached |
| `processing` | final/exhausted failure | `failed` | owner match |

Terminal `sent`, `suppressed`, and `failed` rows are never claimable. A stale  
worker cannot transition a row after another worker has reclaimed it because  
every transition is a compare-and-set on both `id` and `processing_owner`.

## Failure policy

Business facts such as recovery, a later order, Shopify-owned email delivery,  
or unavailable inventory produce a terminal suppression reason. Invalid or  
inconsistent upstream payloads, Shopify transport failures, and provider  
failures produce bounded machine codes and use the retry/failure transition.  
Raw provider errors never cross the adapter boundary.

The future Resend adapter must use the deterministic idempotency key already  
defined by the recovery sequence. This covers the unavoidable crash window  
where Resend accepts a request but the `sent` transition is not committed.

## Security

- RPC functions use `SECURITY INVOKER`, fully-qualified object names, and  
    `search_path = pg_catalog`.
    
- `PUBLIC`, `anon`, and `authenticated` receive no function execution.
    
- Only backend `service_role` receives schema usage and function execution.
    
- Worker IDs and error codes are length- and character-bounded.
    
- Function inputs validate limits, lease duration, timestamps, retry time,  
    provider IDs, and suppression reasons.
    
- Claimed rows contain Shopify GIDs and scheduling metadata only.
    

## Verification

The acceptance suite must prove:

- two claimers cannot own the same row;
    
- expired processing rows are reclaimable while active leases are not;
    
- stale owners cannot renew or transition a reclaimed row;
    
- terminal rows never return to processing;
    
- retries become terminal at the configured attempt limit;
    
- unauthorized Shopify state never calls delivery;
    
- delivery cannot run when lease renewal fails;
    
- authorized state calls delivery once with the deterministic idempotency key;
    
- all summaries and persisted values remain free of email and recovery URLs.
    

## Sources

- [Shopify Abandonment](https://shopify.dev/docs/api/admin-graphql/2026-07/objects/Abandonment)
    
- [Shopify abandonmentByAbandonedCheckoutId](https://shopify.dev/docs/api/admin-graphql/2026-07/queries/abandonmentByAbandonedCheckoutId)
    
- [Shopify AbandonmentEmailState](https://shopify.dev/docs/api/admin-graphql/2026-07/enums/AbandonmentEmailState)
    
- [PostgreSQL SELECT / SKIP LOCKED](https://www.postgresql.org/docs/current/sql-select.html)
    
- [Supabase database functions](https://supabase.com/docs/guides/database/functions)
    
- [Supabase securing the Data API](https://supabase.com/docs/guides/api/securing-your-api)
    
- [Supabase JavaScript RPC](https://supabase.com/docs/reference/javascript/rpc)
