# Utekos AI Assistant Core Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build an accessible internal-preview shopping assistant that uses live Shopify truth, deterministic Utekos buying guidance, safe support fallbacks, and existing human contact channels.

**Architecture:** A focused client panel uses AI SDK UI transport to call a versioned Next.js Route Handler. Pure server orchestration validates the request, reads live product data through the existing Storefront client, applies deterministic product and escalation rules, and streams typed text/product/source/handoff parts. GCP and persistence are adapters with safe no-op/static implementations in this release.

**Tech Stack:** Next.js 16.2.9, React 19.2.7, TypeScript 6.0.3, Node 24, pnpm 11.17, AI SDK 6.0.194, `@ai-sdk/react` 4.0.40, Zod 4.4.3, Shopify Storefront API, Playwright 1.61.

## Global Constraints

- Apply every global constraint in `docs/superpowers/plans/2026-07-24-utekos-ai-assistant-program.md`.
- Do not persist a transcript in this release.
- Keep GCP and Supabase runtime calls disabled; their interfaces must be injectable for the next plans.
- Current public facts come from `comparisonData.ts`, `comfyrobeLandingSeo.ts`, `shippingReturnsContent.ts`, and the size-guide route.
- Availability displayed to a customer must come from an uncached Storefront request made for that assistant response.
- Do not display exact `quantityAvailable` or use scarcity language.

---

### Task 1: Add the AI UI dependency and typed assistant protocol

**Files:**
- Modify: `package.json`
- Modify: `pnpm-lock.yaml`
- Create: `src/lib/customer-assistant/assistantProtocol.ts`
- Test: `src/lib/customer-assistant/assistantProtocol.test.ts`

**Interfaces:**
- Produces: `AssistantIntent`, `AssistantChatRequest`, `AssistantProduct`, `AssistantRecommendation`, `AssistantHandoff`, `AssistantSource`, `AssistantDataParts`, `AssistantUIMessage`, `parseAssistantChatRequest()`, `getLastUserText()`, `projectTextOnlyMessages()`.
- Consumes: AI SDK `UIMessage` and Zod 4 schemas.

- [ ] **Step 1: Install the verified React client version**

Run:

```bash
pnpm add @ai-sdk/react@4.0.40
```

Expected: `package.json` and `pnpm-lock.yaml` change; installation exits 0.

- [ ] **Step 2: Write failing protocol tests**

Create `src/lib/customer-assistant/assistantProtocol.test.ts` with tests that parse one valid request, reject more than 12 messages, reject text longer than 800 characters, reject non-Utekos source URLs, prove `getLastUserText()` returns only the last user text part, and prove `projectTextOnlyMessages()` removes recommendation/source/handoff/status parts before the next request.

```ts
import assert from 'node:assert/strict'
import test from 'node:test'
import {
  getLastUserText,
  parseAssistantChatRequest
} from './assistantProtocol'

const request = {
  id: 'assistant-chat',
  sessionId: 'd8b18b30-9ce4-4a55-b40f-ffbc3bda9aa7',
  intent: 'product_help',
  messages: [{
    id: 'message-1',
    role: 'user',
    parts: [{ type: 'text', text: 'Jeg trenger noe til båten.' }]
  }],
  pageContext: { pathname: '/produkter', productHandle: null }
}

test('parses the bounded assistant request', () => {
  const parsed = parseAssistantChatRequest(request)
  assert.equal(parsed.intent, 'product_help')
  assert.equal(getLastUserText(parsed.messages), 'Jeg trenger noe til båten.')
})

test('rejects oversized conversation input', () => {
  assert.throws(() => parseAssistantChatRequest({
    ...request,
    messages: Array.from({ length: 13 }, (_, index) => ({
      id: `message-${index}`,
      role: 'user',
      parts: [{ type: 'text', text: 'Hei' }]
    }))
  }))
})

test('rejects an oversized user message', () => {
  assert.throws(() => parseAssistantChatRequest({
    ...request,
    messages: [{
      id: 'message-long',
      role: 'user',
      parts: [{ type: 'text', text: 'x'.repeat(801) }]
    }]
  }))
})
```

- [ ] **Step 3: Run the tests and confirm RED**

Run:

```bash
pnpm exec tsx --test src/lib/customer-assistant/assistantProtocol.test.ts
```

Expected: FAIL because `assistantProtocol.ts` does not exist.

- [ ] **Step 4: Implement the protocol**

