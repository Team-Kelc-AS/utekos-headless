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
- Production deployment and a new provider smoke were not performed
  in this work unit.
