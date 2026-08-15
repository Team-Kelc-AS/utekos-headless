# Utekos API contracts

This directory contains versioned API contracts characterized
from the repository implementation. The runtime TypeScript and
Zod schemas remain authoritative for what the application
currently accepts; generated contract files must not be edited by
hand.

## Structure

- `domains/utekos-common/0.1.0/domain.json`: reusable SwaggerHub
  Domain components.
- `openapi/utekos-events/0.1.0/openapi.json`: Utekos Events API
  source contract with relative references to UtekosCommon.
- `openapi/utekos-events/0.1.0/openapi.resolved.json`:
  self-contained import and scan artifact for tools that cannot
  resolve repository-relative references.
- `openapi/utekos-events/0.1.0/openapi.swaggerhub.json`: registry
  import artifact with official
  `api.swaggerhub.com/domains/kelc/UtekosCommon/0.1.0`
  references.
- `readyapi/utekos-events/characterization-cases.json`:
  deterministic characterization case manifest.
- `events/utekos-event-delivery/0.1.0/parameter-contract.json`:
  complete canonical/browser/server provider parameter rules for
  all 33 catalog events.
- `reports/utekos-events-0.1.0-implementation-matrix.md`:
  route-to-implementation traceability.

## Generate and verify

Run these commands from the repository root with the pinned
Node.js and pnpm versions:

```sh
pnpm contracts:events:generate
pnpm contracts:events:check
pnpm contracts:events:test
```

`contracts:events:generate` writes every generated artifact from
the explicit catalog and the live Zod schemas.
`contracts:events:check` fails if committed artifacts drift from
those sources. `contracts:events:test` verifies complete route
coverage, implementation-file traceability, Zod examples, OpenAPI
schema parity, and the characterized HTTP outcomes.

## Change discipline

1. Change the runtime route, handler, or Zod schema first.
2. Update `scripts/contracts/utekosEventsContractCatalog.ts` when
   route metadata or examples change.
3. Regenerate the artifacts.
4. Review the implementation matrix and contract diff together.
5. Run the contract checks before publishing a new immutable
   SwaggerHub version.

The `0.1.0` artifacts were characterized against repository
commit `97a0a4538f9682a2b210e50b770ce59f826b42ac`. They are not
evidence that a SwaggerHub registry object, ReadyAPI project,
deployment, or production provider has been updated.
