# Utekos AI Assistant GCP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a dedicated grounded Utekos knowledge adapter, a reconciled Google commerce catalog, and gated catalog-based recommendations while preserving Shopify truth and safe fallbacks.

**Architecture:** Official Google Node clients use the repository's Vercel OIDC/workload-identity pattern. A deterministic knowledge manifest feeds a dedicated Discovery Engine data store; a separate Shopify-to-Retail mapper reconciles the default commerce catalog. Runtime adapters implement the interfaces from the core release and remain circuit-breaker protected.

**Tech Stack:** `@google-cloud/discoveryengine` 2.9.0, `@google-cloud/retail` 4.4.0, `google-auth-library` 10.6.2, Vercel OIDC 3.8.0, Next.js 16.2.9, TypeScript 6.0.3, Zod 4.4.3.

## Global Constraints

- Apply every global constraint in the program plan.
- Complete and review the core assistant plan first.
- Re-read the official Discovery Engine 2.9 and Retail 4.4 references before writing each provider call.
- Every provisioning, document import, product import, model action, or serving-config action defaults to dry-run and stops for explicit approval before `--apply`.
- Do not delete or mutate the existing unrelated Discovery Engine document or engine during local implementation.
- Do not train a recommendation model until credit SKU, catalog quality, event quality, and offline relevance gates are green.
- Shopify remains the response-time authority; GCP availability is never displayed without a fresh Shopify resolution.

---

### Task 1: Install official Google clients and extract reusable workload identity

**Files:**
- Modify: `package.json`
- Modify: `pnpm-lock.yaml`
- Create: `src/lib/google/auth/createGoogleCloudClientOptions.ts`
- Test: `src/lib/google/auth/createGoogleCloudClientOptions.test.ts`
- Modify: `src/lib/analytics/server/createGoogleDataManagerIngestionClient.ts`
- Test: `src/lib/analytics/server/createGoogleDataManagerIngestionClient.test.ts`

**Interfaces:**
- Produces: `createGoogleCloudClientOptions(environment, dependencies): GoogleCloudClientOptions | undefined` and `readGoogleCloudAuthConfig()`.
- Consumes: existing `GCP_PROJECT_ID`, `GCP_SERVICE_ACCOUNT_EMAIL`, `GCP_AUDIENCE`, `getVercelOidcToken()`, and local ADC.

- [ ] **Step 1: Install verified package versions**

```bash
pnpm add @google-cloud/discoveryengine@2.9.0 @google-cloud/retail@4.4.0
```

Expected: package and lockfile changes only; install exits 0.

- [ ] **Step 2: Write failing shared-auth tests**

Copy the existing auth expectations into a provider-neutral test:

- local non-Vercel environment returns `undefined`, allowing Google ADC;
- Vercel requires the three existing GCP environment values;
- the canonical workload identity audience regex is enforced;
- the service-account email regex is enforced;
- scopes equal `['https://www.googleapis.com/auth/cloud-platform']`;
- the subject token supplier calls `getVercelOidcToken()` with the configured audience.

- [ ] **Step 3: Run RED**

```bash
pnpm exec tsx --test src/lib/google/auth/createGoogleCloudClientOptions.test.ts
```

Expected: FAIL because the shared helper does not exist.

- [ ] **Step 4: Implement the shared helper**

```ts
import { getVercelOidcToken } from '@vercel/oidc'
import {
  ExternalAccountClient,
  type BaseExternalAccountClient,
  type IdentityPoolClientOptions
} from 'google-auth-library'

const CLOUD_PLATFORM_SCOPE =
  'https://www.googleapis.com/auth/cloud-platform'

export type GoogleCloudClientOptions = {
  authClient: BaseExternalAccountClient
  projectId: string
}

export function createGoogleCloudClientOptions(
  environment: Readonly<Record<string, string | undefined>> = process.env,
  dependencies = {
    createExternalAccountClient: (options: IdentityPoolClientOptions) =>
      ExternalAccountClient.fromJSON(options),
    getOidcToken: getVercelOidcToken
  }
): GoogleCloudClientOptions | undefined {
  if (environment.VERCEL !== '1') return undefined

  const config = readGoogleCloudAuthConfig(environment)
  const authClient = dependencies.createExternalAccountClient({
    type: 'external_account',
    audience: config.audience,
    subject_token_type: 'urn:ietf:params:oauth:token-type:jwt',
    token_url: 'https://sts.googleapis.com/v1/token',
    service_account_impersonation_url:
      `https://iamcredentials.googleapis.com/v1/projects/-/serviceAccounts/${config.serviceAccountEmail}:generateAccessToken`,
    scopes: [CLOUD_PLATFORM_SCOPE],
    subject_token_supplier: {
      getSubjectToken: () =>
        dependencies.getOidcToken({ audience: config.audience })
    }
  })

  if (!authClient) throw new Error('Could not create Google external account client')
  return { authClient, projectId: config.projectId }
}
```

Keep validation in `readGoogleCloudAuthConfig()` and never read a JSON key file in this helper.

- [ ] **Step 5: Refactor Data Manager without changing behavior**

Replace only the Vercel external-account construction with the shared helper. Preserve the existing local service-account compatibility branch until a separate cleanup is approved. Run both test files.

```bash
pnpm exec tsx --test \
  src/lib/google/auth/createGoogleCloudClientOptions.test.ts \
  src/lib/analytics/server/createGoogleDataManagerIngestionClient.test.ts
