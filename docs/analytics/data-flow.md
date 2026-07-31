# Canonical analytics data flow

## Current implemented flow

```mermaid
flowchart LR
  UI[UI / Browser]
  Reporter[Event reporter]
  DL[dataLayer]
  Collector[Shared canonical collector]
  API[Next.js canonical event API]
  Validate[Zod validation and normalization]
  Tx[Direct PostgreSQL transaction]
  Ledger[(marketing.event_ledger)]
  Outbox[(ops.provider_dispatch_attempts)]
  After[Next.js after]
  Registry[33-worker global registry]
  Cron[Provider outbox cron every 5 min]
  Google[Google Data Manager]
  GoogleStatus[Google status cron]
  Meta[Meta CAPI]
  WebGTM[Web GTM]
  SGTM[sGTM via /__sgtm]
  GA4[GA4]
  UET[Microsoft UET browser]
  DLQ[(ops.dead_letter_events)]
  Shopify[Shopify webhooks]

  UI --> Reporter
  Reporter --> DL
  Reporter --> Collector
  Collector --> API
  API --> Validate
  Validate --> Tx
  Tx --> Ledger
  Tx --> Outbox
  API --> After
  After --> Registry
  Outbox --> Cron
  Cron --> Registry
  Registry --> Google
  Registry --> Meta
  Registry --> MicrosoftCAPI[Microsoft UET CAPI purchase]
  Registry --> DLQ
  Google --> GoogleStatus
  GoogleStatus --> Outbox
  GoogleStatus --> DLQ
  DL --> WebGTM
  WebGTM --> SGTM
  SGTM --> GA4
  WebGTM --> UET
  Shopify --> Validate
```

The `After -> Registry` edge is the confirmed P0 (DEV-001): every
successful request invokes every registered worker, not only
attempts created by that request. Microsoft UET CAPI purchase is
an active registry worker (`microsoft_uet:purchase`); other
Microsoft server events remain `blocked_no_worker`.

## Consent and identity flow

```mermaid
flowchart TD
  Default[Default denied Consent Mode v2]
  GTM[Web GTM tag owns Cookiebot loader]
  CMP[Cookiebot response]
  Snapshot[Canonical consent snapshot]
  Event[Canonical event]
  Analytics{Analytics granted?}
  Marketing{Marketing granted?}
  Preferences{Preferences granted?}
  GA[GA client ID / ga cookie]
  Click[Click IDs and fbp/fbc]
  External[First-party external ID]
  Contact[SHA-256 email / phone]
  Location[Browser-permission location]
  Server[Server IP / user agent]
  Plan[Provider dispatch planner]

  Default --> GTM
  GTM --> CMP
  CMP --> Snapshot
  Snapshot --> Event
  Event --> Analytics
  Event --> Marketing
  Event --> Preferences
  Analytics -->|yes| GA
  Marketing -->|yes| Click
  Marketing -->|yes| External
  Marketing -->|yes| Contact
  Preferences -->|yes and browser source| Location
  Event --> Server
  GA --> Plan
  Click --> Plan
  External --> Plan
  Contact --> Plan
  Location --> Plan
  Server --> Plan
```

## Atomic acceptance

```mermaid
sequenceDiagram
  participant API as Canonical route
  participant DB as PostgreSQL transaction
  participant L as event_ledger
  participant O as provider_dispatch_attempts

  API->>DB: begin
  DB->>L: insert on conflict do nothing
  alt duplicate idempotency key
    L-->>DB: no row
    DB-->>API: commit duplicate
  else inserted
    loop each eligible provider
      DB->>O: insert attempt on conflict do nothing
    end
    alt all dispatch inserts succeed
      DB-->>API: commit accepted
    else any dispatch insert fails
      DB-->>API: rollback ledger and attempts
    end
  end
```

## Provider status lifecycle

```mermaid
stateDiagram-v2
  [*] --> pending
  pending --> processing
  retry_scheduled --> processing
  processing --> processing: reclaim after 10 minutes
  processing --> retry_scheduled: retryable failure
  processing --> accepted_unverified: adapter receipt
  processing --> dead_lettered: permanent/exhausted/invalid
  pending --> skipped_unqualified: prerequisite absent at planning

  accepted_unverified --> succeeded: Google status SUCCESS
  accepted_unverified --> accepted_unverified: Google SUCCESS with warnings
  accepted_unverified --> accepted_unverified: Google PROCESSING/unknown
  accepted_unverified --> dead_lettered: Google FAILED/PARTIAL_SUCCESS

  succeeded --> [*]
  skipped_unqualified --> [*]
  dead_lettered --> [*]
```

The state diagram is the **local attempt lifecycle**. It does not
describe attribution or dedupe. Meta and Microsoft currently stop
at `accepted_unverified`; an administrative/data repair is
historical classification, not provider confirmation. Google can
reach provider-confirmed `succeeded` only through its
request-status reconciliation. See
[`provider-finality-runbook.md`](provider-finality-runbook.md)
for the three-axis model and evidence requirements.
