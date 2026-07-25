# Task 1 report — direction-neutral shared-option binding

- Date: 2026-07-25
- Base: `c877a472f0a870b1f867b8d33db6de6e0a19e189`
- Status: complete for the bounded local implementation scope
- Code commit: `e386cc5b3c3185f82193e3b4eefd18dac550c93c`
- External mutations: none

## Documentation status

`OPPDATERT OG TILSTREKKELIG` — implementation started only after
reviewing the repository operating contract, approved
shared-option plan and Task 1 brief, prior residual final-fix
report and findings, `PLAN.md`, the customer-assistant section of
`DEPLOYMENT.md`, the current resolver and complete orchestration
test surface, the installed local product/variant types, the
assistant Zod contracts and Storefront query, and current
official Shopify Storefront API 2026-07 documentation:

- [SelectedOption](https://shopify.dev/docs/api/storefront/latest/objects/SelectedOption)
  is a non-null name/value pair identifying a variant option
  selection.
- [ProductVariant](https://shopify.dev/docs/api/storefront/latest/objects/ProductVariant)
  exposes non-null `selectedOptions` and `availableForSale`.

The installed assistant boundary in
`src/lib/customer-assistant/assistantProtocol.ts` and the query
in `src/lib/customer-assistant/server/shopifyAssistantCatalog.ts`
use the same name/value pair and boolean availability contract.
The wider storefront types in `types/product/ProductTypes.ts` and
`types/product/ShopifyProductVariant.ts` were also checked. No
undocumented provider field or API behavior is used.

## Outcome

- Removed the direction-wide `100`-point penalty from explicit
  option matching. Every syntactically valid name/value candidate
  is now scored in the same coordinate system whether the name
  precedes or follows the value.
- Explicit connectors (`er`, `:`, `=`, `/`, `#`, `-`, and opening
  parenthesis) outrank plain adjacency; plain adjacency outranks
  a comma-separated candidate. Local connector distance breaks
  ties inside the same specificity rank. This preserves the
  intended `Detaljfarge, Blå hovedfarge` binding without allowing
  a closer postposed plain name to steal an explicitly connected
  value.
- Preserved the existing connector grammars and
  48-character/clause boundaries; this change does not make any
  previously invalid connector valid.
- Replaced nullable explicit binding with a discriminated result:
  `none`, `selected`, or `ambiguous`.
- Equal-best candidates are deduplicated by normalized dimension
  name. A tie across different dimensions becomes explicit
  ambiguity and therefore the bounded clarification, independent
  of catalog or selected-option iteration order.
- Explicit ambiguity is consumed before the bare-value path, so
  the correction does not widen contextual bare-value acceptance.

## TDD evidence

All authoritative test and validation commands used Node
`24.17.0` and pnpm `11.17.0`.

### RED

The four orchestration regressions were added before production
code changed.

```text
task_node_bin=/Users/kristofferohnstadhjelmeland/.nvm/versions/node/v24.17.0/bin; PATH="$task_node_bin:$PATH" pnpm exec tsx --test src/lib/customer-assistant/server/answerAssistantRequest.test.ts
```

Result: exit 1; `44` tests, `42` passed, `2` failed.

- `Detaljfarge, Blå hovedfarge` returned the unsafe
  high-confidence `Utekos TechDown i Blå er tilgjengelig.`
  instead of clarification.
- The equal-distance `Detaljfarge Blå Hovedfarge` control
  returned the same unsafe answer instead of clarification.
- The direction control `Blå hovedfarge` and exact named pair
  `Detaljfarge Hvit, Blå hovedfarge` already passed in RED.

### First GREEN

The same focused command was rerun after the initial
direction-neutral implementation and formatting.

Result: exit 0; `44/44` passed. This included:

- the original wrong-dimension reproduction;
- value-before-name direction control;
- the mixed-direction exact named pair resolving canonical
  `Blå / Hvit`;
- an availability-neutral equal-distance tie under both normal
  and reversed catalog plus selected-option order.

### Review RED

Task review found that raw connector length alone allowed a
closer plain postposed name to outrank a genuinely explicit
name-before-value connector. Two retained orchestration tests,
covering six questions, were added before the follow-up
production change. The same focused command then returned exit 1;
`46` tests, `44` passed, `2` failed.

- `Hovedfarge: Blå Detaljfarge`, `Hovedfarge = Blå Detaljfarge`,
  `Hovedfarge er Blå Detaljfarge`, and
  `Hovedfarge ( Blå) Detaljfarge` all returned the wrong
  high-confidence `Detaljfarge=Blå` answer.
- `Hovedfarge: Blå Detaljfarge: Hvit` and
  `Hovedfarge ( Blå) Detaljfarge (Hvit)` clarified instead of
  resolving the exact unavailable `Blå / Hvit` variant.

### Final GREEN

Connector-specificity ranking was added before direction-neutral
local distance, and the same focused command was rerun.

Result: exit 0; `46/46` passed, including every original,
control, adversarial-order, review and exact-pair regression.

## Full verification

### Complete assistant core and component suite

```text
task_node_bin=/Users/kristofferohnstadhjelmeland/.nvm/versions/node/v24.17.0/bin; PATH="$task_node_bin:$PATH" pnpm exec tsx --test src/lib/customer-assistant/**/*.test.ts src/components/customer-assistant/**/*.test.ts
```

Result: exit 0; `192/192` passed. The previously green 186 tests
remain green, including named pairs, connectors, separators,
negation, alternatives, numeric units, contextual bare replies,
historical ambiguity replacement, whole-product truth, mixed
availability, deterministic option-order labels, restricted-input
routing, privacy and strict Shopify contract checks.

### Assistant-scoped TypeScript

```text
task_node_bin=/Users/kristofferohnstadhjelmeland/.nvm/versions/node/v24.17.0/bin; PATH="$task_node_bin:$PATH" pnpm exec tsc --noEmit -p tsconfig.customer-assistant.json --pretty false
```

Result: exit 0.

### Focused ESLint

```text
task_node_bin=/Users/kristofferohnstadhjelmeland/.nvm/versions/node/v24.17.0/bin; PATH="$task_node_bin:$PATH" pnpm exec eslint src/lib/customer-assistant/server/resolveAssistantStockAvailability.ts src/lib/customer-assistant/server/answerAssistantRequest.test.ts
```

Result: exit 0.

### Focused Prettier

```text
task_node_bin=/Users/kristofferohnstadhjelmeland/.nvm/versions/node/v24.17.0/bin; PATH="$task_node_bin:$PATH" pnpm exec prettier --check src/lib/customer-assistant/server/resolveAssistantStockAvailability.ts src/lib/customer-assistant/server/answerAssistantRequest.test.ts
```

Result: exit 0; both files use Prettier style.

```text
git diff --check -- src/lib/customer-assistant/server/resolveAssistantStockAvailability.ts src/lib/customer-assistant/server/answerAssistantRequest.test.ts
```

Result: exit 0.

### Clean optimized build

Build and browser verification used a temporary snapshot created
from the exact base plus only the two owned source/test files.
The snapshot had its own `.next` and Playwright output.
Dependencies were an APFS clone, and the existing local build
environment file was linked read-only into the snapshot.

```text
task_node_bin=/Users/kristofferohnstadhjelmeland/.nvm/versions/node/v24.17.0/bin; PATH="$task_node_bin:$PATH" NEXT_TELEMETRY_DISABLED=1 pnpm build
```

Result: exit 0; Next.js `16.2.9` compiled successfully,
TypeScript passed, all `126/126` static pages generated, and
`.next/BUILD_ID` was `NdohXODqoAXd7B4udWDTJ`.

An initial snapshot setup used a symlinked `node_modules`. pnpm
stopped before prebuild or compilation with
`ERR_PNPM_ABORTED_REMOVE_MODULES_DIR_NO_TTY`. No shared
dependency or source was removed. Replacing only the temporary
symlink with the APFS clone allowed the canonical command above
to pass.

### Preview Playwright and graphs

```text
task_node_bin=/Users/kristofferohnstadhjelmeland/.nvm/versions/node/v24.17.0/bin; PATH="$task_node_bin:$PATH" NEXT_TELEMETRY_DISABLED=1 pnpm exec playwright test --config playwright.assistant.config.ts
```

Result: exit 0; `10/10` passed.

- Positive preview graph: exactly one assistant chunk,
  `/_next/static/chunks/src_1ejae-9._.js`.
- Positive-percent holdout graph: `[]`.
- Excluded-route graph: `[]`.

### Optimized production-zero Playwright and graph

```text
task_node_bin=/Users/kristofferohnstadhjelmeland/.nvm/versions/node/v24.17.0/bin; PATH="$task_node_bin:$PATH" NEXT_TELEMETRY_DISABLED=1 CUSTOMER_ASSISTANT_E2E_MODE=production-zero pnpm exec playwright test --config playwright.assistant.config.ts
```

Result: exit 0; `1/1` passed; production-zero graph was `[]`, no
launcher was mounted, and no assistant bucket was created. The
two localhost CSP report-only entries for blocked `utekos.no`
scripts were expected and did not fail the gate.

### Legacy, inventory, telemetry and privacy scans

```text
if rg -n -i 'chatbase|legacy (assistant|bot|chat)|old (assistant|bot|chat)' src/lib/customer-assistant src/app/api/customer-assistant src/components/customer-assistant tests/customer-assistant --glob '*.{ts,tsx}'; then exit 1; else printf 'legacy-reference check: no matches\n'; fi
```

Result: exit 0; no legacy assistant references.

```text
if rg -n -i 'quantityavailable|inventoryquantity|only [0-9]+ left|[0-9]+ (igjen|på lager)' src/lib/customer-assistant src/app/api/customer-assistant src/components/customer-assistant --glob '*.{ts,tsx}' -g '!*.test.ts'; then exit 1; else printf 'inventory check: no production quantity or scarcity matches\n'; fi
```

Result: exit 0; no production quantity or scarcity claims.

```text
if rg -n -i "@/lib/(analytics|tracking)|window\.dataLayer|dataLayer\.push|\bgtag\s*\(|\bposthog(?:\.|\s+from)|\breport[A-Z][A-Za-z0-9_]*\s*\(|\btrackEvent\s*\(|\bcapture\s*\(" src/lib/customer-assistant src/app/api/customer-assistant src/components/customer-assistant --glob '*.{ts,tsx}' -g '!*.test.ts'; then exit 1; else printf 'telemetry check: no production assistant instrumentation matches\n'; fi
```

Result: exit 0; no production assistant telemetry integration.

```text
rg -n -F 'JSON.stringify({ sessionId, intent, outcomeCode, latencyMs })' src/lib/customer-assistant/server/createAssistantRouteHandler.ts >/dev/null
if rg -n -U "console\.(?:log|info|warn|error)\([\s\S]{0,240}(?:question|buyerIp|messages|parts|provider|error\.message)" src/lib/customer-assistant src/app/api/customer-assistant src/components/customer-assistant --glob '*.{ts,tsx}' -g '!*.test.ts'; then exit 1; else printf 'privacy check: structured allowlist present; no transcript, IP, or provider-detail logging match\n'; fi
```

Result: exit 0; the structured log allowlist remains present and
the scan found no transcript, IP or provider-detail logging path.
The complete route tests also passed their concrete privacy
assertions.

## Task review

The first review returned specification `NOT APPROVED` and
quality `NOT APPROVED` with one Important finding: raw connector
length could let a closer plain postposed name steal a value from
the explicit `:`, `=`, `er`, or parenthesized pair. That finding
entered the bounded RED/GREEN fix loop above.

The independent re-review of the final diff returned:

- Specification: `APPROVED`
- Quality: `APPROVED`
- Critical findings: none
- Important findings: none
- Minor findings: none

## Changed files

- `src/lib/customer-assistant/server/resolveAssistantStockAvailability.ts`
- `src/lib/customer-assistant/server/answerAssistantRequest.test.ts`
- `.superpowers/sdd/2026-07-25-utekos-ai-assistant-shared-option-binding/task-1-report.md`

## Self-review

- The fix changes only explicit name/value candidate ranking and
  tie propagation.
- Direction is no longer a scoring factor. Explicit connector
  specificity is ranked first and local connector distance
  second, identically in both directions.
- Candidate grammar, negation, alternative, numeric-unit,
  historical relevance and contextual bare-value functions are
  unchanged.
- Collecting every best-scored dimension before choosing prevents
  stable-sort or catalog order from deciding a cross-dimension
  tie; same-dimension duplicate mentions still resolve normally.
- Marking an explicit tie as consumed prevents it from
  re-entering the bare-value path, and explicit ambiguity still
  permits a later user turn to replace that dimension state
  through the existing chronological resolver.
- Variant filtering still requires exact normalized Shopify
  option name/value pairs and renders canonical Shopify values in
  first-seen option order.
- No public schema, response shape, inventory field, logging,
  telemetry, restricted-input boundary or integration changed.

## External proof boundary

No deployment, push, environment-variable change, provider write,
GCP/Supabase/Shopify/Vercel/GTM mutation, test order, telemetry
event, resend, or rollout change was performed. The clean build
made only the repository's normal read-only Shopify catalog
access during static generation. Local tests prove the exact
commit candidate and its browser rollout gates; they are not
production deployment or production-runtime proof.

Unrelated dirty files and processes in the shared checkout were
preserved and excluded from staging, the clean snapshot, and both
commits.