```

Expected: all auth tests PASS.

- [ ] **Step 6: Commit**

```bash
git add package.json pnpm-lock.yaml src/lib/google/auth src/lib/analytics/server/createGoogleDataManagerIngestionClient.ts src/lib/analytics/server/createGoogleDataManagerIngestionClient.test.ts
git commit -m "refactor(gcp): share Vercel workload identity auth"
```

---

### Task 2: Build the reviewed Utekos knowledge manifest and dry-run corpus

**Files:**
- Create: `src/lib/google/customer-assistant/knowledgeManifest.ts`
- Test: `src/lib/google/customer-assistant/knowledgeManifest.test.ts`
- Create: `scripts/customer-assistant/build-knowledge-corpus.ts`
- Create: `scripts/customer-assistant/build-knowledge-corpus.test.ts`
- Modify: `package.json`

**Interfaces:**
- Produces: `buildAssistantKnowledgeDocuments(): AssistantKnowledgeDocument[]` and `pnpm assistant:knowledge:build`.
- Consumes: `modelRecommendations`, `comparisonRows`, `COMFYROBE_LANDING_FAQ`, and `shippingReturnsFaqItems`.

- [ ] **Step 1: Write failing manifest tests**

Require exactly these canonical source groups:

| ID | URL |
| --- | --- |
| `compare-models` | `https://utekos.no/handlehjelp/sammenlign-modeller` |
| `comfyrobe-faq` | `https://utekos.no/comfyrobe` |
| `shipping-returns` | `https://utekos.no/frakt-og-retur` |
| `size-guide` | `https://utekos.no/handlehjelp/storrelsesguide` |
| `materials` | `https://utekos.no/handlehjelp/teknologi-materialer` |
| `care` | `https://utekos.no/handlehjelp/vask-og-vedlikehold` |
| `contact` | `https://utekos.no/kontaktskjema` |

Tests reject duplicate IDs/URLs, non-`utekos.no` sources, blank content, missing `lastReviewed`, content over 20,000 characters, and unpublished records.

- [ ] **Step 2: Run RED**

```bash
pnpm exec tsx --test src/lib/google/customer-assistant/knowledgeManifest.test.ts
```

Expected: FAIL because the manifest does not exist.

- [ ] **Step 3: Implement deterministic documents**

```ts
export type AssistantKnowledgeDocument = {
  id: string
  title: string
  canonicalUrl: `https://utekos.no/${string}`
  locale: 'nb-NO'
  contentType: 'product_advice' | 'size' | 'shipping_returns' | 'materials' | 'care' | 'contact'
  lastReviewed: '2026-07-24'
  content: string
  checksum: string
  published: true
}
```

Build content from current exported constants where structured content exists. For size, materials, and care, use a bounded manually reviewed synopsis that links to the full public page and contains no claim absent from that page. Compute `checksum` as SHA-256 of normalized title, URL, and content.

- [ ] **Step 4: Implement a JSONL dry-run artifact**

The script writes to `.agent-artifacts/customer-assistant/knowledge-documents.jsonl`, prints document count, IDs, checksums, and byte size, and performs no network call.

Add:

```json
{
  "assistant:knowledge:build": "tsx scripts/customer-assistant/build-knowledge-corpus.ts"
}
```

- [ ] **Step 5: Run GREEN and inspect the dry run**

```bash
pnpm exec tsx --test \
  src/lib/google/customer-assistant/knowledgeManifest.test.ts \
  scripts/customer-assistant/build-knowledge-corpus.test.ts
