# Utekos AI-kjøpsassistent — design

Date: 2026-07-24
Status: Approved in brainstorming; awaiting written-spec review
Approach: GCP-first hybrid with deterministic Shopify truth and human handoff
Primary objective: Improve customer experience and increase sales by helping more category buyers reach a confident, suitable purchase decision

## 1. Purpose

Build a first-party Norwegian shopping and customer-service assistant for `utekos.no`. The assistant helps visitors:

- find the right Utekos product;
- choose a suitable size;
- check live variant availability;
- understand shipping, returns, materials, use, and care;
- move directly to the relevant product, size guide, or cart;
- transition safely to the existing contact form, email, or telephone when a human should take over.

The first release is a pre-purchase and general-support assistant. It does not authenticate customers, retrieve orders, change orders, process claims, or collect payment details.

## 2. Locked decisions

| Topic | Decision |
| --- | --- |
| Architecture | GCP-first hybrid |
| Storefront | First-party component in the existing Next.js application |
| Product source of truth | Shopify Storefront API |
| Price and availability | Verified against Shopify at response time |
| Support knowledge | Curated Utekos corpus in a dedicated GCP search data store |
| Recommendations | Catalog-based recommendations first; personalization only after data-quality gates pass |
| Quality and outcome store | Supabase, with minimal structured data and restricted redacted quality samples |
| Human handoff | Existing contact form, `kundeservice@utekos.no`, and `+47 40 21 63 43` |
| Order lookup | Out of scope for version 1 |
| Analytics text | No conversation text in GA4, PostHog, GTM, advertising platforms, or URL parameters |
| Deployment | Progressive exposure behind a server-controlled feature flag |
| Production changes | Explicit user approval remains required for deployment, environment changes, GCP mutations, Supabase schema changes, Shopify mutations, and GTM publishing |

## 3. User experience

### 3.1 Entry point

The assistant appears as a restrained, accessible launcher labelled **Kjøpshjelp**. It must:

- be reachable with keyboard and assistive technology;
- respect reduced-motion preferences;
- preserve visible focus;
- not obscure cart, consent, checkout, or primary calls to action;
- remain usable on narrow mobile viewports;
- be dismissible without losing the current page state.

The assistant is available on product, collection, buying-help, shipping/returns, and general content pages. It is not rendered in checkout or other surfaces where it could conflict with Shopify-controlled purchase flows.

### 3.2 Opening choices

The initial view offers five actions:

1. Finn riktig produkt
2. Hjelp med størrelse
3. Se lagerstatus
4. Frakt og retur
5. Noe annet

The assistant asks one short question at a time. It should normally reach a recommendation after no more than four clarification turns.

### 3.3 Product advice

The guided product flow can ask about:

- intended activity or situation;
- expected temperature or warmth need;
- desired insulation and weight;
- fit preference;
- required size or variant.

It returns one primary recommendation and no more than two alternatives. Each recommendation card includes:

- product title and image;
- current price;
- relevant available variants;
- a concise explanation tied to the visitor's answers;
- direct product and size-guide actions;
- a clear label when a result is an alternative rather than the primary match.

The assistant must not present an unavailable variant as purchasable. When no suitable available product exists, it explains the limitation and offers human contact instead of forcing an inferior recommendation.

### 3.4 Context from the current page

On a product page, the assistant may use the current product handle as initial context. Page context is a hint, not a source of truth. Product facts, price, and availability still come from the server-side Shopify tool.

### 3.5 Human handoff

The assistant offers human help when:

- confidence is low;
- sources conflict or do not answer the question;
- a complaint, claim, payment issue, or concrete order is mentioned;
- personal information is required;
- the visitor rejects or cannot use the available recommendations;
- two consecutive assistant responses fail to move the conversation forward.

The handoff view contains:

- a link to the existing contact form at `/kontaktskjema`;
- a `mailto:` action for `kundeservice@utekos.no`;
- a `tel:` action for `+47 40 21 63 43`;
- a locally generated conversation summary that the visitor can review and copy.

The assistant never sends the summary or contact details automatically. The visitor initiates all external contact.

## 4. Architecture

