# Task 1 report: standalone order tokens and product identifier guards

## Scope and documentation status

Implemented the approved Task 1 residual-safety remediation only. The changed
server boundary recognizes standalone `#12345` and `UTE-12345` as the existing
enumerated `order` handoff before any adapter is called. Explicit nearby product
identifier labels prevent the same values, and formatted product-number values,
from being mistaken for order tokens or telephone numbers.

Documentation status: sufficient, current local repository documentation and
types were available before implementation. Reviewed the repository operating
contract, `PLAN.md`, `DEPLOYMENT.md` customer-assistant zero-default gate,
`FLOW.md`, the approved assistant design, current assistant protocol/types, and
Node 24 `node:test` types. The approved design requires concrete order references
to hand off without Shopify or model/provider calls and keeps order lookup out of
scope for v1. No external API behaviour or provider configuration was changed.

## TDD evidence

### RED

Command:

```text
pnpm exec tsx --test src/lib/customer-assistant/server/resolveAssistantHandoff.test.ts src/lib/customer-assistant/server/answerAssistantRequest.test.ts
```

Result: exit 1; 57 passed, 4 failed.

The expected failures were:

- standalone `#12345` did not return `order`;
- standalone `UTE-12345` did not return `order`;
- the full request-path zero-adapter test for `#12345` received no `order`
  handoff;
- labelled `Produktnummer 400 00 000` was incorrectly routed as
  `personal_data` because formatted-phone detection had no product-label guard.

### GREEN

All final checks used the project Node 24.17.0 runtime explicitly:

```text
task_node_bin=/Users/kristofferohnstadhjelmeland/.nvm/versions/node/v24.17.0/bin; PATH="$task_node_bin:$PATH" pnpm exec tsx --test src/lib/customer-assistant/server/resolveAssistantHandoff.test.ts src/lib/customer-assistant/server/answerAssistantRequest.test.ts
```

Result: exit 0; 62 passed, 0 failed.

```text
task_node_bin=/Users/kristofferohnstadhjelmeland/.nvm/versions/node/v24.17.0/bin; PATH="$task_node_bin:$PATH" pnpm exec tsx --test src/lib/customer-assistant/**/*.test.ts
```

Result: exit 0; 155 passed, 0 failed.

```text
task_node_bin=/Users/kristofferohnstadhjelmeland/.nvm/versions/node/v24.17.0/bin; PATH="$task_node_bin:$PATH" pnpm exec tsc --noEmit -p tsconfig.customer-assistant.json
```

Result: exit 0.

```text
task_node_bin=/Users/kristofferohnstadhjelmeland/.nvm/versions/node/v24.17.0/bin; PATH="$task_node_bin:$PATH" pnpm exec eslint src/lib/customer-assistant/server/resolveAssistantHandoff.ts src/lib/customer-assistant/server/resolveAssistantHandoff.test.ts src/lib/customer-assistant/server/answerAssistantRequest.test.ts
```

Result: exit 0.

```text
task_node_bin=/Users/kristofferohnstadhjelmeland/.nvm/versions/node/v24.17.0/bin; PATH="$task_node_bin:$PATH" pnpm exec prettier --check src/lib/customer-assistant/server/resolveAssistantHandoff.ts src/lib/customer-assistant/server/resolveAssistantHandoff.test.ts src/lib/customer-assistant/server/answerAssistantRequest.test.ts
```

Result: exit 0; all matched files use Prettier code style.

`git diff --check` also passed.

## Changed files

- `src/lib/customer-assistant/server/resolveAssistantHandoff.ts`
  - Added Unicode-aware concrete order-token candidates for `#` and `UTE-` plus
    at least five digits.
  - Added deterministic product-identifier label guards for `produktnummer`,
    `varenummer`, `artikkelnummer`, `SKU`, and `modellnummer` before or after a
    candidate.
  - Applied that guard to formatted-phone and existing Luhn-bounded payment
    detection without changing raw email, natural order/payment/complaint, or
    repeated-failure routing.
- `src/lib/customer-assistant/server/resolveAssistantHandoff.test.ts`
  - Added direct order-token, labelled formatted product number, labelled product
    token, and unlabelled-short-number regression coverage.
- `src/lib/customer-assistant/server/answerAssistantRequest.test.ts`
  - Proved both standalone token forms make zero Shopify, knowledge, and
    recommendation adapter calls.
  - Proved a restricted token from an earlier user turn is caught before any
    adapter call.

## Self-review

- `answerAssistantRequest()` continues to join every user turn before invoking
  `resolveAssistantHandoff()`, so a restricted historical turn cannot reach an
  adapter.
- Concrete token recognition is bounded by Unicode letter/number boundaries and
  does not classify an arbitrary unlabelled short number as an order.
- Product-label guards are candidate-local (48 characters on either side),
  deterministic, and apply symmetrically to order-token and formatted-phone
  paths. Existing Luhn validation remains intact for payment candidates.
- No deployment, environment, provider, Shopify, database, telemetry, or other
  external state was accessed or mutated. Unrelated dirty worktree changes were
  left untouched.

## Commit

`5c6db4337` — `fix(assistant): hand off standalone order tokens`

## Concerns

None. The shell defaulted to Node 26 for initial exploratory commands, so final
verification was rerun explicitly under the repository's Node 24.17.0 runtime.