Create strict Zod schemas with these locked values:

```ts
import type { UIMessage } from 'ai'
import { z } from 'zod'

export const assistantIntentSchema = z.enum([
  'product_help',
  'size_help',
  'stock_help',
  'shipping_returns',
  'other'
])

const textPartSchema = z.strictObject({
  type: z.literal('text'),
  text: z.string().trim().min(1).max(800)
})

const messageSchema = z.strictObject({
  id: z.string().min(1).max(100),
  role: z.enum(['user', 'assistant']),
  parts: z.array(textPartSchema).min(1).max(4)
})

export const assistantChatRequestSchema = z.object({
  id: z.string().max(100).optional(),
  sessionId: z.string().uuid(),
  intent: assistantIntentSchema,
  messages: z.array(messageSchema).min(1).max(12),
  pageContext: z.strictObject({
    pathname: z.string().startsWith('/').max(300),
    productHandle: z.string().regex(/^[a-z0-9-]+$/).nullable()
  })
})

export type AssistantIntent = z.infer<typeof assistantIntentSchema>
export type AssistantChatRequest = z.infer<typeof assistantChatRequestSchema>

export type AssistantProduct = {
  id: string
  handle: string
  title: string
  href: string
  image: { alt: string; url: string } | null
  price: { amount: string; currencyCode: string }
  variants: Array<{
    id: string
    title: string
    availableForSale: boolean
    selectedOptions: Array<{ name: string; value: string }>
  }>
}

export type AssistantRecommendation = {
  product: AssistantProduct
  rank: 1 | 2 | 3
  reason: string
  isPrimary: boolean
}

export type AssistantHandoff = {
  contactPath: '/kontaktskjema'
  email: 'kundeservice@utekos.no'
  phone: '+4740216343'
  reason: 'order' | 'payment' | 'complaint' | 'personal_data' | 'uncertain' | 'repeated_failure'
}

export const assistantSourceSchema = z.strictObject({
  title: z.string().trim().min(1).max(120),
  url: z.string().url().refine(
    value => new URL(value).origin === 'https://utekos.no',
    'Source must use the canonical Utekos origin'
  )
})

export type AssistantSource = z.infer<typeof assistantSourceSchema>

export type AssistantDataParts = {
  recommendation: AssistantRecommendation
  handoff: AssistantHandoff
  source: AssistantSource
  status: {
    confidence: 'high' | 'medium' | 'low'
    failureCode: 'none' | 'shopify_unavailable' | 'knowledge_unavailable' | 'recommendation_unavailable' | 'no_grounded_answer'
  }
}

export type AssistantUIMessage = UIMessage<
  { confidence: 'high' | 'medium' | 'low' },
  AssistantDataParts
>

export function parseAssistantChatRequest(value: unknown): AssistantChatRequest {
  return assistantChatRequestSchema.parse(value)
}

export function getLastUserText(messages: AssistantChatRequest['messages']) {
  const message = messages.findLast(candidate => candidate.role === 'user')
  return message?.parts.map(part => part.text).join('\n').trim() ?? ''
}

export function projectTextOnlyMessages(messages: AssistantUIMessage[]) {
  return messages
    .filter(message => message.role === 'user' || message.role === 'assistant')
    .slice(-12)
    .map(message => ({
    id: message.id,
    role: message.role,
    parts: message.parts.flatMap(part =>
      part.type === 'text' ? [{ type: 'text' as const, text: part.text }] : []
    )
    }))
    .filter(message => message.parts.length > 0)
}
```

- [ ] **Step 5: Complete the source rejection test and run GREEN**

Add an `assistantSourceSchema` test that rejects `https://example.com/` and accepts `https://utekos.no/frakt-og-retur`. Provider boundaries must call `assistantSourceSchema.parse()` before emitting a source. Run:

```bash
pnpm exec tsx --test src/lib/customer-assistant/assistantProtocol.test.ts
```

Expected: all protocol tests PASS.

- [ ] **Step 6: Commit**

```bash
git add package.json pnpm-lock.yaml src/lib/customer-assistant/assistantProtocol.ts src/lib/customer-assistant/assistantProtocol.test.ts
git commit -m "feat(assistant): define bounded UI protocol"
```

---

### Task 2: Add the uncached Shopify assistant catalog adapter

**Files:**
- Create: `src/lib/customer-assistant/server/shopifyAssistantCatalog.ts`
- Test: `src/lib/customer-assistant/server/shopifyAssistantCatalog.test.ts`

