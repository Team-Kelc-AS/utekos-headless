# Final fix report — residual assistant safety

- Date: 2026-07-25
- Fix base: `4926a0d3c379f4a214e871a970affd78e61a57cf`
- Code commit: `766efe00a`
  (`fix(assistant): close residual safety gaps`)
- Final verdict: **READY for the bounded local implementation
  scope**

## Documentation status

`OPPDATERT` — the repository contracts, approved assistant
design, final review findings, deployment/rollout gates,
installed framework guidance, and current official Shopify
Storefront documentation were available before implementation.
The implementation uses only the documented product, variant,
`availableForSale`, and selected-option truth already present in
the bounded catalog schema. No code was based on an undocumented
provider field.

Relevant official references checked:

- <https://shopify.dev/docs/api/storefront/latest/objects/Product>
- <https://shopify.dev/docs/api/storefront/latest/objects/ProductVariant>
- <https://shopify.dev/docs/api/storefront/latest/objects/SelectedOption>

## Scope and outcome

The single final fix wave closed all six findings in
`final-review-findings.md`:

1. Restricted candidates are classified independently per user
   turn before any adapter call, so a product label cannot exempt
   data in another turn.
2. Compact Norwegian `+47` and `0047` telephone forms are routed
   safely.
3. Norwegian product-identifier labels support the reviewed
   definite forms and bounded separators, while exempting only
   their associated candidate.
4. Stock-option ambiguity is tracked per dimension; a later
   explicit choice replaces an earlier ambiguity while unresolved
   ambiguity still clarifies.
5. Stock values bind only to explicit option names, safe direct
   replies, or clause-complete stock/selection expressions.
   Shared values, numeric units, negation, alternatives, and
   arbitrary historical prose fail closed instead of inventing a
   high-confidence variant.
6. Formatted-phone boundaries use Unicode numeric semantics.

The stock resolver was extracted to
`resolveAssistantStockAvailability.ts` so chronological
option-state and candidate-local relevance rules are isolated
from orchestration. The final adversarial review returned `CLEAN`
for every finding and found no remaining reproducible
restricted-input adapter leak or high-confidence stock invention.

## TDD evidence

The original final-review tests were overlaid onto a detached
snapshot of the fix base before implementation and executed under
Node `24.17.0`:

```text
pnpm exec tsx --test \
  src/lib/customer-assistant/server/resolveAssistantHandoff.test.ts \
  src/lib/customer-assistant/server/answerAssistantRequest.test.ts
```

- Original RED: `77` tests, `64` passed, `13` failed. The
  failures reproduced all six documented findings.
- Original GREEN: `77/77` passed after the bounded
  implementation.

Additional self-review and adversarial RED-to-GREEN waves were
retained in the same focused tests:

- Same-clause numeric-unit collision: answer suite `39/40` ->
  `40/40`.
- Named-pair separators and negation: answer suite `38/40` ->
  `40/40`.
- Postposed Norwegian negation: answer suite `39/40` -> `40/40`.
- Natural complaint wording `Varen er ødelagt`: focused `76/78`
  -> `78/78`.
- Unicode-bound selection wording `Jeg ønsker M`: answer suite
  `39/40` -> `40/40`.
- Historical terrain/product collision (`sand` plus later `M`):
  answer suite `39/40` -> `40/40`.
- Adversarial ordinary-prose collisions
  (`Jeg vil ha sand i hagen.` and a verbose reply after a color
  clarification): reproduced high-confidence `M / Sand` before
  the clause-complete binding fix; final answer suite `40/40`.

## Final verification

All commands used Node `24.17.0` with pnpm `11.17.0`.

| Gate                                    | Final result          |
| --------------------------------------- | --------------------- |
| Focused handoff and orchestration tests | `78/78` passed        |
| Complete assistant core/component suite | `186/186` passed      |
| Assistant-scoped TypeScript             | Passed                |
| Focused ESLint                          | Passed                |
| Focused Prettier                        | Passed                |
| Staged diff check                       | Passed                |
| Legacy assistant reference scan         | No matches            |
| Numeric inventory-claim scan            | No production matches |
| Assistant telemetry scan                | No production matches |
| Independent adversarial review          | `CLEAN`, findings 1–6 |

The build/browser gates ran in a clean snapshot created from the
fix base plus only the five owned assistant files. This excluded
all unrelated dirty workspace changes.

- Optimized Next.js `16.2.9` build: passed.
- Final build ID: `tgxUOV2nnJlYgqzRV7qaW`.
- Preview Playwright: `10/10` passed.
- Preview graph evidence:
  - positive: exactly one `/_next/static/chunks/*.js` assistant
    path;
  - holdout: `[]`;
  - excluded routes: `[]`.
- Optimized production-zero Playwright: `1/1` passed.
- Production-zero graph: `[]`.

## External-state and proof boundary

No deployment, environment-variable change, provider write, test
order, test event, resend, or rollout change was performed. The
optimized build made only the repository's normal read-only
Shopify catalog access during static page generation. The
evidence proves the exact local commit candidate and its browser
rollout gates; it is not a production deployment or
production-runtime proof.

Unrelated dirty workspace files were preserved and excluded from
both the clean verification snapshot and the code commit.
