# Governance evidence

Swagger standardization results for Utekos Events API `0.1.0` are
recorded here after scanning the self-contained
`openapi.resolved.json` artifact. The resolved form is the scan
input so local cross-file references cannot be mistaken for
missing registry dependencies.

UtekosCommon is a SwaggerHub Domain artifact and intentionally
has no `paths` object. A scanner that accepts only API
definitions cannot be treated as a valid Domain governance
result.

Registry publication is a separate evidence stage. A passing
local or raw-definition scan does not prove that SwaggerHub
contains the Domain or immutable API version.