**Interfaces:**
- Consumes: `shopifyFetch()` and `AssistantProduct`.
- Produces: `fetchAssistantProducts(input: { buyerIp?: string; handles?: string[] }): Promise<AssistantProduct[]>` and `normalizeAssistantProduct()`.

- [ ] **Step 1: Write failing normalization tests**

Cover these exact behaviors:

- unavailable variants remain in the normalized data so the assistant can explain them;
- only `availableForSale` is exposed to the UI, not `quantityAvailable`;
- minimum price and canonical `/produkter/<handle>` URL are preserved;
- a missing image becomes `null`;
- the buyer IP is passed as `Shopify-Storefront-Buyer-IP` only when present.

Use a dependency-injected fetch function in the test and assert the query variables and header.

- [ ] **Step 2: Run RED**

```bash
pnpm exec tsx --test src/lib/customer-assistant/server/shopifyAssistantCatalog.test.ts
```

Expected: FAIL because the adapter does not exist.

- [ ] **Step 3: Implement the narrow Storefront query and normalizer**

Use a dedicated query that requests only `id`, `handle`, `title`, `featuredImage`, `priceRange.minVariantPrice`, and the first 20 variants with `id`, `title`, `availableForSale`, and `selectedOptions`. Do not request or return exact inventory quantities.

```ts
export async function fetchAssistantProducts({
  buyerIp,
  handles
}: {
  buyerIp?: string
  handles?: string[]
}): Promise<AssistantProduct[]> {
  const query = handles?.length ?
    handles.map(handle => `handle:${handle}`).join(' OR ')
  : undefined

  const response = await shopifyFetch<AssistantProductsOperation>({
    query: assistantProductsQuery,
    variables: { first: 20, query },
    ...(buyerIp ? {
      headers: { 'Shopify-Storefront-Buyer-IP': buyerIp }
    } : {})
  })

  if (!response.success) {
    throw new Error('shopify_assistant_catalog_unavailable')
  }

  return response.body.products.edges.map(({ node }) =>
    normalizeAssistantProduct(node)
  )
}
```

The function must not contain `'use cache'`, `cacheLife`, `cacheTag`, or `unstable_cache`.

- [ ] **Step 4: Run GREEN and type-check the adapter**

```bash
pnpm exec tsx --test src/lib/customer-assistant/server/shopifyAssistantCatalog.test.ts
pnpm exec tsc --noEmit --pretty false
```

Expected: targeted tests PASS and TypeScript exits 0.

- [ ] **Step 5: Commit**

```bash
git add src/lib/customer-assistant/server/shopifyAssistantCatalog.ts src/lib/customer-assistant/server/shopifyAssistantCatalog.test.ts
git commit -m "feat(assistant): read live Shopify product truth"
```

---

### Task 3: Implement deterministic buying guidance and human escalation

**Files:**
- Create: `src/lib/customer-assistant/assistantProductProfiles.ts`
- Create: `src/lib/customer-assistant/server/matchAssistantProducts.ts`
- Create: `src/lib/customer-assistant/server/resolveAssistantClarification.ts`
- Create: `src/lib/customer-assistant/server/resolveAssistantHandoff.ts`
- Test: `src/lib/customer-assistant/server/matchAssistantProducts.test.ts`
- Test: `src/lib/customer-assistant/server/resolveAssistantClarification.test.ts`
- Test: `src/lib/customer-assistant/server/resolveAssistantHandoff.test.ts`

**Interfaces:**
- Consumes: live `AssistantProduct[]`, last user text, intent, and current product handle.
- Produces: `matchAssistantProducts(input): AssistantRecommendation[]`, `resolveAssistantClarification(messages): string | null`, and `resolveAssistantHandoff(text, failureCount): AssistantHandoff['reason'] | null`.

- [ ] **Step 1: Write failing product-match tests**

Use current approved public claims:

| Need cue | Primary profile |
| --- | --- |
| båt, kyst, fukt, skiftende vær | `utekos-techdown` |
| tørr kulde, mest varme per gram, hytte | `utekos-dun` |
| bobil, reise, lett, rask tørk, enkel vask | `utekos-mikrofiber` |
| regn, hundelufting, sidelinje, isbading, allværskåpe | `comfyrobe` |

Tests must prove:

- unavailable products are removed before ranking;
- maximum three results are returned;
- the first result has `rank: 1` and `isPrimary: true`;
- no recommendation is returned when every matching product is unavailable;
- a current product page is a tiebreaker, not an override of a stronger stated need.

- [ ] **Step 2: Write failing escalation tests**

Use word-boundary patterns and enumerated outcomes:

```ts
const cases = [
  ['Hvor er ordren min 12345?', 'order'],
  ['Betalingen med Klarna feilet', 'payment'],
  ['Jeg vil reklamere på sømmen', 'complaint'],
  ['Her er telefonnummeret mitt 40000000', 'personal_data']
] as const
```

Also assert `failureCount >= 2` returns `repeated_failure` and ordinary product questions return `null`.

- [ ] **Step 3: Write failing clarification tests**

Lock this bounded question order:

1. No recognized use cue → `Hvor ser du først og fremst for deg å bruke plagget – for eksempel på hytta, i båten, i bobilen eller i hverdagen?`
2. Use cue but no weather/priority cue → `Hva er viktigst for deg: mest mulig varme, lav vekt, værbeskyttelse eller enkelt vedlikehold?`
3. A profile has two or more matching cues → `null`, allowing recommendation.
4. Three previous assistant clarification questions without two matching cues → `null`, allowing an uncertain handoff instead of an endless questionnaire.

Use all active in-memory user text for cue detection; do not persist it.

- [ ] **Step 4: Run RED**

```bash
pnpm exec tsx --test \
  src/lib/customer-assistant/server/matchAssistantProducts.test.ts \
  src/lib/customer-assistant/server/resolveAssistantClarification.test.ts \
  src/lib/customer-assistant/server/resolveAssistantHandoff.test.ts
```

Expected: both files FAIL because implementations do not exist.

- [ ] **Step 5: Implement immutable profiles and bounded scoring**

Define profiles from the existing approved sources. Scoring is exact and inspectable:

```ts
type ProductProfile = {
  handle: 'utekos-techdown' | 'utekos-dun' | 'utekos-mikrofiber' | 'comfyrobe'
  cues: readonly string[]
  reason: string
}

export const assistantProductProfiles: readonly ProductProfile[] = [
  {
    handle: 'utekos-techdown',
    cues: ['båt', 'kyst', 'fukt', 'skiftende vær', 'helårsbruk'],
    reason: 'TechDown er det mest allsidige alternativet for fuktig og skiftende vær.'
  },
  {
    handle: 'utekos-dun',
    cues: ['tørr kulde', 'mest varme', 'varme per gram', 'hytte'],
    reason: 'Utekos Dun gir mest varme per gram i tørt og kaldt vær.'
  },
  {
    handle: 'utekos-mikrofiber',
    cues: ['bobil', 'reise', 'lett', 'rask tørk', 'enkel vask'],
    reason: 'Utekos Mikrofiber er lett, pakkbar og enkel å vaske og tørke.'
  },
  {
    handle: 'comfyrobe',
    cues: ['regn', 'hundelufting', 'sidelinje', 'isbading', 'allværskåpe'],
    reason: 'Comfyrobe kombinerer værbeskyttelse med en romslig allværs-passform.'
  }
] as const
```

Normalize text with `toLocaleLowerCase('nb-NO')`. Add one point per matched cue and one tiebreak point for the current product handle. Filter to products with at least one available variant before sorting. Use profile order only as the final stable tiebreaker.

- [ ] **Step 6: Implement bounded clarification and escalation without storing matched text**

Count assistant questions from the in-memory message array, apply the locked question order, and stop after three clarifications. Return only the enumerated escalation reason. Build the handoff summary in the browser from visible messages; the server does not store it.

- [ ] **Step 7: Run GREEN**

```bash
pnpm exec tsx --test \
  src/lib/customer-assistant/server/matchAssistantProducts.test.ts \
  src/lib/customer-assistant/server/resolveAssistantClarification.test.ts \
  src/lib/customer-assistant/server/resolveAssistantHandoff.test.ts
```

Expected: all matching and escalation tests PASS.

- [ ] **Step 8: Commit**

```bash
git add src/lib/customer-assistant/assistantProductProfiles.ts src/lib/customer-assistant/server/matchAssistantProducts.ts src/lib/customer-assistant/server/resolveAssistantClarification.ts src/lib/customer-assistant/server/resolveAssistantHandoff.ts src/lib/customer-assistant/server/*.test.ts
git commit -m "feat(assistant): add safe buying and handoff rules"
```