```text
Customer in first-party Next.js UI
  -> Vercel Route Handler
       -> request validation, abuse controls, safety routing
       -> Shopify read tool for live product truth
       -> GCP knowledge search for grounded support answers
       -> GCP commerce recommendation serving when eligible
       -> deterministic handoff builder
  -> streamed UI response

Structured outcome events
  -> existing first-party canonical analytics flow
  -> consent-gated GA4/PostHog/provider measurement without message text

Restricted quality records
  -> Supabase server client
  -> structured session outcomes and short-lived redacted knowledge gaps
```

### 4.1 Frontend boundary

The customer-assistant frontend owns:

- launcher and panel state;
- quick actions;
- message rendering;
- product recommendation cards;
- source links;
- feedback controls;
- human-handoff controls;
- accessible focus and announcement behavior.

It does not contain provider credentials, Shopify Admin access, business rules for availability, or direct GCP calls.

Expected component boundaries:

- `CustomerAssistantLauncher`
- `CustomerAssistantPanel`
- `AssistantQuickActions`
- `AssistantMessageList`
- `AssistantProductRecommendation`
- `AssistantHandoff`
- `AssistantFeedback`

Components remain focused and independently testable. The implementation follows the repository's React Compiler rules and does not add manual `useMemo` or `useCallback`.

### 4.2 Server orchestration boundary

A versioned Route Handler receives validated UI messages and streams typed UI responses. The server orchestrator owns:

- session and request limits;
- intent and safety routing;
- tool selection;
- source attribution;
- recommendation explanation;
- uncertainty handling;
- structured outcome recording.

The language model cannot call arbitrary URLs or construct unrestricted provider requests. It receives an explicit, narrow tool registry.

### 4.3 Tool contracts

#### `search_support_knowledge`

Input:

- normalized question;
- optional known product handle;
- locale fixed to Norwegian Bokmål for version 1.

Output:

- grounded answer passages;
- canonical source URLs;
- retrieval confidence;
- document update metadata.

#### `get_shopify_products`

Input:

- explicit product handles or bounded product query;
- optional size and availability constraints.

Output:

- product and variant IDs;
- handles and canonical URLs;
- titles, descriptions, images, prices, and currencies;
- variant options;
- current availability and available quantities when the API permits.

The server supplies buyer-context headers required by Shopify. Storefront credentials remain server-only.
The customer UI displays availability status, not exact inventory quantity. Scarcity language is not generated from quantity data.

#### `get_product_recommendations`

Input:

- current product or bounded visitor need;
- anonymous session identifier;
- only the minimum event context required by the selected serving configuration.

Output:

- ranked product IDs;
- serving attribution token where required;
- serving configuration and model metadata.

The application resolves returned IDs against Shopify before display. Personalized results are never cached across visitors.

#### `build_handoff`

Input:

- safe intent category;
- assistant-created summary based on the active browser conversation.

Output:

- contact-form path;
- email and telephone actions;
- editable local summary;
- reason for escalation.

This tool does not transmit the summary.

### 4.4 Authentication

Vercel authenticates to Google Cloud with short-lived workload identity through the existing Vercel OIDC pattern. No long-lived GCP service-account key is added.

Shopify Storefront access remains server-side. Shopify Admin tokens are not exposed to the browser and are not needed for the runtime assistant.

Supabase writes use an existing server-only client pattern with table-specific least privilege. Browser code receives no service-role credential.

## 5. Sources of truth

Sources are resolved in this order:

1. Shopify for product, variant, price, and availability facts.
2. Approved Utekos pages and Sanity content for size, materials, shipping, returns, and care.
3. Curated customer-service answers for approved gaps not yet covered by public content.

The model must not combine conflicting claims silently. If Shopify disagrees with indexed content about a commercial fact, Shopify wins. If two policy sources conflict, the assistant states that it cannot verify the answer and hands off.

### 5.1 Approved knowledge corpus

The initial corpus contains only reviewed Utekos material:

- product pages;
- size guide;
- technology and materials guide;
- washing and care guide;
- shipping and returns page;
- contact page;
- explicitly approved customer-service answers.

The existing GCP document containing unrelated development-prompt content is excluded. It is not deleted or mutated without separate approval.

Each indexed document record includes:

- canonical URL;
- title;
- content type;
- locale;
- source-system identifier;
- last-reviewed timestamp;
- checksum;
- publication status.

Unpublished, duplicate, expired, or unreviewed documents do not enter the production data store.

### 5.2 Knowledge synchronization

A deterministic sync job builds the corpus from approved sources, normalizes content, computes checksums, and updates only changed documents. The first implementation supports a manually invoked preview sync. Automated production scheduling is a later deployment step that requires environment and provider approval.

### 5.3 Commerce catalog synchronization

The existing default GCP commerce catalog is empty. The initial import uses the supported Catalog API rather than the deprecated new-user Merchant Center connector.

The catalog sync:

- maps Shopify product and variant identifiers consistently;
- excludes draft and inactive products;
- records canonical URLs, images, price, currency, categories, and availability fields supported by the API;
- is idempotent;
- emits a reconciliation report for missing, rejected, and stale products.

Shopify remains the response-time availability authority because GCP catalog propagation can lag.

## 6. Recommendation strategy

### 6.1 Stage 1: deterministic fit plus catalog similarity

The first production stage uses:

- explicit visitor answers;
- hard constraints such as available size and product status;
- Utekos-authored product attributes;
- catalog-based similar-product results when available.

Hard constraints override model ranking. The assistant cannot select an unavailable product merely because a recommender ranked it highly.

### 6.2 Stage 2: personalized recommendations

Personalization remains disabled until all these gates pass:

- catalog reconciliation is green;
- real-time user-event validation is green;
- anonymous visitor IDs are stable within the permitted consent state;
- event attribution tokens are returned correctly;
- credit-eligible training and prediction SKUs are confirmed in Cloud Billing;
- an offline relevance review shows no systematic unsuitable recommendations;
- a production holdout design is approved.

Until then, existing `recently_viewed` infrastructure is treated as provisioned but not evidence of readiness.

### 6.3 Category-entry-point use

The assistant's structured need categories can reveal recurring buying situations, but they are operational hypotheses rather than direct measurements of category memory. They may inform later CEP research; they do not replace representative buyer research.

## 7. Response policy and guardrails

The assistant:

- responds in clear Norwegian Bokmål by default;
- keeps answers short and decision-oriented;
- distinguishes verified facts from recommendations;
- explains why a product fits the supplied needs;
- links to the most relevant Utekos source;
- acknowledges uncertainty instead of inventing detail;
- avoids pressure, false scarcity, and unsupported superlatives;
- refuses to fabricate discounts, delivery times, stock, warmth ratings, or guarantees;
- does not give medical, legal, or safety-critical advice;
- does not disparage competitors;
- routes order, payment, complaint, and personal-data cases to a human.

Commercial guidance is useful but not manipulative. The assistant should reduce decision friction while preserving the visitor's ability to decide not to buy.

## 8. Data minimization and privacy

Current core-release status: transcript, feedback, and browser conversation
state are memory-only. The pseudonymous session ID is nevertheless transmitted
with chat requests and written to structured operational logs together with
intent, outcome code, and latency; customer text is not logged. Supabase outcome
storage and the retention controls below remain Release 3 design, not deployed
current state. Operational-log access and retention must be verified and
documented before provider activation; no already-configured retention period is
assumed.

### 8.1 Runtime messages

Messages are processed to answer the active conversation. They are not written to GA4, PostHog, GTM, ad platforms, URLs, browser storage, or application logs.

The browser holds active conversation state in memory. Closing or refreshing the page clears it in version 1.

### 8.2 Structured session outcomes

In Release 3, Supabase stores only:

- pseudonymous assistant session ID;
- timestamps;
- selected intent category;
- page type and product handle when relevant;
- tool success/failure codes;
- recommended product IDs;
- product and handoff actions;
- helpful/not-helpful response;
- answer-confidence band;
- knowledge-gap category;
- model/search/serving configuration versions;
- consent-safe attribution identifiers already permitted by the existing analytics contract.

It does not store customer names, email addresses, telephone numbers, addresses, order numbers, payment data, or full chat transcripts.

The Release 3 retention design deletes structured session outcomes automatically
after 180 days. That policy is not current production configuration until the
approved migration and purge schedule are applied and verified. Non-identifying
aggregate counts may be retained for longer-term commercial measurement.