pnpm assistant:knowledge:build
```

Expected: tests PASS; output reports 7 reviewed documents and no provider mutation.

- [ ] **Step 6: Commit**

```bash
git add package.json src/lib/google/customer-assistant/knowledgeManifest.ts src/lib/google/customer-assistant/knowledgeManifest.test.ts scripts/customer-assistant/build-knowledge-corpus.ts scripts/customer-assistant/build-knowledge-corpus.test.ts
git commit -m "feat(assistant): build reviewed support corpus"
```

---

### Task 3: Implement the grounded Discovery Engine adapter

**Files:**
- Create: `src/lib/google/customer-assistant/discoverySupportKnowledge.ts`
- Test: `src/lib/google/customer-assistant/discoverySupportKnowledge.test.ts`
- Modify: `src/app/api/customer-assistant/chat/route.ts`

**Interfaces:**
- Implements: `SupportKnowledgeAdapter.answer()`.
- Consumes: `GCP_PROJECT_ID`, `GCP_DISCOVERY_LOCATION`, `GCP_DISCOVERY_ENGINE_ID`, shared Google client options.
- Produces: normalized text, confidence, and approved Utekos sources.

- [ ] **Step 1: Write failing config and normalization tests**

Assert:

- location defaults to `global`;
- collection is fixed to `default_collection`;
- serving config is fixed to `default_search`;
- missing project/engine configuration fails closed with `gcp_discovery_not_configured`;
- answer text is returned only when at least one approved Utekos reference exists;
- adversarial or non-answer skip reasons produce low confidence and no answer;
- non-Utekos references are removed;
- no raw question is logged.

- [ ] **Step 2: Run RED**

```bash
pnpm exec tsx --test src/lib/google/customer-assistant/discoverySupportKnowledge.test.ts
```

Expected: FAIL because the adapter does not exist.

- [ ] **Step 3: Implement the official v1 client call**

```ts
import { v1 } from '@google-cloud/discoveryengine'

const client = new v1.ConversationalSearchServiceClient(
  createGoogleCloudClientOptions(environment)
)
const servingConfig = [
  'projects', projectId,
  'locations', location,
  'collections', 'default_collection',
  'engines', engineId,
  'servingConfigs', 'default_search'
].join('/')

const [response] = await client.answerQuery({
  servingConfig,
  query: { text: input.question },
  session: `${servingConfig.replace(/\/servingConfigs\/default_search$/, '')}/sessions/-`,
  answerGenerationSpec: {
    ignoreAdversarialQuery: true,
    ignoreNonAnswerSeekingQuery: true,
    includeCitations: true
  }
}, { timeout: 8_000 })
```

Normalize `response.answer.answerText`, `response.answer.references`, and `response.answer.answerSkippedReasons`. Accept only canonical `https://utekos.no/` URLs from the reviewed manifest.

- [ ] **Step 4: Run GREEN and TypeScript validation**

```bash
pnpm exec tsx --test src/lib/google/customer-assistant/discoverySupportKnowledge.test.ts
pnpm exec tsc --noEmit --pretty false
```

Expected: adapter tests PASS and current package types compile.

- [ ] **Step 5: Compose behind configuration fallback**

In the route, instantiate `DiscoverySupportKnowledge` only when all required server environment values exist; otherwise use `StaticSupportKnowledge`. Do not add or change Vercel environment values in this task.

- [ ] **Step 6: Commit**

```bash
git add src/lib/google/customer-assistant/discoverySupportKnowledge.ts src/lib/google/customer-assistant/discoverySupportKnowledge.test.ts src/app/api/customer-assistant/chat/route.ts
git commit -m "feat(assistant): ground support answers in GCP search"
```

---

### Task 4: Add dry-run Discovery resource planning and approved import

**Files:**
- Create: `scripts/customer-assistant/plan-discovery-resources.ts`
- Test: `scripts/customer-assistant/plan-discovery-resources.test.ts`
- Create: `scripts/customer-assistant/apply-discovery-resources.ts`
- Modify: `package.json`
- Create: `docs/customer-assistant/gcp-resource-manifest.md`

**Interfaces:**
- Produces: a read-only desired-versus-actual report and a separately gated apply command.
- Consumes: corpus JSONL and official Discovery Engine document/data-store clients.

- [ ] **Step 1: Write failing plan tests**

The desired state is explicit:

```ts
export const desiredDiscoveryResources = {
  location: 'global',
  collection: 'default_collection',
  dataStoreId: 'utekos-customer-support-v1',
  dataStoreDisplayName: 'Utekos Customer Support v1',
  engineId: 'utekos-customer-assistant-v1',
  engineDisplayName: 'Utekos Customer Assistant v1',
  servingConfigId: 'default_search'
} as const
```

Tests prove `plan` is read-only, reports the existing unrelated data store separately, and never proposes deletion.

- [ ] **Step 2: Run RED, implement planner, run GREEN**

Add the exact package commands:

```json
{
  "assistant:gcp:discovery:plan": "tsx scripts/customer-assistant/plan-discovery-resources.ts",
  "assistant:gcp:discovery:apply": "tsx scripts/customer-assistant/apply-discovery-resources.ts"
}
```

```bash
pnpm exec tsx --test scripts/customer-assistant/plan-discovery-resources.test.ts
pnpm assistant:gcp:discovery:plan
```

Expected: tests PASS; plan reports create/update/noop actions without mutation.

- [ ] **Step 3: Implement apply with a double gate**

The apply script exits unless both conditions hold:

```ts
const approved = process.argv.includes('--apply')
const approvalToken = process.env.ASSISTANT_GCP_APPLY_APPROVAL

if (!approved || approvalToken !== 'approved-utekos-assistant-v1') {
  throw new Error('gcp_apply_requires_explicit_approval')
}
```

It creates only the dedicated data store/engine if absent, imports the 7 manifest documents, waits for long-running operations, and prints exact resource names and operation results. It does not delete or update the existing unrelated data store.

- [ ] **Step 4: Stop and request explicit GCP mutation approval**

Present the dry-run report, project ID `project-c683eb2c-20ae-4ec2-ac3`, resource names, expected credit-eligible SKUs, and rollback/disable path. Do not run `--apply` without a new explicit user approval.

- [ ] **Step 5: After approval, apply and verify read-only**

Run only after approval:

```bash
ASSISTANT_GCP_APPLY_APPROVAL=approved-utekos-assistant-v1 \
  pnpm assistant:gcp:discovery:apply --apply
pnpm assistant:gcp:discovery:plan
```

Expected: apply exits 0; subsequent plan reports no drift; 7 reviewed documents are listed; unrelated resources are unchanged.

- [ ] **Step 6: Commit code and evidence, never credentials**

```bash
git add package.json scripts/customer-assistant/plan-discovery-resources.ts scripts/customer-assistant/plan-discovery-resources.test.ts scripts/customer-assistant/apply-discovery-resources.ts docs/customer-assistant/gcp-resource-manifest.md
git commit -m "feat(assistant): provision dedicated grounded search"
```

---

### Task 5: Build the Shopify-to-Google commerce catalog reconciliation

**Files:**
- Create: `src/lib/google/customer-assistant/mapShopifyProductToRetail.ts`
- Test: `src/lib/google/customer-assistant/mapShopifyProductToRetail.test.ts`
- Create: `scripts/customer-assistant/plan-retail-catalog-sync.ts`
- Test: `scripts/customer-assistant/plan-retail-catalog-sync.test.ts`
- Create: `scripts/customer-assistant/apply-retail-catalog-sync.ts`
- Modify: `package.json`

**Interfaces:**
- Produces: `mapShopifyProductToRetail(product)` and a full-reconciliation plan for the existing default catalog/branch.
- Consumes: `fetchAssistantProducts()` and Retail v2 `ProductServiceClient`.

- [ ] **Step 1: Write failing mapper tests**

Require:

- Retail product ID equals the normalized Shopify handle;
- type is `PRIMARY`;
- URI is `https://utekos.no/produkter/<handle>`;
- currency is `NOK` and price is a finite number;
- `IN_STOCK` means at least one Storefront variant is available;
- inactive/draft products never enter the input set;
- no exact quantity or customer data is mapped;
- the mapper rejects a blank handle, non-NOK price, invalid URL, or missing title.

- [ ] **Step 2: Run RED, implement mapper, run GREEN**

```bash
pnpm exec tsx --test src/lib/google/customer-assistant/mapShopifyProductToRetail.test.ts
```

Expected before implementation: FAIL. Expected after implementation: PASS.

- [ ] **Step 3: Implement a read-only reconciliation plan**

Compare desired Shopify IDs with `ProductServiceClient.listProducts()` under:

```text
projects/project-c683eb2c-20ae-4ec2-ac3/locations/global/catalogs/default_catalog/branches/default_branch
```