---

### Task 4: Build the injectable assistant orchestrator and safe fallbacks

**Files:**
- Create: `src/lib/customer-assistant/server/assistantAdapters.ts`
- Create: `src/lib/customer-assistant/server/staticSupportKnowledge.ts`
- Create: `src/lib/customer-assistant/server/answerAssistantRequest.ts`
- Test: `src/lib/customer-assistant/server/answerAssistantRequest.test.ts`

**Interfaces:**
- Produces: `SupportKnowledgeAdapter`, `CommerceRecommendationAdapter`, `AssistantOutcome`, `answerAssistantRequest(request, context, adapters)`.
- Consumes: Tasks 1–3 contracts and Shopify adapter.

- [ ] **Step 1: Write failing orchestration tests**

Cover:

- `product_help` reads Shopify, applies matching, and emits product parts;
- `stock_help` reports only available/unavailable, never a quantity;
- `shipping_returns` answers from current `shippingReturnsFaqItems` and emits `https://utekos.no/frakt-og-retur`;
- `size_help` emits the size-guide link and does not promise fit;
- restricted intent returns handoff without querying knowledge;
- Shopify failure returns safe support text plus handoff and no product claim;
- knowledge failure returns handoff and does not invent an answer.
- an underspecified product request returns the next bounded clarification question without calling the recommender.

- [ ] **Step 2: Run RED**

```bash
pnpm exec tsx --test src/lib/customer-assistant/server/answerAssistantRequest.test.ts
```

Expected: FAIL because the orchestrator does not exist.

- [ ] **Step 3: Define adapter boundaries**

```ts
export type SupportKnowledgeResult = {
  text: string
  confidence: 'high' | 'medium' | 'low'
  sources: AssistantSource[]
}

export interface SupportKnowledgeAdapter {
  answer(input: {
    question: string
    productHandle: string | null
  }): Promise<SupportKnowledgeResult>
}

export interface CommerceRecommendationAdapter {
  recommend(input: {
    productIds: string[]
    sessionId: string
  }): Promise<string[]>
}
```

The core adapter answers shipping/returns from `shippingReturnsFaqItems`, size requests with a guarded link, and other unsupported questions with `confidence: 'low'`. The core recommendation adapter returns `[]`.

- [ ] **Step 4: Implement a discriminated outcome**

```ts
export type AssistantOutcome = {
  text: string
  confidence: 'high' | 'medium' | 'low'
  recommendations: AssistantRecommendation[]
  sources: AssistantSource[]
  handoff: AssistantHandoff | null
  failureCode: 'none' | 'shopify_unavailable' | 'knowledge_unavailable' | 'recommendation_unavailable' | 'no_grounded_answer'
}
```

Catch provider failures at the boundary and map them to `failureCode`; do not include thrown messages or customer text in logs.

- [ ] **Step 5: Run GREEN**

```bash
pnpm exec tsx --test src/lib/customer-assistant/server/answerAssistantRequest.test.ts
```

Expected: all orchestrator tests PASS.

- [ ] **Step 6: Commit**

```bash
git add src/lib/customer-assistant/server/assistantAdapters.ts src/lib/customer-assistant/server/staticSupportKnowledge.ts src/lib/customer-assistant/server/answerAssistantRequest.ts src/lib/customer-assistant/server/answerAssistantRequest.test.ts
git commit -m "feat(assistant): orchestrate grounded safe outcomes"
```

---

### Task 5: Add the guarded streaming Route Handler

**Files:**
- Create: `src/lib/customer-assistant/server/createAssistantRouteHandler.ts`
- Test: `src/lib/customer-assistant/server/createAssistantRouteHandler.test.ts`
- Create: `src/app/api/customer-assistant/chat/route.ts`

**Interfaces:**
- Produces: `createAssistantRouteHandler(dependencies)` and `POST(request)`.
- Consumes: `parseAssistantChatRequest()`, `answerAssistantRequest()`, AI SDK `createUIMessageStream()` and `createUIMessageStreamResponse()`.

- [ ] **Step 1: Write failing request-guard tests**

Assert exact responses:

- bad/missing same origin → 403 `forbidden_origin`;
- non-JSON → 415 `unsupported_media_type`;
- declared or actual body over 24 KiB → 413 `payload_too_large`;
- invalid JSON/schema → 400 `invalid_request`;
- rate limit failure → 429 `rate_limited` with `Retry-After: 60`;
- accepted request → 200 and `Cache-Control: no-store`;
- logs contain session ID, intent, outcome code, and latency only, never question text.

