# Provider finality runbook

**Decision date:** 2026-07-31

**Scope:** Google Data Manager, Meta Conversions API and
Microsoft UET Conversions API

**Runtime impact:** none; this runbook classifies existing
evidence

## Invariant

A successful local call is not the same fact as
provider-confirmed delivery. Provider-confirmed delivery is not
proof that an event was deduplicated, matched, attributed to an
ad or used by bidding.

Every operational statement must therefore name all three
independent axes:

1. **Attempt status** — what the Utekos worker did locally.
2. **Provider delivery** — what the provider has authoritatively
   confirmed.
3. **Attribution and dedupe** — the later external effect, if
   separately observable.

If one axis has no evidence, report it as `unknown`; if the
evidence surface cannot be accessed, report it as `blocked`.
Never copy certainty from one axis to another.

## Attempt-status vocabulary

`ops.provider_dispatch_attempts.status` is the local attempt
lifecycle. Its terminality applies only to local processing
unless the row also contains the provider evidence required
below.

| Attempt status        | Local meaning                                                                                                           | Provider-delivery claim                                                                                                   | Attribution/dedupe claim        |
| --------------------- | ----------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- | ------------------------------- |
| `pending`             | Persisted and eligible for an initial claim                                                                             | Unknown; no send proven                                                                                                   | Unknown                         |
| `processing`          | Leased by a worker                                                                                                      | Unknown; a network outcome may not exist yet                                                                              | Unknown                         |
| `retry_scheduled`     | A retryable adapter failure was classified and a due time stored                                                        | Unknown; an ambiguous transport failure must not be treated as rejection or acceptance                                    | Unknown                         |
| `accepted_unverified` | The adapter returned its expected receipt and local retry stops                                                         | Acceptance observed only; not provider-confirmed terminal delivery                                                        | Unknown                         |
| `succeeded`           | Local terminal success classification                                                                                   | Provider-confirmed only for Google rows carrying reconciliation evidence; historical/admin-classified rows remain unknown | Unknown                         |
| `dead_lettered`       | Local retry workflow stopped after an invalid payload, permanent/exhausted failure or provider-confirmed Google failure | Depends on `response_semantics`; local dead letter alone is not provider rejection                                        | Unknown                         |
| `skipped_unqualified` | Planner deliberately did not send because a required provider prerequisite was absent                                   | Not attempted                                                                                                             | Not applicable for that attempt |
| `failed`              | Legacy/non-current schema state; no current writer is known                                                             | Unknown                                                                                                                   | Unknown                         |

Additional rules:

- `accepted_unverified` is terminal for the completed local send
  attempt, but nonterminal or unavailable on the
  provider-delivery axis.
- A qualified skip requires a specific `skip_reason`, for example
  `missing_client_id`, `missing_msclkid` or `missing_capi_token`.
  It is not a provider failure.
- `retry_scheduled` preserves the original idempotency/dedupe
  key. A retry does not prove that the preceding request failed
  to reach the provider.
- `dead_lettered` is terminal only until an explicit, approved
  repair or replay. `ops.dead_letter_events.resolved_at`
  describes operational disposition, not retrospective provider
  delivery.
- A `succeeded` row without
  `response_semantics=provider_confirmed_success`, a provider
  status and the matching receipt must be described as
  **historically classified**, not provider-confirmed.

## Provider delivery decision matrix

