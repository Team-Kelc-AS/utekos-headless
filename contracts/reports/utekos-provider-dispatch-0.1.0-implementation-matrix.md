# Utekos Provider Dispatch 0.1.0 implementation matrix

Characterized queue topic: `canonical-provider-dispatch-v1`.

The queue message contains only `adapter_key`, `attempt_id`, and `schema_version`. Canonical events, user identifiers, provider tokens, provider payloads, and provider responses remain in the persisted ledger/outbox boundary and are not queue fields.

| Adapter key | Provider | Canonical event | Runtime status |
| --- | --- | --- | --- |
| `google:add_payment_info` | `google` | `add_payment_info` | registered adapter + worker |
| `google:add_to_cart` | `google` | `add_to_cart` | registered adapter + worker |
| `google:add_to_wishlist` | `google` | `add_to_wishlist` | registered adapter + worker |
| `google:begin_checkout` | `google` | `begin_checkout` | registered adapter + worker |
| `google:filter_apply` | `google` | `filter_apply` | registered adapter + worker |
| `google:form_error` | `google` | `form_error` | registered adapter + worker |
| `google:form_start` | `google` | `form_start` | registered adapter + worker |
| `google:form_submit` | `google` | `form_submit` | registered adapter + worker |
| `google:generate_lead` | `google` | `generate_lead` | registered adapter + worker |
| `google:hero_interact` | `google` | `hero_interact` | registered adapter + worker |
| `google:interact_with_accordion` | `google` | `interact_with_accordion` | registered adapter + worker |
| `google:open_quick_view` | `google` | `open_quick_view` | registered adapter + worker |
| `google:purchase` | `google` | `purchase` | registered adapter + worker |
| `google:refund` | `google` | `refund` | registered adapter + worker |
| `google:remove_from_cart` | `google` | `remove_from_cart` | registered adapter + worker |
| `google:scroll_depth` | `google` | `scroll_depth` | registered adapter + worker |
| `google:search` | `google` | `search` | registered adapter + worker |
| `google:select_item` | `google` | `select_item` | registered adapter + worker |
| `google:select_promotion` | `google` | `select_promotion` | registered adapter + worker |
| `google:size_guide_view` | `google` | `size_guide_view` | registered adapter + worker |
| `google:sort_apply` | `google` | `sort_apply` | registered adapter + worker |
| `google:variant_select` | `google` | `variant_select` | registered adapter + worker |
| `google:video_progress` | `google` | `video_progress` | registered adapter + worker |
| `google:view_cart` | `google` | `view_cart` | registered adapter + worker |
| `google:view_category` | `google` | `view_category` | registered adapter + worker |
| `google:view_item` | `google` | `view_item` | registered adapter + worker |
| `google:view_item_list` | `google` | `view_item_list` | registered adapter + worker |
| `google:view_promotion` | `google` | `view_promotion` | registered adapter + worker |
| `google:view_search_results` | `google` | `view_search_results` | registered adapter + worker |
| `meta:add_to_cart` | `meta` | `add_to_cart` | registered adapter + worker |
| `meta:add_to_wishlist` | `meta` | `add_to_wishlist` | registered adapter + worker |
| `meta:begin_checkout` | `meta` | `begin_checkout` | registered adapter + worker |
| `meta:generate_lead` | `meta` | `generate_lead` | registered adapter + worker |
| `meta:hero_interact` | `meta` | `hero_interact` | registered adapter + worker |
| `meta:interact_with_accordion` | `meta` | `interact_with_accordion` | registered adapter + worker |
| `meta:open_quick_view` | `meta` | `open_quick_view` | registered adapter + worker |
| `meta:page_view` | `meta` | `page_view` | registered adapter + worker |
| `meta:purchase` | `meta` | `purchase` | registered adapter + worker |
| `meta:remove_from_cart` | `meta` | `remove_from_cart` | registered adapter + worker |
| `meta:scroll_depth` | `meta` | `scroll_depth` | registered adapter + worker |
| `meta:search` | `meta` | `search` | registered adapter + worker |
| `meta:select_item` | `meta` | `select_item` | registered adapter + worker |
| `meta:view_cart` | `meta` | `view_cart` | registered adapter + worker |
| `meta:view_category` | `meta` | `view_category` | registered adapter + worker |
| `meta:view_item` | `meta` | `view_item` | registered adapter + worker |
| `meta:view_item_list` | `meta` | `view_item_list` | registered adapter + worker |
| `microsoft_uet:add_to_cart` | `microsoft_uet` | `add_to_cart` | registered adapter + worker |
| `microsoft_uet:begin_checkout` | `microsoft_uet` | `begin_checkout` | registered adapter + worker |
| `microsoft_uet:page_view` | `microsoft_uet` | `page_view` | registered adapter + worker |
| `microsoft_uet:purchase` | `microsoft_uet` | `purchase` | registered adapter + worker |
| `pinterest:add_payment_info` | `pinterest` | `add_payment_info` | registered adapter + worker |
| `pinterest:add_to_cart` | `pinterest` | `add_to_cart` | registered adapter + worker |
| `pinterest:add_to_wishlist` | `pinterest` | `add_to_wishlist` | registered adapter + worker |
| `pinterest:begin_checkout` | `pinterest` | `begin_checkout` | registered adapter + worker |
| `pinterest:generate_lead` | `pinterest` | `generate_lead` | registered adapter + worker |
| `pinterest:purchase` | `pinterest` | `purchase` | registered adapter + worker |
| `pinterest:search` | `pinterest` | `search` | registered adapter + worker |
| `pinterest:view_category` | `pinterest` | `view_category` | registered adapter + worker |
| `pinterest:view_item` | `pinterest` | `view_item` | registered adapter + worker |

## Runtime invariants

- Publisher idempotency key: `adapter_key + ":" + attempt_id`.
- Publisher deduplication window: 86,400 seconds (the documented minimum of the seven-day retention and Vercel Queue's 24-hour maximum deduplication window).
- Queue retention: 604800 seconds (7 days).
- Consumer visibility timeout: 60 seconds.
- Trigger initial delay: 0 seconds.
- Retry delay after a failed callback: 15 seconds.
- Delivery guarantee: at least once. The persisted outbox claim remains the durable idempotency boundary.
- Unknown adapters, non-UUID attempt IDs, and additional fields are rejected by the strict Zod schema.
- Duplicate queue publication is treated as already published. The characterization test loads `DuplicateMessageError` through the same package export condition as the implementation so it verifies the runtime class identity rather than mixing the package's ESM and CommonJS builds.
- A post-commit queue publication error is captured but not rethrown; the persisted outbox remains recoverable by the cron fallback.
- Consumer outcomes are internal processing results, not a reply channel or proof of provider acceptance.

## Documentation and test boundary

- Contract syntax: official AsyncAPI 3.1.0 specification.
- Protocol bindings: official AsyncAPI bindings catalog; no Vercel Queue binding is declared.
- Queue semantics and limits: official Vercel Queues documentation plus the installed `@vercel/queue@0.4.0` package types and README.
- Deployment trigger: repository `vercel.json` and the queue route's `handleCallback` options.
- Executable characterization: `pnpm contracts:dispatch:test` covers generation drift, schema parity, trigger parity, publishing, duplicate suppression, strict validation, consumer acknowledgement/redelivery behavior, and targeted worker dispatch.
- No ReadyAPI execution result is claimed. The queue callback is invoked by Vercel's managed, signed delivery plane; the available environment does not contain ReadyAPI Desktop or its runner.