Report create/update/stale IDs, but never delete. Write the desired inline-source JSON to `.agent-artifacts/customer-assistant/retail-products.json`.

Add:

```json
{
  "assistant:gcp:retail:plan": "tsx scripts/customer-assistant/plan-retail-catalog-sync.ts",
  "assistant:gcp:retail:apply": "tsx scripts/customer-assistant/apply-retail-catalog-sync.ts"
}
```

- [ ] **Step 4: Implement gated full import**

The apply script requires `--apply` plus `ASSISTANT_GCP_APPLY_APPROVAL=approved-utekos-retail-v1`, calls `ProductServiceClient.importProducts()` with `reconciliationMode: 'FULL'`, waits for completion, and prints success/error sample counts. It does not train a model.

- [ ] **Step 5: Stop for approval, then import and verify**

Before approval run only:

```bash
pnpm assistant:gcp:retail:plan
```

After explicit approval:

```bash
ASSISTANT_GCP_APPLY_APPROVAL=approved-utekos-retail-v1 \
  pnpm assistant:gcp:retail:apply --apply
pnpm assistant:gcp:retail:plan
```

Expected: post-import plan reports all active Shopify products present and no unexpected stale IDs.

- [ ] **Step 6: Commit**

```bash
git add package.json src/lib/google/customer-assistant/mapShopifyProductToRetail.ts src/lib/google/customer-assistant/mapShopifyProductToRetail.test.ts scripts/customer-assistant/plan-retail-catalog-sync.ts scripts/customer-assistant/plan-retail-catalog-sync.test.ts scripts/customer-assistant/apply-retail-catalog-sync.ts
git commit -m "feat(assistant): reconcile Shopify with GCP commerce catalog"
```

---

### Task 6: Plan and gate the catalog-based Similar Items model

**Files:**
- Create: `scripts/customer-assistant/plan-retail-recommendation-resources.ts`
- Test: `scripts/customer-assistant/plan-retail-recommendation-resources.test.ts`
- Create: `scripts/customer-assistant/apply-retail-recommendation-resources.ts`
- Modify: `package.json`
- Modify: `docs/customer-assistant/gcp-resource-manifest.md`

**Interfaces:**
- Produces: read-only model/serving-config drift and an explicitly gated create action.
- Consumes: Retail v2 `ModelServiceClient`, `ServingConfigServiceClient`, confirmed catalog reconciliation, and promotion eligibility.

- [ ] **Step 1: Write failing desired-state tests**

Lock the resource IDs and recommendation type:

```ts
export const desiredRetailRecommendationResources = {
  modelId: 'similar-items-v1',
  modelType: 'similar-items',
  modelDisplayName: 'Utekos Similar Items v1',
  servingConfigId: 'similar_items',
  servingConfigDisplayName: 'Utekos Similar Items'
} as const
```

Tests prove the planner lists the existing `recently_viewed` model/config without changing them, reports the desired Similar Items resources as create/noop/drift, and proposes no deletion.

- [ ] **Step 2: Run RED, implement the read-only planner, and run GREEN**

Add:

```json
{
  "assistant:gcp:retail-recommendations:plan": "tsx scripts/customer-assistant/plan-retail-recommendation-resources.ts",
  "assistant:gcp:retail-recommendations:apply": "tsx scripts/customer-assistant/apply-retail-recommendation-resources.ts"
}
```

```bash
pnpm exec tsx --test scripts/customer-assistant/plan-retail-recommendation-resources.test.ts
pnpm assistant:gcp:retail-recommendations:plan
```

Expected before implementation: FAIL. Expected after implementation: PASS plus a read-only drift report.

- [ ] **Step 3: Implement an apply command with training disclosure**

The apply script requires `--apply` and `ASSISTANT_GCP_APPLY_APPROVAL=approved-utekos-similar-items-v1`. It creates the `similar-items` model and its serving config only when absent, waits for operation completion, and prints the model's serving state. It never pauses, deletes, retunes, or changes the existing `recently_viewed` model.

The dry-run output must state that model creation can start billable Recommendations AI training under SKU `3524-92C1-1640`, while prediction uses SKU `D3C0-7720-A6B4`.

- [ ] **Step 4: Stop for explicit model/training approval**

Present catalog reconciliation, promotion expiry/balance, exact model/config names, expected training SKU, and the disable path. Do not create the model merely to consume credit.