### 8.3 Restricted knowledge-gap samples

For an unanswered question only, the server may create one redacted excerpt with these controls:

- maximum 500 characters;
- deterministic removal of common email, telephone, address, order-number, and payment patterns;
- no storage when the safety classifier detects a complaint, order, payment, health, or sensitive-personal-data intent;
- no storage when redaction confidence is low;
- restricted service-role access;
- automatic deletion after 30 days;
- feature remains disabled until the privacy notice and Usercentrics classification are reviewed.

If disabled or rejected, only the structured knowledge-gap category is stored.

### 8.4 Consent

Assistant functionality is separated from marketing measurement. The visitor can request assistance without granting advertising consent. Analytics and marketing events continue to use the repository's established consent gates. No new provider receives personal data merely because the assistant is opened.

## 9. Measurement design

### 9.1 Canonical events

The assistant adds bounded first-party events:

| Event | Trigger | Text allowed |
| --- | --- | --- |
| `assistant_open` | Panel becomes visible | No |
| `assistant_intent_select` | Visitor chooses a help category | Enumerated category only |
| `assistant_question_submit` | Valid question is submitted | No |
| `assistant_recommendation_view` | Recommendation card is visible | Product IDs and rank only |
| `assistant_product_click` | Product or size-guide action | Destination type and product ID |
| `assistant_handoff` | Contact option is selected | Channel and enumerated reason |
| `assistant_feedback` | Helpful/not-helpful selected | Boolean and enumerated reason |
| `assistant_unanswered` | Assistant cannot provide a grounded answer | Enumerated topic and failure code |

Existing canonical commerce events remain the source for add-to-cart, checkout, and purchase. The assistant must not create duplicate commerce events.

### 9.2 Outcome metrics

Primary behavioral outcomes:

- qualified product visits after assistance;
- add-to-cart rate after an assistant recommendation;
- purchase conversion and revenue in assistant-exposed versus holdout traffic;
- appropriate human handoff rate;
- grounded-answer success rate.

Guardrail metrics:

- incorrect availability claims;
- unsupported factual claims;
- response latency;
- provider error rate;
- cost per completed assistant session;
- negative feedback;
- repeated unanswered intents.

Chat count, session length, or message volume alone is not a success metric.

### 9.3 Attribution and incrementality

A pseudonymous assistant-session identifier may be attached to consent-permitted first-party events. Purchase remains recorded by the existing canonical purchase flow.

The staged release preserves a holdout group so observed conversion changes can be separated from ordinary traffic variation. No sales-lift claim is made until sample size, exposure, and confidence intervals are reported.

## 10. Error handling

| Failure | Customer behavior | Recording |
| --- | --- | --- |
| Shopify unavailable | Do not state price or availability; offer general guidance and human help | Structured provider failure |
| GCP knowledge unavailable | Show only deterministic Shopify facts and approved static handoff content | Structured provider failure |
| Recommendation service unavailable | Continue guided deterministic matching | Structured provider failure |
| Supabase unavailable | Continue the conversation; drop non-critical quality write | Operational error without message text |
| Rate limit reached | Explain the temporary limit and show contact channels | Abuse/rate-limit code |
| Conflicting sources | State uncertainty and hand off | Conflict source IDs, no message text |
| Stream interrupted | Preserve already rendered safe content and offer retry | Transport failure |
| Invalid provider output | Reject it server-side and return a safe fallback | Validation failure |

No analytics, database, or recommendation failure is allowed to block storefront navigation, cart behavior, or checkout.

## 11. Abuse and security controls

The server enforces:

- schema validation for every request and provider response;
- bounded message and conversation length;
- per-session and per-IP rate limits with privacy-conscious hashing;
- allowed tool names and arguments;
- timeout and retry budgets;
- prompt-injection resistance by treating retrieved text as untrusted data;
- output validation before rendering links or product cards;
- same-origin checks for browser requests;
- server-only provider credentials;
- safe logging without messages or secrets.

External links are restricted to approved Utekos and provider destinations. Generated HTML is never rendered.