- [ ] **Step 2: Run RED**

```bash
pnpm exec tsx --test src/lib/customer-assistant/server/createAssistantRouteHandler.test.ts
```

Expected: FAIL because the handler does not exist.

- [ ] **Step 3: Implement injected guard dependencies**

```ts
type AssistantRouteDependencies = {
  answer: typeof answerAssistantRequest
  checkRateLimit: (input: {
    sessionId: string
    request: Request
  }) => Promise<{ allowed: boolean }>
  now: () => number
}
```

The core route uses a process-local preview limiter of 12 requests per minute per session. The production flag remains zero until the durable privacy-preserving limiter is configured in Release 3.

- [ ] **Step 4: Stream typed parts**

Use the official AI SDK 6 start/delta/end protocol:

```ts
const stream = createUIMessageStream({
  execute: async ({ writer }) => {
    const outcome = await dependencies.answer(parsed, context)
    const textId = crypto.randomUUID()
    writer.write({ type: 'text-start', id: textId })
    writer.write({ type: 'text-delta', id: textId, delta: outcome.text })
    writer.write({ type: 'text-end', id: textId })

    for (const recommendation of outcome.recommendations) {
      writer.write({ type: 'data-recommendation', data: recommendation })
    }
    for (const source of outcome.sources) {
      writer.write({ type: 'data-source', data: source })
    }
    if (outcome.handoff) {
      writer.write({ type: 'data-handoff', data: outcome.handoff })
    }
    writer.write({
      type: 'data-status',
      data: {
        confidence: outcome.confidence,
        failureCode: outcome.failureCode
      }
    })
  },
  onError: () => 'Jeg fikk ikke hentet et sikkert svar. Du kan kontakte kundeservice.'
})

return createUIMessageStreamResponse({
  stream,
  headers: { 'Cache-Control': 'no-store, max-age=0' }
})
```

- [ ] **Step 5: Implement the route composition**

Use `ipAddress(request)` from `@vercel/functions` only to supply Shopify buyer context. Do not log or persist it. Export `maxDuration = 30`.

- [ ] **Step 6: Run GREEN**

```bash
pnpm exec tsx --test \
  src/lib/customer-assistant/server/createAssistantRouteHandler.test.ts \
  src/lib/customer-assistant/server/answerAssistantRequest.test.ts
```

Expected: all route and orchestrator tests PASS.

- [ ] **Step 7: Commit**

```bash
git add src/lib/customer-assistant/server/createAssistantRouteHandler.ts src/lib/customer-assistant/server/createAssistantRouteHandler.test.ts src/app/api/customer-assistant/chat/route.ts
git commit -m "feat(assistant): stream guarded assistant responses"
```

---

### Task 6: Build the accessible client panel and typed message renderer

**Files:**
- Create: `src/components/customer-assistant/CustomerAssistant.tsx`
- Create: `src/components/customer-assistant/CustomerAssistantLauncher.tsx`
- Create: `src/components/customer-assistant/CustomerAssistantPanel.tsx`
- Create: `src/components/customer-assistant/AssistantQuickActions.tsx`
- Create: `src/components/customer-assistant/AssistantMessageList.tsx`
- Create: `src/components/customer-assistant/AssistantProductRecommendation.tsx`
- Create: `src/components/customer-assistant/AssistantHandoff.tsx`
- Create: `src/components/customer-assistant/AssistantFeedback.tsx`
- Create: `src/components/customer-assistant/assistantViewModel.ts`
- Test: `src/components/customer-assistant/assistantViewModel.test.ts`

**Interfaces:**
- Consumes: `AssistantUIMessage`, `DefaultChatTransport`, `useChat()`.
- Produces: `<CustomerAssistant rolloutPercent productHandle />`.

- [ ] **Step 1: Write failing view-model tests**

Test that the renderer:

- converts text parts to left/right bubble rows;
- converts `data-recommendation` parts to product-card rows;
- converts source parts only when the URL origin is `https://utekos.no`;
- converts handoff parts to exact contact actions;
- converts status parts to non-text confidence/failure metadata;
- generates a summary of at most 1,000 characters locally;
- excludes email, phone, order-number-looking sequences, and payment-number-looking sequences from the summary.

- [ ] **Step 2: Run RED**

