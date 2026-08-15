# ReadyAPI characterization baseline

`characterization-cases.json` is the implementation-derived test
manifest for Utekos Events API `0.1.0`. It identifies the
contract operation, request example, expected success surface,
shared negative cases, and source files for every event route.

## Import baseline

Use `../../openapi/utekos-events/0.1.0/openapi.resolved.json` as
the import artifact. It is intentionally self-contained because a
desktop import may not resolve repository-relative UtekosCommon
references.

After import, bind the server URL to an explicitly approved
environment. Do not run accepted-event cases against production:
a valid request can persist an event and schedule provider
dispatch. The local automated suite characterizes request
validation with injected dependencies and therefore does not
write to Supabase or downstream providers.

## Case groups

- One validated request example for each of the 27
  `POST /api/events/*` operations.
- Shared request-guard outcomes: `403`, `415`, `413`, and `400`
  for malformed JSON or an invalid event.
- Store outcomes: `202 accepted`, `200 duplicate`,
  `204 consent denied`, and `500 internal error`.
- Route-level traffic exclusion: `204` with
  `X-Utekos-Traffic-Classification` and an empty body.

## Current tooling boundary

No ReadyAPI project XML or executable ReadyAPI result is
committed in this baseline. ReadyAPI Desktop and its command-line
runner were not available in the execution environment, and the
connected SmartBear tools exposed API registry and governance
operations but no Functional Testing project API. Generating an
unverified proprietary project structure would make the baseline
less reliable.

The next controlled step is to import the resolved OpenAPI
document in ReadyAPI, translate the manifest into suites,
configure an isolated test store/provider-dispatch sink, and
export the reviewed project into this directory.