IP-based rate limiting uses a server-side HMAC with a rotating daily key. Raw IP addresses and reusable IP hashes are not persisted.

## 12. GCP credit and cost strategy

The supplied promotions are treated as restricted credits, not general cash balance.

### 12.1 GenAI App Builder credit

The visible one-time promotion is NOK 9,267 and expires on 2027-06-20. The design does not assume that every Gemini or Vertex AI SKU is eligible.

Prioritize the credit for:

- dedicated Utekos support data store and grounded search/answer serving;
- enterprise search features demonstrably covered by the promotion;
- preview and production queries within a documented budget.

Raw generative-model usage outside eligible App Builder/Gemini Enterprise SKUs remains disabled unless Cloud Billing confirms coverage or the user separately approves paid use.

### 12.2 Recommendations AI credit

The visible one-time promotion is NOK 5,935.08. Its exact expiry and remaining balance must be confirmed in Cloud Billing before training begins.

Prioritize the credit for the explicitly supplied training and prediction SKUs:

- Recommendations AI Prediction: `D3C0-7720-A6B4`;
- Recommendations AI Training: `3524-92C1-1640`.

Training is not started merely to consume credit. It begins only when data-quality gates make the output useful.

### 12.3 Cost controls

Before production traffic:

- validate both promotion terms and eligible SKUs in Cloud Billing;
- create budget alerts for the hosting project;
- define per-session request ceilings;
- cap provider retries;
- cache only non-personalized, non-inventory knowledge where safe;
- include provider usage and estimated cost in the operational dashboard.

## 13. Testing

### 13.1 Unit tests

Cover:

- request and response schemas;
- product filtering and availability rules;
- recommendation ranking overrides;
- source-conflict handling;
- PII redaction and restricted-sample rejection;
- analytics payloads containing no conversation text;
- handoff triggers;
- provider timeout and fallback mapping.

### 13.2 Contract tests

Use recorded, sanitized provider fixtures to verify:

- Shopify product/variant normalization;
- GCP search result normalization and source attribution;
- recommendation result normalization and attribution tokens;
- Supabase structured-record shapes.

Live provider tests are read-only unless separately approved.

### 13.3 Evaluation set

Create a versioned Norwegian evaluation set covering:

- product differences and use cases;
- size and fit;
- available and unavailable variants;
- shipping and returns;
- materials and care;
- ambiguous questions;
- source conflicts;
- prompt injection;
- complaints, orders, payment, and personal information;
- service outages.

Every item defines expected source class, acceptable answer facts, prohibited claims, expected tool calls, and whether human handoff is required.

### 13.4 Launch quality gates

Before limited production exposure:

- zero critical unsupported claims in the approved evaluation set;
- zero displayed unavailable variants marked as purchasable;
- 100% correct handoff for restricted-order, payment, complaint, and sensitive-data cases;
- 100% of factual support answers grounded in an approved source or deterministic Shopify result;
- no message text in analytics test captures;
- keyboard, focus, screen-reader announcement, reduced-motion, and mobile viewport checks pass;
- warm-preview streaming begins within three seconds at p95 under the defined test load;
- storefront, cart, and checkout regression suites remain green;
- cost controls and rollback are verified.

## 14. Progressive rollout

### Stage 0: local and fixture evaluation

Use deterministic fixtures and approved knowledge snapshots. No production provider mutation is required.

### Stage 1: internal preview

Deploy to an authorized Vercel preview with Vercel Deployment Protection verified
as enabled. Only Utekos reviewers receive the feature flag. Read-only live
Shopify checks may be used.

### Stage 2: limited production experiment

After explicit production and provider approvals, expose the assistant to a stable, randomly selected minority of eligible storefront sessions. Preserve a holdout.

### Stage 3: wider release

Increase exposure only when quality, latency, error, cost, privacy, and commercial guardrails remain green. Full exposure is reversible through the feature flag without code deployment.

## 15. Operational ownership

The operational view reports:

- provider health;
- latency and timeout rates;
- catalog and knowledge-sync freshness;
- unanswered intent categories;
- negative feedback;
- escalation rate;
- recommendation coverage;
- cost and promotion consumption;
- experiment exposure and outcomes.

Alerts contain identifiers and failure codes, never customer message text.

