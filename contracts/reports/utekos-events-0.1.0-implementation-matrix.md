# Utekos Events API 0.1.0 implementation matrix

Characterized against `97a0a4538f9682a2b210e50b770ce59f826b42ac` from `origin/main` on 2026-08-15.

All 27 route modules export `POST`, set `maxDuration = 60`, enrich request context with Vercel geolocation/IP data, and delegate first to `createBrowserEventRouteHandler` for traffic classification. The request layer requires a same-origin `Origin` header, `application/json`, and a UTF-8 body no larger than 32 KiB.

| Route | Canonical event | Request handler | Acceptance handler | Normalizer | Zod schema |
| --- | --- | --- | --- | --- | --- |
`/api/events/add-to-cart` | `add_to_cart` | `src/lib/analytics/server/handleCanonicalAddToCartRequest.ts` | `src/lib/analytics/server/acceptCanonicalAddToCart.ts` | `src/lib/analytics/server/normalizeCanonicalAddToCart.ts` | `src/lib/analytics/addToCartEvent.ts`
`/api/events/add-to-wishlist` | `add_to_wishlist` | `src/lib/analytics/server/handleCanonicalAddToWishlistRequest.ts` | `src/lib/analytics/server/acceptCanonicalAddToWishlist.ts` | `src/lib/analytics/server/normalizeCanonicalAddToWishlist.ts` | `src/lib/analytics/addToWishlistEvent.ts`
`/api/events/begin-checkout` | `begin_checkout` | `src/lib/analytics/server/handleCanonicalBeginCheckoutRequest.ts` | `src/lib/analytics/server/acceptCanonicalBeginCheckout.ts` | `src/lib/analytics/server/normalizeCanonicalBeginCheckout.ts` | `src/lib/analytics/beginCheckoutEvent.ts`
`/api/events/filter-apply` | `filter_apply` | `src/lib/analytics/server/handleCanonicalFilterApplyRequest.ts` | `src/lib/analytics/server/acceptCanonicalFilterApply.ts` | `src/lib/analytics/server/normalizeCanonicalFilterApply.ts` | `src/lib/analytics/filterApplyEvent.ts`
`/api/events/form-error` | `form_error` | `src/lib/analytics/server/handleCanonicalFormErrorRequest.ts` | `src/lib/analytics/server/acceptCanonicalFormError.ts` | `src/lib/analytics/server/normalizeCanonicalFormError.ts` | `src/lib/analytics/formErrorEvent.ts`
`/api/events/form-start` | `form_start` | `src/lib/analytics/server/handleCanonicalFormStartRequest.ts` | `src/lib/analytics/server/acceptCanonicalFormStart.ts` | `src/lib/analytics/server/normalizeCanonicalFormStart.ts` | `src/lib/analytics/formStartEvent.ts`
`/api/events/form-submit` | `form_submit` | `src/lib/analytics/server/handleCanonicalFormSubmitRequest.ts` | `src/lib/analytics/server/acceptCanonicalFormSubmit.ts` | `src/lib/analytics/server/normalizeCanonicalFormSubmit.ts` | `src/lib/analytics/formSubmitEvent.ts`
`/api/events/generate-lead` | `generate_lead` | `src/lib/analytics/server/handleCanonicalGenerateLeadRequest.ts` | `src/lib/analytics/server/acceptCanonicalGenerateLead.ts` | `src/lib/analytics/server/normalizeCanonicalGenerateLead.ts` | `src/lib/analytics/generateLeadEvent.ts`
`/api/events/hero-interact` | `hero_interact` | `src/lib/analytics/server/handleCanonicalHeroInteractRequest.ts` | `src/lib/analytics/server/acceptCanonicalHeroInteract.ts` | `src/lib/analytics/server/normalizeCanonicalHeroInteract.ts` | `src/lib/analytics/heroInteractEvent.ts`
`/api/events/interact-with-accordion` | `interact_with_accordion` | `src/lib/analytics/server/handleCanonicalInteractWithAccordionRequest.ts` | `src/lib/analytics/server/acceptCanonicalInteractWithAccordion.ts` | `src/lib/analytics/server/normalizeCanonicalInteractWithAccordion.ts` | `src/lib/analytics/interactWithAccordionEvent.ts`
`/api/events/open-quick-view` | `open_quick_view` | `src/lib/analytics/server/handleCanonicalOpenQuickViewRequest.ts` | `src/lib/analytics/server/acceptCanonicalOpenQuickView.ts` | `src/lib/analytics/server/normalizeCanonicalOpenQuickView.ts` | `src/lib/analytics/openQuickViewEvent.ts`
`/api/events/page-view` | `page_view` | `src/lib/analytics/server/handleCanonicalPageViewRequest.ts` | `src/lib/analytics/server/acceptCanonicalPageView.ts` | `src/lib/analytics/server/normalizeCanonicalPageView.ts` | `src/lib/analytics/pageViewEvent.ts`
`/api/events/remove-from-cart` | `remove_from_cart` | `src/lib/analytics/server/handleCanonicalRemoveFromCartRequest.ts` | `src/lib/analytics/server/acceptCanonicalRemoveFromCart.ts` | `src/lib/analytics/server/normalizeCanonicalRemoveFromCart.ts` | `src/lib/analytics/removeFromCartEvent.ts`
`/api/events/scroll-depth` | `scroll_depth` | `src/lib/analytics/server/handleCanonicalScrollDepthRequest.ts` | `src/lib/analytics/server/acceptCanonicalScrollDepth.ts` | `src/lib/analytics/server/normalizeCanonicalScrollDepth.ts` | `src/lib/analytics/scrollDepthEvent.ts`
`/api/events/search` | `search` | `src/lib/analytics/server/handleCanonicalSearchRequest.ts` | `src/lib/analytics/server/acceptCanonicalSearch.ts` | `src/lib/analytics/server/normalizeCanonicalSearch.ts` | `src/lib/analytics/searchEvent.ts`
`/api/events/select-item` | `select_item` | `src/lib/analytics/server/handleCanonicalSelectItemRequest.ts` | `src/lib/analytics/server/acceptCanonicalSelectItem.ts` | `src/lib/analytics/server/normalizeCanonicalSelectItem.ts` | `src/lib/analytics/selectItemEvent.ts`
`/api/events/select-promotion` | `select_promotion` | `src/lib/analytics/server/handleCanonicalSelectPromotionRequest.ts` | `src/lib/analytics/server/acceptCanonicalSelectPromotion.ts` | `src/lib/analytics/server/normalizeCanonicalSelectPromotion.ts` | `src/lib/analytics/selectPromotionEvent.ts`
`/api/events/size-guide-view` | `size_guide_view` | `src/lib/analytics/server/handleCanonicalSizeGuideViewRequest.ts` | `src/lib/analytics/server/acceptCanonicalSizeGuideView.ts` | `src/lib/analytics/server/normalizeCanonicalSizeGuideView.ts` | `src/lib/analytics/sizeGuideViewEvent.ts`
`/api/events/sort-apply` | `sort_apply` | `src/lib/analytics/server/handleCanonicalSortApplyRequest.ts` | `src/lib/analytics/server/acceptCanonicalSortApply.ts` | `src/lib/analytics/server/normalizeCanonicalSortApply.ts` | `src/lib/analytics/sortApplyEvent.ts`
`/api/events/variant-select` | `variant_select` | `src/lib/analytics/server/handleCanonicalVariantSelectRequest.ts` | `src/lib/analytics/server/acceptCanonicalVariantSelect.ts` | `src/lib/analytics/server/normalizeCanonicalVariantSelect.ts` | `src/lib/analytics/variantSelectEvent.ts`
`/api/events/video-progress` | `video_progress` | `src/lib/analytics/server/handleCanonicalVideoProgressRequest.ts` | `src/lib/analytics/server/acceptCanonicalVideoProgress.ts` | `src/lib/analytics/server/normalizeCanonicalVideoProgress.ts` | `src/lib/analytics/videoProgressEvent.ts`
`/api/events/view-cart` | `view_cart` | `src/lib/analytics/server/handleCanonicalViewCartRequest.ts` | `src/lib/analytics/server/acceptCanonicalViewCart.ts` | `src/lib/analytics/server/normalizeCanonicalViewCart.ts` | `src/lib/analytics/viewCartEvent.ts`
`/api/events/view-category` | `view_category` | `src/lib/analytics/server/handleCanonicalViewCategoryRequest.ts` | `src/lib/analytics/server/acceptCanonicalViewCategory.ts` | `src/lib/analytics/server/normalizeCanonicalViewCategory.ts` | `src/lib/analytics/viewCategoryEvent.ts`
`/api/events/view-item` | `view_item` | `src/lib/analytics/server/handleCanonicalViewItemRequest.ts` | `src/lib/analytics/server/acceptCanonicalViewItem.ts` | `src/lib/analytics/server/normalizeCanonicalViewItem.ts` | `src/lib/analytics/viewItemEvent.ts`
`/api/events/view-item-list` | `view_item_list` | `src/lib/analytics/server/handleCanonicalViewItemListRequest.ts` | `src/lib/analytics/server/acceptCanonicalViewItemList.ts` | `src/lib/analytics/server/normalizeCanonicalViewItemList.ts` | `src/lib/analytics/viewItemListEvent.ts`
`/api/events/view-promotion` | `view_promotion` | `src/lib/analytics/server/handleCanonicalViewPromotionRequest.ts` | `src/lib/analytics/server/acceptCanonicalViewPromotion.ts` | `src/lib/analytics/server/normalizeCanonicalViewPromotion.ts` | `src/lib/analytics/viewPromotionEvent.ts`
`/api/events/view-search-results` | `view_search_results` | `src/lib/analytics/server/handleCanonicalViewSearchResultsRequest.ts` | `src/lib/analytics/server/acceptCanonicalViewSearchResults.ts` | `src/lib/analytics/server/normalizeCanonicalViewSearchResults.ts` | `src/lib/analytics/viewSearchResultsEvent.ts`

