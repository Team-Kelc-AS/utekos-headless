# Swagger standardization evidence — 2026-08-15

Organization ruleset: `kelc`

| Artifact                                                          | Scan surface                                     | Result   |
| ----------------------------------------------------------------- | ------------------------------------------------ | -------- |
| `contracts/domains/utekos-common/0.1.0/domain.json`               | Raw definition                                   | 0 issues |
| `contracts/openapi/utekos-events/0.1.0/openapi.resolved.json`     | Raw, self-contained definition                   | 0 issues |
| `contracts/openapi/utekos-events/0.1.0/openapi.swaggerhub.json`   | Raw definition with live UtekosCommon references | 0 issues |
| `contracts/asyncapi/utekos-provider-dispatch/0.1.0/asyncapi.json` | Raw AsyncAPI 3.1.0 definition                    | 0 issues |
| `kelc/UtekosEventsAPI/0.1.0`                                      | SwaggerHub Registry version                      | 0 issues |

The local artifacts now also embed `x-utekos-event-delivery` on
all 27 operations. Each extension carries the characterized
browser/server provider rules from the 33-event parameter
contract. The expanded `0.1.0` definition was saved to
SwaggerHub, fetched back, and compared with the repository
artifact after deterministic JSON key ordering. Both canonical
forms contained 251,379 characters and produced the same
comparison hash. The Registry standardization scan then returned
0 issues.

The raw connector scan used the same schemas, paths, references,
and `x-utekos-event-delivery` metadata with presentation-only
examples and descriptions removed to remain below the connector
transport limit. It returned 0 issues for both the API and
Domain. The full stored API was scanned through the Registry
surface and also returned 0 issues.

Registry URL:
<https://app.swaggerhub.com/apis/kelc/UtekosEventsAPI/0.1.0>

The stored API definition was fetched back through the Registry
API and its normalized JSON matched `openapi.swaggerhub.json`
exactly. The stored Domain was reloaded from SwaggerHub's editor,
parsed from its YAML representation, and matched the local
`domain.json` semantically, including all 24 schemas.

The pre-existing `kelc/UtekosEventsAPI/1.0.0` Petstore shell also
returned 0 standardization issues. This is useful negative
evidence: a governance pass proves conformance to configured
rules, not that a definition describes the Utekos implementation.
Version `1.0.0` was not modified.

The first raw API scan attempt used a formatted, fully inlined
artifact that exceeded the connector transport output limit and
was rejected as malformed after truncation. The final scan inputs
were valid compact JSON, and the self-contained artifact was
changed from repeated full inlining to bundled reusable
components. Only the successful final results above are
acceptance evidence.

## Provider Dispatch 0.1.0

The generated AsyncAPI 3.1.0 document passed the official
AsyncAPI CLI 6.0.2 validator with zero errors, warnings,
information items, or hints. The raw Swagger standardization scan
against the `kelc` ruleset also returned zero issues.

No `UtekosProviderDispatchAPI` Registry object was created in
this run. The connected Swagger create/update operation is
currently fixed to Registry version `1.0.0`, while this
characterized baseline is explicitly `0.1.0`. Publishing it under
a different Registry version would break the frozen-version
contract, so the remote publication and fetch-back equality gate
remain open rather than being reported as complete.