Knowledge-gap review produces one of four actions:

1. improve an existing public Utekos page;
2. add an approved curated answer;
3. improve product attributes in Shopify/Sanity;
4. keep the question human-only.

## 16. Expected implementation surfaces

Likely new or changed areas:

- `src/components/customer-assistant/`
- `src/app/api/customer-assistant/chat/route.ts`
- `src/lib/customer-assistant/`
- server-side Shopify read adapter
- GCP search and recommendation adapters
- Supabase migrations for assistant quality tables
- first-party assistant event schemas and reporters
- GCP catalog and knowledge reconciliation scripts
- evaluation fixtures and tests
- operational and deployment documentation

Exact filenames and task order belong in the implementation plan. Existing Chatbase code is removed only when repository references and live usage are proven absent.

## 17. Non-goals

- authenticated order lookup;
- order changes, refunds, or claims processing;
- payment handling;
- sending email or contact forms on the customer's behalf;
- agent live-chat staffing or presence detection;
- voice support;
- multilingual support in version 1;
- autonomous discounting;
- competitor comparison;
- personalization before data-quality and consent gates;
- replacing public product and support content with chat-only information;
- GTM publishing or production deployment without explicit approval.

## 18. Acceptance criteria

The implementation is complete only when:

1. A customer can open, navigate, and close the assistant accessibly on supported storefront pages.
2. Guided product help produces bounded, explained recommendations using verified Shopify facts.
3. Displayed price and availability are response-time Shopify results.
4. Support answers are grounded in the approved Utekos corpus and include relevant source links.
5. Restricted and uncertain cases consistently offer contact form, email, and telephone handoff.
6. The assistant never sends a handoff summary automatically.
7. Analytics contain structured events without conversation text or direct personal identifiers.
8. Supabase stores only the approved structured fields and gated redacted samples.
9. GCP catalog and knowledge reconciliation reports are green.
10. Recommendation personalization remains off until every Stage 2 gate is documented.
11. Evaluation, accessibility, security, performance, regression, cost, and rollback gates pass.
12. Limited production exposure and every provider or schema mutation have separate explicit approval.

## 19. Verified documentation and evidence

Official implementation sources:

- Next.js 16.2 Route Handlers, streaming, async request APIs, and server patterns through the current Next.js documentation.
- Vercel AI SDK 6 streaming UI messages and typed tool patterns through the current official AI SDK documentation.
- Google Cloud Discovery Engine Node API for search and `answerQuery`.
- [AI Commerce Search documentation](https://docs.cloud.google.com/retail/docs)
- [AI Commerce Search features](https://docs.cloud.google.com/retail/docs/features)
- [Recommendation serving](https://docs.cloud.google.com/retail/docs/predict)
- [Recommendation models](https://docs.cloud.google.com/retail/docs/models)
- [User-event requirements](https://docs.cloud.google.com/retail/docs/user-events)
- [Real-time event recording](https://docs.cloud.google.com/retail/docs/record-events)
- [Catalog import](https://docs.cloud.google.com/retail/docs/upload-catalog)
- Shopify Storefront API and headless-channel guidance from the current official Shopify developer documentation.
- Existing repository contracts in `AGENTS.md`, `PLAN.md`, `DEPLOYMENT.md`, `FLOW.md`, and `COMMERCIAL_INTELLIGENCE_PLAN.md`.

Marketing evidence:

- Sharp and Romaniuk: mental and physical availability work together; the assistant must reduce both understanding and buying friction.
- Binet and Field: measurement must match the mechanism and time horizon; chat activity is not a sales-effect proxy.
- Ehrenberg-Bass/LinkedIn B2B Institute CEP guidance: observed assistant intents are hypotheses about buying situations, not direct category-memory measurement.

## 20. Implementation authorization gates

This approved design authorizes planning and local code/test work. It does not by itself authorize:

- production deployment;
- GCP resource creation, update, training, or deletion;
- Supabase schema mutation;
- Shopify webhook, catalog, or Admin mutation;
- Vercel environment-variable changes;
- GTM publishing;
- paid usage outside confirmed promotion coverage.

Each such action requires an explicit, target-specific user approval after a read-only diff or action summary is presented.
