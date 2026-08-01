# Synthetic collector dispatch guard — 2026-08-01

## Classification

The production Cookiebot diagnostic was controlled test traffic,
but it exposed a real test-hygiene gap: its `codex_*` campaign
marker was classified as `synthetic_client` by the Vercel Log
Drain while its protected browser collector requests were not
cryptographically marked as synthetic. BotID correctly treated the
interactive browser as human or unknown, so those requests entered
the canonical ledger and provider outbox.

This is not evidence that BotID fails to exclude a verified bot.
The edge drain's bounded campaign prefix is an analytics
classification, while the collector deliberately trusts only BotID
or a verified synthetic signature. The diagnostic supplied only the
former.

The controlled rows were deleted transactionally after the audit:
3 edge observations, 3 consent observations, 10 ledger events, 15
provider attempts and 2 trace observations. The after-check returned
zero rows. Seven Meta and eight Google attempts had already reached
`accepted_unverified`; provider acceptance cannot be retracted and
does not prove provider reporting or attribution.

## Guard contract

A production synthetic browser run must sign its initial document
request with the existing short-lived headers:

- `x-utekos-synthetic-timestamp`;
- `x-utekos-synthetic-signature`, HMAC-SHA256 over
  `METHOD + "\n" + PATHNAME + "\n" + TIMESTAMP`.

The proxy verifies those headers before returning HTML. A valid
navigation receives a separate, `HttpOnly`, `Secure`, first-party
synthetic-correlation cookie signed with the landing-observability
secret. Protected consent and canonical-event collectors verify that
cookie before BotID and return the existing synthetic exclusion
response before ledger persistence or provider dispatch. The cookie
expires after 30 minutes and is explicitly cleared by the next
unsigned document navigation.

The client never receives either server secret, no authentication
token is added to the landing URL, and no database schema changed.
An unsigned `codex_*` UTM remains insufficient to suppress real
marketing events.

BotID remains the independent classifier for ordinary protected
requests. Utekos follows Vercel's current Next.js contract by
initializing protected browser routes with `initBotId()` and applying
`checkBotId()` on the server. See [Get Started with
BotID](https://vercel.com/docs/botid/get-started) and [BotID
overview](https://vercel.com/docs/botid).

## Verification

- Targeted Node tests: 18 passed, 0 failed. They prove direct signed
  collector exclusion, signed document-to-cookie propagation,
  collector exclusion from the propagated cookie, expiry rejection
  and clearing on the next unsigned document.
- Targeted ESLint: passed.
- TypeScript `tsc --noEmit`: passed.
- The BotID loader patch behavior test passed for both ESM and CJS.
- Vercel production deployment
  `dpl_9DiA1WQgtNj6XYh5d7keRWy1Wfkv` completed and was aliased to
  `utekos.no`. Its cloud build compiled, typechecked and generated all
  134 static pages.
- The encrypted synthetic signing secret is configured for Vercel
  Production and Preview. It was generated and passed directly to
  Vercel without being printed or written to a repository file.
- A production signed-document canary returned HTTP 200 and the
  synthetic-correlation cookie. The following protected PageView
  request returned HTTP 204, `synthetic`, and `no-store`.
- Warehouse verification found one edge row, one trace row and zero
  consent, ledger or provider rows for that canary. The two
  observations were deleted after verification.
- A consent-denied production browser reload completed with the
  expected title and H1, one BotID `p.js` resource at HTTP 200, KPSDK
  present, Cookiebot explicit, and one Klarna API resource. Sentry had
  zero KPSDK issues seen since the deployment.
- All active product handles and the three active Meta destinations
  returned HTTP 200. Both HTTP/`www` redirect chains preserved the
  synthetic `fbclid` and UTM values. The production GTM/sGTM smoke
  returned HTTP 200, `no-store`, and no Vercel cache hit.
- Vercel reported zero error-level log rows for the deployment during
  the completion window.

## Follow-up controlled-probe classification

A later 24-hour health read contained six Meta-signal edge documents without
`fbclid`. Exact-time correlation with Vercel runtime activity identified five
as Utekos-controlled HTTP or browser probes. Before mutation, a bounded query
proved exactly five candidate edge rows and zero matching consent, ledger or
provider-attempt rows. The five observations were retained and reclassified as
two `synthetic_client` and three `browser_automation` rows; no canonical event,
provider row or trace was deleted or replayed.

The post-check returned 138 of 139 qualifying human-or-unknown Meta landings
with `fbclid` (99.28 percent), 100-percent `fbc | fbclid`, 100-percent Meta API
acceptance, no dead letters and `healthy=true`. The remaining no-`fbclid` row
is a physical iOS landing with explicit denied consent and no PageView or
dispatch. This cleanup is not a substitute for signing future test documents:
all controlled production browser runs must use the cryptographic contract
above so classification is correct at ingestion.