```bash
pnpm exec tsx --test src/components/customer-assistant/assistantViewModel.test.ts
```

Expected: FAIL because the view model does not exist.

- [ ] **Step 3: Implement the pure view model and run GREEN**

```bash
pnpm exec tsx --test src/components/customer-assistant/assistantViewModel.test.ts
```

Expected: all view-model tests PASS.

- [ ] **Step 4: Implement the client state and transport**

Use `useState`, `useRef`, `useId`, and `useChat`; do not use manual memoization.

```tsx
'use client'

import { useChat } from '@ai-sdk/react'
import { DefaultChatTransport } from 'ai'
import { usePathname } from 'next/navigation'
import { useId, useRef, useState } from 'react'
import {
  projectTextOnlyMessages,
  type AssistantIntent,
  type AssistantUIMessage
} from '@/lib/customer-assistant/assistantProtocol'

export function CustomerAssistant({ productHandle }: { productHandle: string | null }) {
  const pathname = usePathname()
  const [intent, setIntent] = useState<AssistantIntent>('product_help')
  const [input, setInput] = useState('')
  const sessionId = useRef(crypto.randomUUID())
  const intentRef = useRef(intent)
  intentRef.current = intent
  const panelId = useId()
  const { messages, sendMessage, status, error } = useChat<AssistantUIMessage>({
    transport: new DefaultChatTransport({
      api: '/api/customer-assistant/chat',
      credentials: 'same-origin',
      prepareSendMessagesRequest: ({ id, messages: nextMessages }) => ({
        body: {
          id,
          sessionId: sessionId.current,
          intent: intentRef.current,
          messages: projectTextOnlyMessages(nextMessages),
          pageContext: { pathname, productHandle }
        }
      })
    })
  })

  async function submit() {
    const text = input.trim()
    if (!text || status !== 'ready') return
    setInput('')
    await sendMessage({ text })
  }

  return (
    <CustomerAssistantPanel
      error={error}
      input={input}
      intent={intent}
      messages={messages}
      panelId={panelId}
      status={status}
      onInputChange={setInput}
      onIntentChange={setIntent}
      onSubmit={submit}
    />
  )
}
```

- [ ] **Step 5: Implement accessible interaction behavior**

Required markup and behavior:

- launcher has `aria-expanded`, `aria-controls`, and visible label `Kjøpshjelp`;
- panel uses `role="dialog"`, `aria-modal="false"`, labelled heading, and a close button;
- opening moves focus to the heading or first quick action;
- closing returns focus to the launcher;
- Escape closes the panel;
- messages use `aria-live="polite"` and do not repeatedly announce the full transcript;
- touch targets are at least 44×44 CSS pixels;
- motion classes are guarded by `motion-reduce:transition-none` and `motion-reduce:transform-none`;
- recommendation links use `/produkter/<handle>` and never embed generated HTML.
- each completed assistant response exposes one optional `Nyttig` / `Ikke nyttig` feedback control; selecting once disables both choices for that response.

- [ ] **Step 6: Run TypeScript and lint for the component directory**

```bash
pnpm exec tsc --noEmit --pretty false
pnpm exec eslint src/components/customer-assistant src/lib/customer-assistant
```

Expected: both commands exit 0.

- [ ] **Step 7: Commit**

```bash
git add src/components/customer-assistant
git commit -m "feat(assistant): add accessible shopping help panel"
```

---

### Task 7: Mount behind a zero-default rollout flag and verify the core release

**Files:**
- Create: `src/lib/customer-assistant/assistantRollout.ts`
- Test: `src/lib/customer-assistant/assistantRollout.test.ts`
- Modify: `src/components/layout/SiteChrome.tsx`
- Modify: `src/app/layout.tsx`
- Delete after reference proof: `src/components/chat/ChatBotAgent/source-code.tsx`
- Create: `playwright.assistant.config.ts`
- Create: `tests/customer-assistant/customer-assistant.spec.ts`
- Modify: `DEPLOYMENT.md`
- Modify: `FLOW.md`

**Interfaces:**
- Consumes: `CUSTOMER_ASSISTANT_ROLLOUT_PERCENT` server environment value.
- Produces: deterministic `resolveAssistantRolloutPercent()`, `resolveAssistantExposure(percent, bucket)`, and mounted assistant with a zero-default production state.

- [ ] **Step 1: Write failing flag tests**