| Provider evidence                                            | Attempt status                                                    | Provider delivery                                        | Terminal provider success?                                      | Attribution/dedupe                                                                                |
| ------------------------------------------------------------ | ----------------------------------------------------------------- | -------------------------------------------------------- | --------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| Google ingest receipt and request ID                         | `accepted_unverified`                                             | `observed`: request accepted for processing              | No                                                              | Unknown                                                                                           |
| Google `PROCESSING`                                          | `accepted_unverified`; `response_semantics=provider_processing`   | `observed`: still processing                             | No                                                              | Unknown                                                                                           |
| Google unknown status, poll error or 24-hour timeout         | `accepted_unverified`; status-specific semantics                  | `unknown` or `blocked`                                   | No                                                              | Unknown                                                                                           |
| Google `SUCCESS`, exactly one record, no errors or warnings  | `succeeded`; `provider_confirmed_success`                         | `confirmed`                                              | Yes, for provider processing only                               | Still unknown                                                                                     |
| Google `SUCCESS`, exactly one record, warnings present       | `accepted_unverified`; `provider_confirmed_success_with_warnings` | `confirmed with warnings`; polling stops                 | No clean-success promotion until the warning policy is resolved | Still unknown                                                                                     |
| Google `FAILED`, `PARTIAL_SUCCESS` or success-shape mismatch | `dead_lettered`; `provider_confirmed_failure`                     | `confirmed failure` or partial failure                   | No                                                              | Unknown                                                                                           |
| Meta `events_received=1` and optional `fbtrace_id`           | `accepted_unverified`; `provider_accepted_unverified`             | `observed`: API receipt                                  | No authoritative row-level reconciliation exists                | Unknown                                                                                           |
| Meta aggregate Events Manager/Dataset Quality evidence       | Attempt remains `accepted_unverified`                             | `observed` only at the reported aggregate and time grain | No row promotion                                                | Dedupe/match may be reported only at the provider's aggregate grain; attribution remains separate |
| Microsoft UET CAPI HTTP 200 and optional request ID          | `accepted_unverified`; `provider_accepted_unverified`             | `observed`: endpoint acceptance                          | No authoritative row-level reconciliation exists                | Unknown                                                                                           |
| Microsoft UET/goal/reporting dashboard evidence              | Attempt remains `accepted_unverified`                             | `observed` only at the dashboard/report grain            | No row promotion                                                | Attribute only when the reporting surface explicitly reports it at a defensible grain             |
| Missing prerequisite before dispatch                         | `skipped_unqualified`                                             | `not_attempted`                                          | No                                                              | Not applicable                                                                                    |
| Provider status surface unavailable or unauthorized          | Existing attempt status is unchanged                              | `blocked`                                                | No                                                              | `blocked`                                                                                         |

Warnings on a Google `SUCCESS` result are retained as
provider-confirmed processing with warnings, while the attempt
remains `accepted_unverified`. They do not establish attribution,
and they must be reviewed because the provider can ignore parts
of a record.

## Provider-specific evidence boundaries

### Google Data Manager

The current reconciliation worker is the only authoritative
row-level provider-finality path:

1. Ingest persists the request ID as `accepted_unverified`.
2. `RetrieveRequestStatus` is polled for executed
   (`validate_only=false`) requests.
3. Only `SUCCESS` with one processed record and no processing
   errors or warnings becomes clean provider-confirmed
   `succeeded`.
4. `SUCCESS` with warnings stops polling but remains
   `accepted_unverified` with
   `response_semantics=provider_confirmed_success_with_warnings`.
5. `PROCESSING`, unknown responses, polling errors and timeouts
   do not become `succeeded`.
6. `FAILED`, `PARTIAL_SUCCESS` and an invalid success shape are
   dead-lettered with provider evidence.

Google documents `SUCCESS`, `PROCESSING`, `FAILED` and
`PARTIAL_SUCCESS` as request-processing states and exposes
warnings/errors separately:

- [Retrieve request status](https://developers.google.com/data-manager/api/reference/rest/v1/requestStatus/retrieve)
- [Data Manager diagnostics](https://developers.google.com/data-manager/api/devguides/diagnostics)

### Meta Conversions API

`events_received=1`, `messages` and `fbtrace_id` are an immediate
API receipt. Meta's Events Manager event count is measured before
deduplication, policy discard and processing. Dedupe feedback,
event coverage, Event Match Quality and event volume are
aggregate diagnostics and cannot promote one outbox row.

The browser/CAPI contract may prove that the same event name and
event ID were sent on both channels. Actual deduplication still
requires a separate provider observation; attribution requires a
separate reporting observation.

- [Using the Conversions API](https://developers.facebook.com/documentation/ads-commerce/conversions-api/using-the-api)
- [Verify the setup](https://developers.facebook.com/documentation/ads-commerce/conversions-api/verifying-setup)
- [Conversions API best practices](https://developers.facebook.com/documentation/ads-commerce/conversions-api/best-practices)
- [Dataset Quality API](https://developers.facebook.com/documentation/ads-commerce/conversions-api/dataset-quality-api)

### Microsoft UET Conversions API

HTTP 200 is endpoint acceptance. Microsoft separately instructs
operators to verify received events under the UET tag and then
verify that conversions appear. `eventId`, `pageLoadId` and
`msclkid` support dedupe and attribution contracts; their
presence does not prove that either effect occurred.

The repository has no authoritative per-event status endpoint or
reconciliation worker for Microsoft. Rows therefore remain
`accepted_unverified` unless a future, officially documented
provider evidence path is implemented.

- [Microsoft UET Conversions API integration](https://learn.microsoft.com/en-us/advertising/guides/uet-conversion-api-integration?view=bingads-13)

## Read-only trace procedure

For a representative event:

1. Find the canonical event in `marketing.event_ledger` by
   `event_id` and `event_name`.
2. Join every `ops.provider_dispatch_attempts` row for that
   event.
3. Read local `status`, `attempt_count`, `dispatch_mode`,
   `skip_reason` and `response_semantics`.
4. Treat `response`, `request_id` and `validation_result` as the
   embedded adapter receipt; there is no separate receipt table.
5. For Google, require the stored `requestStatus`, checked
   timestamp, `provider_status` and `provider_confirmed` evidence
   before calling the row provider-confirmed.
6. For a dead letter, join `ops.dead_letter_events` and report
   both the attempt reason and unresolved/resolved disposition.
7. Query provider dashboards/APIs only at their actual grain.
   Never force an aggregate Meta or Microsoft observation onto an
   individual attempt.
8. Report the result as four labels: `confirmed`, `observed`,
   `unknown` and `blocked`.

## Representative production evidence

Read-only queries at `2026-07-31T01:51:42Z` traced the following
rows without reading event payloads or direct identifiers:

| Sample                                                                   | Ledger    | Attempt/receipt                                                                        | Provider delivery                       | Attribution/dedupe |
| ------------------------------------------------------------------------ | --------- | -------------------------------------------------------------------------------------- | --------------------------------------- | ------------------ |
| Google `view_item` attempt `4c5cf358-6a11-4259-bc69-7a500492f1f3`        | Confirmed | `succeeded`; request status `SUCCESS`; one record; `provider_confirmed=true`           | Confirmed terminal processing           | Unknown            |
| Google `view_item` attempt `8faba95a-7b80-4b1d-930e-0bb6cd11beb8`        | Confirmed | `accepted_unverified`; request status `PROCESSING`                                     | Observed, nonterminal                   | Unknown            |
| Meta `view_item` attempt `a01ecb9b-8d89-4593-a439-a6db14be3096`          | Confirmed | `accepted_unverified`; `events_received=1`; no messages                                | Observed API receipt                    | Unknown            |
| Microsoft `add_to_cart` attempt `6d35806a-fe96-474d-a8b3-a9057ddd2e48`   | Confirmed | `accepted_unverified`; HTTP 200; no request ID                                         | Observed endpoint acceptance            | Unknown            |
| Microsoft `purchase` attempt `89193dc6-d777-496c-ac33-1275d9c0f701`      | Confirmed | `skipped_unqualified`; `missing_msclkid`; zero attempts                                | Not attempted                           | Not applicable     |
| Google `select_promotion` attempt `66c26472-1a45-47c0-ae5a-96289471f864` | Confirmed | `dead_lettered`; adapter permanent error; linked dead-letter dispositions are resolved | No provider receipt; local failure only | Unknown            |

The Meta read API separately reported 170 server-side
`ViewContent` events in the most recent 24-hour query window and
EMQ 6.1 with hourly freshness. This is aggregate provider
evidence only. The latest stored Dataset Quality snapshot had
dedupe feedback `omitted_by_provider`; no row-level dedupe or
attribution was available. No equivalent authoritative Microsoft
per-event result was available.

Vercel production deployment `dpl_7aYMhUMJTxyiTtWL38Wkxh5QpzaL`
remained `READY` on main SHA
`7a9f19ed3f94cc08ee3140ddb4c99afe4af3d564`. Read-only runtime
logs showed HTTP 200 for the dispatch, Google status and
dispatch-health crons in the inspected two-hour window, with no
grouped runtime errors for those routes in 24 hours. HTTP 200
proves route execution, not provider delivery.

## Schema follow-up

The current schema can preserve the truthful model only by
combining the local `status` with free-form `response_semantics`,
receipt JSON and provider-specific fields. It cannot query the
three axes independently or represent the grain and authority of
external attribution/dedupe evidence.

Create a separate, migration-gated follow-up issue:

> **Split provider delivery and attribution evidence from attempt
> status**
>
> Add an append-only/read-model design for provider-delivery
> observations and attribution/dedupe observations. Each
> observation must record provider, attempt/event reference where
> available, evidence type, authority, grain, observed time,
> provider status and source reference. Keep
> `provider_dispatch_attempts.status` as the local attempt
> lifecycle. Define compatibility/backfill behavior for
> historical `succeeded` rows without promoting them. Include
> migration, RLS, retention, dashboards and rollout gates. Do not
> infer row-level finality from aggregate evidence.

No schema change, historical row promotion, replay or backfill
belongs in KRI-23.