## Shared response behavior

| Status | Body | Meaning |
| --- | --- | --- |
| `202` | `{ event_id, status: "accepted" }` | Inserted by the canonical store. |
| `200` | `{ event_id, status: "duplicate" }` | Existing `event_id`. |
| `204` | Empty | Consent denied or traffic excluded before collection. |
| `400` | `{ error: "invalid_json" | "invalid_event" }` | JSON or Zod validation failure. |
| `403` | `{ error: "forbidden_origin" }` | Missing, malformed, or cross-origin `Origin`. |
| `413` | `{ error: "payload_too_large" }` | Declared or measured body larger than 32 KiB. |
| `415` | `{ error: "unsupported_media_type" }` | Media type is not `application/json`. |
| `500` | `{ error: "internal_error" }` | Non-Zod failure during normalization, persistence, or request-side processing. |

## Specialized request handlers

- `page-view`: can set first-party cookies and schedules collector-receipt observation.
- `add-to-cart`: adds commerce observability logging.
- `begin-checkout`: validates the body, then overwrites `checkout_method` from `X-Utekos-Checkout-Method`; missing or invalid header values normalize to `shopify_checkout`.
- `view-item`: has a dedicated request handler; its observable HTTP status/body surface matches the shared handler.

## OpenAPI 3.0 representation gaps

- `canonicalRemoveFromCartSchema.superRefine` requires `page_url` and `page_title` only when `source === "web"`. The generated schema carries this as `x-utekos-runtime-constraints`.
- `canonicalViewItemListCustomDataSchema.superRefine` requires `total_item_count >= items.length`. The generated schema carries this as `x-utekos-runtime-constraints`.
- Automatic Next.js `OPTIONS` behavior is framework-owned and is not asserted in the 0.1.0 contract because the verified documentation did not establish the exact response status/body used by this pinned runtime.