- [ ] **Step 5: After approval, create and verify read-only**

```bash
ASSISTANT_GCP_APPLY_APPROVAL=approved-utekos-similar-items-v1 \
  pnpm assistant:gcp:retail-recommendations:apply --apply
pnpm assistant:gcp:retail-recommendations:plan
```

Expected: the desired model and serving config exist; the existing model/config are unchanged; the report shows the actual serving/training state without claiming readiness prematurely.

- [ ] **Step 6: Commit**

```bash
git add package.json scripts/customer-assistant/plan-retail-recommendation-resources.ts scripts/customer-assistant/plan-retail-recommendation-resources.test.ts scripts/customer-assistant/apply-retail-recommendation-resources.ts docs/customer-assistant/gcp-resource-manifest.md
git commit -m "feat(assistant): gate Similar Items resources"
```

---

### Task 7: Add gated catalog recommendations and Shopify revalidation

**Files:**
- Create: `src/lib/google/customer-assistant/retailRecommendationAdapter.ts`
- Test: `src/lib/google/customer-assistant/retailRecommendationAdapter.test.ts`
- Modify: `src/lib/customer-assistant/server/answerAssistantRequest.ts`
- Test: `src/lib/customer-assistant/server/answerAssistantRequest.test.ts`
- Modify: `src/app/api/customer-assistant/chat/route.ts`

**Interfaces:**
- Implements: `CommerceRecommendationAdapter.recommend()`.
- Consumes: Retail v2 `PredictionServiceClient`, serving config, anonymous assistant session ID, and fresh Shopify products.
- Produces: ranked Shopify product IDs after validation.

- [ ] **Step 1: Write failing recommendation tests**

Assert:

- adapter is disabled unless `GCP_RETAIL_RECOMMENDATIONS_ENABLED === '1'`;
- visitor ID is the assistant session UUID, never email or browser advertising ID;
- request uses the approved `similar_items` serving config;
- at most three result IDs are accepted;
- duplicates and unknown IDs are removed;
- GCP order is preserved among still-available Shopify products;
- every returned result is resolved against a fresh Shopify response before display;
- timeout/error returns `[]` and deterministic matching continues;
- no recommendation response is cached.

- [ ] **Step 2: Run RED**

```bash
pnpm exec tsx --test src/lib/google/customer-assistant/retailRecommendationAdapter.test.ts
```

Expected: FAIL because the adapter does not exist.

- [ ] **Step 3: Implement the official prediction call**

```ts
const [response] = await client.predict({
  placement: [
    'projects', projectId,
    'locations', 'global',
    'catalogs', 'default_catalog',
    'servingConfigs', servingConfigId
  ].join('/'),
  userEvent: {
    eventType: 'detail-page-view',
    visitorId: input.sessionId,
    productDetails: input.productIds.map(id => ({ product: { id } }))
  },
  pageSize: 3
}, { timeout: 5_000 })
```

Normalize `response.results[].id`; do not store or cache the response.

- [ ] **Step 4: Wire as a soft ranking signal**

The deterministic hard filters run first. GCP can reorder eligible alternatives, but it cannot reintroduce an unavailable product or override a stronger explicit visitor cue. Preserve the primary deterministic result when its score is strictly higher.

- [ ] **Step 5: Run GREEN and the GCP release gate**

```bash
pnpm exec tsx --test \
  src/lib/google/customer-assistant/*.test.ts \
  src/lib/customer-assistant/server/*.test.ts \
  scripts/customer-assistant/*.test.ts
pnpm exec tsc --noEmit --pretty false
pnpm build
```

Expected: all tests PASS, TypeScript exits 0, build exits 0, and missing GCP runtime configuration still yields a working static/Shopify fallback.

- [ ] **Step 6: Commit**

```bash
git add src/lib/google/customer-assistant/retailRecommendationAdapter.ts src/lib/google/customer-assistant/retailRecommendationAdapter.test.ts src/lib/customer-assistant/server/answerAssistantRequest.ts src/lib/customer-assistant/server/answerAssistantRequest.test.ts src/app/api/customer-assistant/chat/route.ts
git commit -m "feat(assistant): add gated commerce recommendations"
```

## GCP release review gate

Do not proceed to measurement/rollout until the reviewer has read:

- Discovery resource plan and post-apply inventory;
- retail catalog reconciliation report;
- Cloud Billing promotion/SKU verification;
- proof that no training ran;
- adapter fallback tests;
- proof that all displayed products were revalidated against Shopify.