```ts
import assert from 'node:assert/strict'
import test from 'node:test'
import {
  resolveAssistantExposure,
  resolveAssistantRolloutPercent
} from './assistantRollout'

test('defaults to zero exposure', () => {
  assert.equal(resolveAssistantRolloutPercent({}), 0)
})

test('accepts an integer from zero through one hundred', () => {
  assert.equal(resolveAssistantRolloutPercent({ CUSTOMER_ASSISTANT_ROLLOUT_PERCENT: '25' }), 25)
})

test('fails closed for unsafe values', () => {
  assert.equal(resolveAssistantRolloutPercent({ CUSTOMER_ASSISTANT_ROLLOUT_PERCENT: '101' }), 0)
  assert.equal(resolveAssistantRolloutPercent({ CUSTOMER_ASSISTANT_ROLLOUT_PERCENT: 'ten' }), 0)
})

test('uses the same stable bucket boundary for assistant and holdout', () => {
  assert.equal(resolveAssistantExposure(25, 0.2499), 'assistant')
  assert.equal(resolveAssistantExposure(25, 0.25), 'holdout')
})
```

- [ ] **Step 2: Run RED, implement, and run GREEN**

```bash
pnpm exec tsx --test src/lib/customer-assistant/assistantRollout.test.ts
```

Expected before implementation: FAIL. Expected after implementation: PASS.

- [ ] **Step 3: Mount without changing production exposure**

Pass the parsed percent from `RootLayout` to `SiteChrome`. Render the assistant after the footer only for non-design, non-checkout paths. Client exposure sampling uses a random value stored under `utekos_assistant_bucket_v1`; the server-controlled percent remains the authority. The active conversation itself remains memory-only.

Do not add the environment variable in Vercel during this task. An absent value renders no assistant.

- [ ] **Step 4: Prove and remove legacy Chatbase code**

Run:

```bash
rg -n "ChatBotAgent|chatbase|SO0afKtc9hg24ytkt83_9" src package.json
```

Expected before deletion: only `src/components/chat/ChatBotAgent/source-code.tsx`. Delete that file and rerun. Expected after deletion: no output.

- [ ] **Step 5: Add Playwright preview tests**

The suite starts `pnpm dev`, injects `CUSTOMER_ASSISTANT_ROLLOUT_PERCENT=100`, and tests:

- launcher visibility and accessible name;
- quick-action labels;
- keyboard open/close/focus return;
- product card displays availability but no numeric inventory;
- order question produces all three handoff channels;
- mobile viewport does not obscure the cart/header primary action;
- API failure produces safe contact fallback;
- `/design` and checkout-like excluded routes have no launcher.

- [ ] **Step 6: Run the complete core gate**

```bash
pnpm exec tsx --test \
  src/lib/customer-assistant/*.test.ts \
  src/lib/customer-assistant/server/*.test.ts \
  src/components/customer-assistant/*.test.ts
pnpm exec playwright test --config=playwright.assistant.config.ts
pnpm exec eslint src/app/api/customer-assistant src/components/customer-assistant src/lib/customer-assistant src/components/layout/SiteChrome.tsx src/app/layout.tsx
pnpm build
```

Expected: targeted tests PASS, Playwright PASS, lint exits 0, build exits 0, and production exposure remains zero.

- [ ] **Step 7: Update flow and deployment documentation**

Document:

- `/api/customer-assistant/chat` request/response ownership;
- live Shopify truth and static fallback behavior;
- absence of transcript persistence;
- zero-default rollout and rollback procedure;
- explicit approval requirements for Vercel environment changes and production deployment.

- [ ] **Step 8: Commit**

```bash
git add src/lib/customer-assistant/assistantRollout.ts src/lib/customer-assistant/assistantRollout.test.ts src/components/layout/SiteChrome.tsx src/app/layout.tsx src/components/chat/ChatBotAgent/source-code.tsx playwright.assistant.config.ts tests/customer-assistant/customer-assistant.spec.ts DEPLOYMENT.md FLOW.md
git commit -m "feat(assistant): mount zero-default internal preview"
```

## Core release review gate

Do not proceed to the GCP plan until a reviewer confirms:

- no production flag or environment mutation occurred;
- all displayed commercial facts came from Shopify or an approved static source;
- unavailable variants were never presented as purchasable;
- restricted questions produced the approved handoff;
- no conversation text appeared in logs or analytics;
- the core assistant can be fully absent with rollout percent zero.
