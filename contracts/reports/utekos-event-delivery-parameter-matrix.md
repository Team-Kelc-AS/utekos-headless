# Utekos event-delivery parameter matrix

This report is generated from the canonical event catalog and the characterized provider implementations. The complete machine-readable parameter rules are in `contracts/events/utekos-event-delivery/0.1.0/parameter-contract.json` and are embedded per operation in Utekos Events API 0.1.0.

## Interpretation

- `required`: the provider or repository contract requires the value.
- `conditional`: required only for the applicable event, consent, identifier, source, or payload shape.
- `recommended`: provider-documented matching or deduplication signal that should be sent when legitimately available.
- `optional`: forwarded only when observed and permitted.
- `blocked_no_worker` and `disabled` are explicit non-delivery states; the contract does not claim that these server payloads are currently sent.

| Canonical event | Lifecycle | Provider | Browser | Server | Current implementation status |
| --- | --- | --- | --- | --- | --- |
| `page_view` | `active` | `supabase` | none | first_party_api (disabled; canonicalEnvelope) | Canonical first-party persistence is active. |
| `page_view` | `active` | `google` | google_tag_manager (implemented; googleBrowserDataLayer) | server_side_gtm (disabled; googleServer) | Canonical browser event is handled through GTM/sGTM; no server outbox is allowed. |
| `page_view` | `active` | `meta` | none | meta_conversions_api (active; metaServer) | Canonical Meta CAPI PageView outbox is active for newly accepted events. Historical blocked rows remain excluded from blind replay. |
| `page_view` | `active` | `microsoft_uet` | microsoft_uet (implemented; microsoftBrowser) | microsoft_uet_capi (active; microsoftServer) | Browser UET and CAPI pageLoad delivery are active for newly accepted consented page views. Historical blocked rows must not be replayed. |
| `page_view` | `active` | `pinterest` | none | none | Canonical page_view is not mapped to Pinterest PageVisit; product view_item owns PageVisit with catalog product IDs. |
| `page_view` | `active` | `posthog` | posthog_browser (not_implemented; event-specific logical requirements) | posthog_server (disabled; event-specific logical requirements) | The storefront PostHog integration is currently removed. |
| `view_item_list` | `active` | `supabase` | none | first_party_api (disabled; canonicalEnvelope) | Canonical first-party persistence is active. |
| `view_item_list` | `active` | `google` | google_tag_manager (implemented; googleBrowserDataLayer) | google_data_manager (active; googleServer) | GTM/sGTM and Data Manager outbox are active. |
| `view_item_list` | `active` | `meta` | meta_pixel (implemented; metaBrowser) | meta_conversions_api (active; metaServer) | Meta CAPI delivery is active. |
| `view_item_list` | `active` | `microsoft_uet` | microsoft_uet (implemented; microsoftBrowser) | microsoft_uet_capi (blocked_no_worker; microsoftServer) | Browser UET is active; server delivery is blocked because no UET CAPI worker exists. |
| `view_item_list` | `active` | `pinterest` | none | none | No v1 Pinterest conversion mapping is approved. |
| `view_item_list` | `active` | `posthog` | posthog_browser (not_implemented; event-specific logical requirements) | posthog_server (disabled; event-specific logical requirements) | The storefront PostHog integration is currently removed. |
| `select_item` | `active` | `supabase` | none | first_party_api (disabled; canonicalEnvelope) | Canonical first-party persistence is active. |
| `select_item` | `active` | `google` | google_tag_manager (implemented; googleBrowserDataLayer) | google_data_manager (active; googleServer) | GTM/sGTM and Data Manager outbox are active. |
| `select_item` | `active` | `meta` | meta_pixel (implemented; metaBrowser) | meta_conversions_api (active; metaServer) | Meta CAPI delivery is active. |
| `select_item` | `active` | `microsoft_uet` | microsoft_uet (implemented; microsoftBrowser) | microsoft_uet_capi (blocked_no_worker; microsoftServer) | Browser UET is active; server delivery is blocked because no UET CAPI worker exists. |
| `select_item` | `active` | `pinterest` | none | none | No v1 Pinterest conversion mapping is approved. |
| `select_item` | `active` | `posthog` | posthog_browser (not_implemented; event-specific logical requirements) | posthog_server (disabled; event-specific logical requirements) | The storefront PostHog integration is currently removed. |
| `view_item` | `active` | `supabase` | none | first_party_api (disabled; canonicalEnvelope) | Canonical first-party persistence is active. |
| `view_item` | `active` | `google` | google_tag_manager (implemented; googleBrowserDataLayer) | google_data_manager (active; googleServer) | GTM/sGTM and executed Data Manager are active. Local application mappings use canonical event_id as transaction_id, but published GTM forwarding is not live-verified, so cross-source deduplication remains a release risk. |
| `view_item` | `active` | `meta` | none | meta_conversions_api (active; metaServer) | Meta CAPI delivery is active in production. |
| `view_item` | `active` | `microsoft_uet` | microsoft_uet (implemented; microsoftBrowser) | microsoft_uet_capi (blocked_no_worker; microsoftServer) | Browser UET is active; server delivery is blocked because no UET CAPI worker exists. |
| `view_item` | `active` | `pinterest` | pinterest_tag (implemented; pinterestBrowser) | pinterest_conversions_api (active; pinterestServer) | Pinterest Tag and Conversions API outbox are active. |
| `view_item` | `active` | `posthog` | posthog_browser (not_implemented; event-specific logical requirements) | posthog_server (disabled; event-specific logical requirements) | The storefront PostHog integration is currently removed. |
| `add_to_wishlist` | `active` | `supabase` | none | first_party_api (disabled; canonicalEnvelope) | Canonical first-party persistence is active. |
| `add_to_wishlist` | `active` | `google` | google_tag_manager (implemented; googleBrowserDataLayer) | google_data_manager (active; googleServer) | GTM/sGTM and Data Manager outbox are active. |
| `add_to_wishlist` | `active` | `meta` | meta_pixel (implemented; metaBrowser) | meta_conversions_api (active; metaServer) | Meta CAPI delivery is active. |
| `add_to_wishlist` | `active` | `microsoft_uet` | microsoft_uet (implemented; microsoftBrowser) | microsoft_uet_capi (blocked_no_worker; microsoftServer) | Browser UET is active; server delivery is blocked because no UET CAPI worker exists. |
| `add_to_wishlist` | `active` | `pinterest` | pinterest_tag (implemented; pinterestBrowser) | pinterest_conversions_api (active; pinterestServer) | Pinterest Tag and Conversions API outbox are active. |
| `add_to_wishlist` | `active` | `posthog` | posthog_browser (not_implemented; event-specific logical requirements) | posthog_server (disabled; event-specific logical requirements) | The storefront PostHog integration is currently removed. |
| `add_to_cart` | `active` | `supabase` | none | first_party_api (disabled; canonicalEnvelope) | Canonical first-party persistence is active. |
| `add_to_cart` | `active` | `google` | google_tag_manager (implemented; googleBrowserDataLayer) | google_data_manager (active; googleServer) | GTM/sGTM and Data Manager outbox are active for add_to_cart. |
| `add_to_cart` | `active` | `meta` | none | meta_conversions_api (active; metaServer) | Meta CAPI delivery is active for add_to_cart. |
| `add_to_cart` | `active` | `microsoft_uet` | microsoft_uet (implemented; microsoftBrowser) | microsoft_uet_capi (active; microsoftServer) | Browser UET is active; Microsoft UET CAPI add_to_cart outbox is active when marketing consent is granted and at least one Microsoft-supported userData identifier is present. |
| `add_to_cart` | `active` | `pinterest` | pinterest_tag (implemented; pinterestBrowser) | pinterest_conversions_api (active; pinterestServer) | Pinterest Tag and Conversions API outbox are active. |
| `add_to_cart` | `active` | `posthog` | posthog_browser (not_implemented; event-specific logical requirements) | posthog_server (disabled; event-specific logical requirements) | The storefront PostHog integration is currently removed. |
| `remove_from_cart` | `active` | `supabase` | none | first_party_api (disabled; canonicalEnvelope) | Canonical first-party persistence is active. |
| `remove_from_cart` | `active` | `google` | google_tag_manager (implemented; googleBrowserDataLayer) | google_data_manager (active; googleServer) | GTM/sGTM and Data Manager outbox are active. |
| `remove_from_cart` | `active` | `meta` | meta_pixel (implemented; metaBrowser) | meta_conversions_api (active; metaServer) | Meta CAPI delivery is active. |
| `remove_from_cart` | `active` | `microsoft_uet` | microsoft_uet (implemented; microsoftBrowser) | microsoft_uet_capi (blocked_no_worker; microsoftServer) | Browser UET is active; server delivery is blocked because no UET CAPI worker exists. |
| `remove_from_cart` | `active` | `pinterest` | none | none | No v1 Pinterest conversion mapping is approved. |
| `remove_from_cart` | `active` | `posthog` | posthog_browser (not_implemented; event-specific logical requirements) | posthog_server (disabled; event-specific logical requirements) | The storefront PostHog integration is currently removed. |
| `view_cart` | `active` | `supabase` | none | first_party_api (disabled; canonicalEnvelope) | Canonical first-party persistence is active. |
| `view_cart` | `active` | `google` | google_tag_manager (implemented; googleBrowserDataLayer) | google_data_manager (active; googleServer) | GTM/sGTM and Data Manager outbox are active. |
| `view_cart` | `active` | `meta` | meta_pixel (implemented; metaBrowser) | meta_conversions_api (active; metaServer) | Meta CAPI delivery is active. |
| `view_cart` | `active` | `microsoft_uet` | microsoft_uet (implemented; microsoftBrowser) | microsoft_uet_capi (blocked_no_worker; microsoftServer) | Browser UET is active; server delivery is blocked because no UET CAPI worker exists. |
| `view_cart` | `active` | `pinterest` | none | none | No v1 Pinterest conversion mapping is approved. |
| `view_cart` | `active` | `posthog` | posthog_browser (not_implemented; event-specific logical requirements) | posthog_server (disabled; event-specific logical requirements) | The storefront PostHog integration is currently removed. |
| `begin_checkout` | `active` | `supabase` | none | first_party_api (disabled; canonicalEnvelope) | Canonical first-party persistence is active. |
| `begin_checkout` | `active` | `google` | google_tag_manager (implemented; googleBrowserDataLayer) | google_data_manager (active; googleServer) | GTM/sGTM and Data Manager outbox are active for begin_checkout. |
| `begin_checkout` | `active` | `meta` | none | meta_conversions_api (active; metaServer) | Meta CAPI delivery is active for begin_checkout. |
| `begin_checkout` | `active` | `microsoft_uet` | microsoft_uet (implemented; microsoftBrowser) | microsoft_uet_capi (active; microsoftServer) | Browser UET is active; Microsoft UET CAPI outbox worker is active for begin_checkout when at least one Microsoft-supported userData identifier is present. |
| `begin_checkout` | `active` | `pinterest` | pinterest_tag (implemented; pinterestBrowser) | pinterest_conversions_api (active; pinterestServer) | Pinterest Tag and Conversions API outbox are active. |
| `begin_checkout` | `active` | `posthog` | posthog_browser (not_implemented; event-specific logical requirements) | posthog_server (disabled; event-specific logical requirements) | The storefront PostHog integration is currently removed. |
| `add_shipping_info` | `active` | `supabase` | none | first_party_api (disabled; canonicalEnvelope) | Canonical first-party persistence is active. |
| `add_shipping_info` | `active` | `google` | none | none | Google delivery remains disabled until an add_shipping_info Data Manager adapter is approved. |
| `add_shipping_info` | `active` | `meta` | none | meta_conversions_api (active; metaServer) | Meta Conversions API is the active provider owner for this Shopify checkout event. |
| `add_shipping_info` | `active` | `microsoft_uet` | none | none | No v1 marketing use case justifies a Microsoft UET export. |
| `add_shipping_info` | `active` | `pinterest` | none | none | No v1 Pinterest conversion mapping is approved. |
| `add_shipping_info` | `active` | `posthog` | none | none | The event is excluded from the v1 product-analytics scope. |
| `add_payment_info` | `active` | `supabase` | none | first_party_api (disabled; canonicalEnvelope) | Canonical first-party persistence is active. |
| `add_payment_info` | `active` | `google` | none | google_data_manager (active; googleServer) | Google Data Manager remains active after the event-specific Shopify Custom Pixel cutover. |
| `add_payment_info` | `active` | `meta` | none | meta_conversions_api (active; metaServer) | Meta Conversions API is active for marketing-consented Shopify payment submissions. |
| `add_payment_info` | `active` | `microsoft_uet` | none | none | No v1 marketing use case justifies a Microsoft UET export. |
| `add_payment_info` | `active` | `pinterest` | none | none | No v1 Pinterest conversion mapping is approved. |
| `add_payment_info` | `active` | `posthog` | none | none | The event is excluded from the v1 product-analytics scope. |
| `purchase` | `active` | `supabase` | none | first_party_api (disabled; canonicalEnvelope) | Operational ledger persistence via Shopify orders-paid webhook. |
| `purchase` | `active` | `google` | shopify_customer_events (implemented; shopifyPurchaseBrowser) | google_data_manager (active; shopifyPurchaseBrowser) | Shopify Customer Events is the browser source and the Data Manager purchase outbox is the supplementary server source when checkout analytics consent was granted. Both use transaction_id for GA4 deduplication. |
| `purchase` | `active` | `meta` | none | meta_conversions_api (active; metaServer) | Meta CAPI purchase outbox is active when checkout marketing consent was granted. |
| `purchase` | `active` | `microsoft_uet` | none | microsoft_uet_capi (active; microsoftServer) | Microsoft UET CAPI purchase outbox is active when checkout marketing consent was granted and at least one Microsoft-supported userData identifier is present. |
| `purchase` | `active` | `pinterest` | pinterest_tag (implemented; pinterestBrowser) | pinterest_conversions_api (active; pinterestServer) | Pinterest Tag and Conversions API outbox are active. |
| `purchase` | `active` | `posthog` | posthog_browser (not_implemented; event-specific logical requirements) | posthog_server (disabled; event-specific logical requirements) | The storefront PostHog integration is currently removed. |
| `refund` | `active` | `supabase` | none | first_party_api (disabled; canonicalEnvelope) | Operational ledger persistence via Shopify refunds-create webhook. |
| `refund` | `active` | `google` | none | google_data_manager (active; googleServer) | Data Manager refund outbox is active when analytics consent is available. |
| `refund` | `active` | `meta` | none | none | No v1 Meta refund mapping is approved. |
| `refund` | `active` | `microsoft_uet` | none | none | No v1 Microsoft UET refund mapping is approved. |
| `refund` | `active` | `pinterest` | none | none | No v1 Pinterest refund mapping is approved. |
| `refund` | `active` | `posthog` | none | none | The event is excluded from the v1 product-analytics scope. |
| `search` | `active` | `supabase` | none | first_party_api (disabled; canonicalEnvelope) | Canonical first-party persistence is active. |
| `search` | `active` | `google` | google_tag_manager (implemented; googleBrowserDataLayer) | google_data_manager (active; googleServer) | GTM/sGTM and Data Manager outbox are active. |
| `search` | `active` | `meta` | meta_pixel (implemented; metaBrowser) | meta_conversions_api (active; metaServer) | Meta CAPI delivery is active. |
| `search` | `active` | `microsoft_uet` | microsoft_uet (implemented; microsoftBrowser) | microsoft_uet_capi (blocked_no_worker; microsoftServer) | Browser UET is active; server delivery is blocked because no UET CAPI worker exists. |
| `search` | `active` | `pinterest` | pinterest_tag (implemented; pinterestBrowser) | pinterest_conversions_api (active; pinterestServer) | Pinterest Tag and Conversions API outbox are active. |
| `search` | `active` | `posthog` | posthog_browser (not_implemented; event-specific logical requirements) | posthog_server (disabled; event-specific logical requirements) | The storefront PostHog integration is currently removed. |
| `view_search_results` | `active` | `supabase` | none | first_party_api (disabled; canonicalEnvelope) | Canonical first-party persistence is active. |
| `view_search_results` | `active` | `google` | google_tag_manager (implemented; googleBrowserDataLayer) | google_data_manager (active; googleServer) | GTM/sGTM and Data Manager outbox are active. |
| `view_search_results` | `active` | `meta` | none | none | No v1 marketing use case justifies a Meta export. |
| `view_search_results` | `active` | `microsoft_uet` | none | none | No v1 marketing use case justifies a Microsoft UET export. |
| `view_search_results` | `active` | `pinterest` | none | none | No v1 Pinterest conversion mapping is approved. |
| `view_search_results` | `active` | `posthog` | posthog_browser (not_implemented; event-specific logical requirements) | posthog_server (disabled; event-specific logical requirements) | The storefront PostHog integration is currently removed. |
| `view_promotion` | `active` | `supabase` | none | first_party_api (disabled; canonicalEnvelope) | Canonical first-party persistence is active. |
| `view_promotion` | `active` | `google` | google_tag_manager (implemented; googleBrowserDataLayer) | google_data_manager (active; googleServer) | GTM/sGTM and Data Manager outbox are active. |
| `view_promotion` | `active` | `meta` | none | none | No v1 marketing use case justifies a Meta export. |
| `view_promotion` | `active` | `microsoft_uet` | none | none | No v1 marketing use case justifies a Microsoft UET export. |
| `view_promotion` | `active` | `pinterest` | none | none | No v1 Pinterest conversion mapping is approved. |
| `view_promotion` | `active` | `posthog` | posthog_browser (not_implemented; event-specific logical requirements) | posthog_server (disabled; event-specific logical requirements) | The storefront PostHog integration is currently removed. |
| `select_promotion` | `active` | `supabase` | none | first_party_api (disabled; canonicalEnvelope) | Canonical first-party persistence is active. |
| `select_promotion` | `active` | `google` | google_tag_manager (implemented; googleBrowserDataLayer) | google_data_manager (active; googleServer) | GTM/sGTM and Data Manager outbox are active. |
| `select_promotion` | `active` | `meta` | none | none | No v1 marketing use case justifies a Meta export. |
| `select_promotion` | `active` | `microsoft_uet` | none | none | No v1 marketing use case justifies a Microsoft UET export. |
| `select_promotion` | `active` | `pinterest` | none | none | No v1 Pinterest conversion mapping is approved. |
| `select_promotion` | `active` | `posthog` | posthog_browser (not_implemented; event-specific logical requirements) | posthog_server (disabled; event-specific logical requirements) | The storefront PostHog integration is currently removed. |
| `generate_lead` | `active` | `supabase` | none | first_party_api (disabled; canonicalEnvelope) | Canonical first-party persistence is active. |
| `generate_lead` | `active` | `google` | google_tag_manager (implemented; googleBrowserDataLayer) | google_data_manager (active; googleServer) | GTM/sGTM and Data Manager outbox are active. |
| `generate_lead` | `active` | `meta` | meta_pixel (implemented; metaBrowser) | meta_conversions_api (active; metaServer) | Meta CAPI delivery is active. |
| `generate_lead` | `active` | `microsoft_uet` | microsoft_uet (implemented; microsoftBrowser) | microsoft_uet_capi (blocked_no_worker; microsoftServer) | Browser UET is active; server delivery is blocked because no UET CAPI worker exists. |
| `generate_lead` | `active` | `pinterest` | pinterest_tag (implemented; pinterestBrowser) | pinterest_conversions_api (active; pinterestServer) | Pinterest Tag and Conversions API outbox are active. |
| `generate_lead` | `active` | `posthog` | posthog_browser (not_implemented; event-specific logical requirements) | posthog_server (disabled; event-specific logical requirements) | The storefront PostHog integration is currently removed. |
| `form_start` | `active` | `supabase` | none | first_party_api (disabled; canonicalEnvelope) | Canonical first-party persistence is active. |
| `form_start` | `active` | `google` | google_tag_manager (implemented; googleBrowserDataLayer) | google_data_manager (active; googleServer) | GTM/sGTM and Data Manager outbox are active. |
| `form_start` | `active` | `meta` | none | none | No v1 marketing use case justifies a Meta export. |
| `form_start` | `active` | `microsoft_uet` | none | none | No v1 marketing use case justifies a Microsoft UET export. |
| `form_start` | `active` | `pinterest` | none | none | No v1 Pinterest conversion mapping is approved. |
| `form_start` | `active` | `posthog` | posthog_browser (not_implemented; event-specific logical requirements) | posthog_server (disabled; event-specific logical requirements) | The storefront PostHog integration is currently removed. |
| `form_submit` | `active` | `supabase` | none | first_party_api (disabled; canonicalEnvelope) | Canonical first-party persistence is active. |
| `form_submit` | `active` | `google` | google_tag_manager (implemented; googleBrowserDataLayer) | google_data_manager (active; googleServer) | GTM/sGTM and Data Manager outbox are active. |
| `form_submit` | `active` | `meta` | none | none | No v1 marketing use case justifies a Meta export. |
| `form_submit` | `active` | `microsoft_uet` | none | none | No v1 marketing use case justifies a Microsoft UET export. |
| `form_submit` | `active` | `pinterest` | none | none | No v1 Pinterest conversion mapping is approved. |
| `form_submit` | `active` | `posthog` | posthog_browser (not_implemented; event-specific logical requirements) | posthog_server (disabled; event-specific logical requirements) | The storefront PostHog integration is currently removed. |
| `form_error` | `active` | `supabase` | none | first_party_api (disabled; canonicalEnvelope) | Canonical first-party persistence is active. |
| `form_error` | `active` | `google` | google_tag_manager (implemented; googleBrowserDataLayer) | google_data_manager (active; googleServer) | GTM/sGTM and Data Manager outbox are active. |
| `form_error` | `active` | `meta` | none | none | No v1 marketing use case justifies a Meta export. |
| `form_error` | `active` | `microsoft_uet` | none | none | No v1 marketing use case justifies a Microsoft UET export. |
| `form_error` | `active` | `pinterest` | none | none | No v1 Pinterest conversion mapping is approved. |
| `form_error` | `active` | `posthog` | posthog_browser (not_implemented; event-specific logical requirements) | posthog_server (disabled; event-specific logical requirements) | The storefront PostHog integration is currently removed. |
| `filter_apply` | `active` | `supabase` | none | first_party_api (disabled; canonicalEnvelope) | Canonical first-party persistence is active. |
| `filter_apply` | `active` | `google` | google_tag_manager (implemented; googleBrowserDataLayer) | google_data_manager (active; googleServer) | GTM/sGTM and Data Manager outbox are active. |
| `filter_apply` | `active` | `meta` | none | none | No v1 marketing use case justifies a Meta export. |
| `filter_apply` | `active` | `microsoft_uet` | none | none | No v1 marketing use case justifies a Microsoft UET export. |
| `filter_apply` | `active` | `pinterest` | none | none | No v1 Pinterest conversion mapping is approved. |
| `filter_apply` | `active` | `posthog` | posthog_browser (not_implemented; event-specific logical requirements) | posthog_server (disabled; event-specific logical requirements) | The storefront PostHog integration is currently removed. |
| `sort_apply` | `active` | `supabase` | none | first_party_api (disabled; canonicalEnvelope) | Canonical first-party persistence is active. |
| `sort_apply` | `active` | `google` | google_tag_manager (implemented; googleBrowserDataLayer) | google_data_manager (active; googleServer) | GTM/sGTM and Data Manager outbox are active. |
| `sort_apply` | `active` | `meta` | none | none | No v1 marketing use case justifies a Meta export. |
| `sort_apply` | `active` | `microsoft_uet` | none | none | No v1 marketing use case justifies a Microsoft UET export. |
| `sort_apply` | `active` | `pinterest` | none | none | No v1 Pinterest conversion mapping is approved. |
| `sort_apply` | `active` | `posthog` | posthog_browser (not_implemented; event-specific logical requirements) | posthog_server (disabled; event-specific logical requirements) | The storefront PostHog integration is currently removed. |
| `variant_select` | `active` | `supabase` | none | first_party_api (disabled; canonicalEnvelope) | Canonical first-party persistence is active. |
| `variant_select` | `active` | `google` | google_tag_manager (implemented; googleBrowserDataLayer) | google_data_manager (active; googleServer) | GTM/sGTM and Data Manager outbox are active. |
| `variant_select` | `active` | `meta` | none | none | No v1 marketing use case justifies a Meta export. |
| `variant_select` | `active` | `microsoft_uet` | none | none | No v1 marketing use case justifies a Microsoft UET export. |
| `variant_select` | `active` | `pinterest` | none | none | No v1 Pinterest conversion mapping is approved. |
| `variant_select` | `active` | `posthog` | posthog_browser (not_implemented; event-specific logical requirements) | posthog_server (disabled; event-specific logical requirements) | The storefront PostHog integration is currently removed. |
| `size_guide_view` | `active` | `supabase` | none | first_party_api (disabled; canonicalEnvelope) | Canonical first-party persistence is active. |
| `size_guide_view` | `active` | `google` | google_tag_manager (implemented; googleBrowserDataLayer) | google_data_manager (active; googleServer) | GTM/sGTM and Data Manager outbox are active. |
| `size_guide_view` | `active` | `meta` | none | none | No v1 marketing use case justifies a Meta export. |
| `size_guide_view` | `active` | `microsoft_uet` | none | none | No v1 marketing use case justifies a Microsoft UET export. |
| `size_guide_view` | `active` | `pinterest` | none | none | No v1 Pinterest conversion mapping is approved. |
| `size_guide_view` | `active` | `posthog` | posthog_browser (not_implemented; event-specific logical requirements) | posthog_server (disabled; event-specific logical requirements) | The storefront PostHog integration is currently removed. |
| `checkout_error` | `blocked_source` | `supabase` | none | first_party_api (disabled; canonicalEnvelope) | Canonical schema, collector, and ledger mapping are not active yet. |
| `checkout_error` | `blocked_source` | `google` | google_tag_manager (planned; googleBrowserDataLayer) | server_side_gtm (disabled; googleServer) | Provider mapping is specified but canonical routing is not active. |
| `checkout_error` | `blocked_source` | `meta` | none | none | No v1 marketing use case justifies a Meta export. |
| `checkout_error` | `blocked_source` | `microsoft_uet` | none | none | No v1 marketing use case justifies a Microsoft UET export. |
| `checkout_error` | `blocked_source` | `pinterest` | none | none | No v1 Pinterest conversion mapping is approved. |
| `checkout_error` | `blocked_source` | `posthog` | posthog_browser (not_implemented; event-specific logical requirements) | posthog_server (disabled; event-specific logical requirements) | The storefront PostHog integration is currently removed. |
| `payment_error` | `blocked_source` | `supabase` | none | first_party_api (disabled; canonicalEnvelope) | Canonical schema, collector, and ledger mapping are not active yet. |
| `payment_error` | `blocked_source` | `google` | google_tag_manager (planned; googleBrowserDataLayer) | server_side_gtm (disabled; googleServer) | Provider mapping is specified but canonical routing is not active. |
| `payment_error` | `blocked_source` | `meta` | none | none | No v1 marketing use case justifies a Meta export. |
| `payment_error` | `blocked_source` | `microsoft_uet` | none | none | No v1 marketing use case justifies a Microsoft UET export. |
| `payment_error` | `blocked_source` | `pinterest` | none | none | No v1 Pinterest conversion mapping is approved. |
| `payment_error` | `blocked_source` | `posthog` | posthog_browser (not_implemented; event-specific logical requirements) | posthog_server (disabled; event-specific logical requirements) | The storefront PostHog integration is currently removed. |
| `scroll_depth` | `active` | `supabase` | none | first_party_api (disabled; canonicalEnvelope) | Canonical first-party persistence is active. |
| `scroll_depth` | `active` | `google` | google_tag_manager (implemented; googleBrowserDataLayer) | google_data_manager (active; googleServer) | GTM/sGTM and Data Manager outbox are active. |
| `scroll_depth` | `active` | `meta` | meta_pixel (implemented; metaBrowser) | meta_conversions_api (active; metaServer) | Meta CAPI delivery is active. |
| `scroll_depth` | `active` | `microsoft_uet` | none | none | No v1 marketing use case justifies a Microsoft UET export. |
| `scroll_depth` | `active` | `pinterest` | none | none | No v1 Pinterest conversion mapping is approved. |
| `scroll_depth` | `active` | `posthog` | posthog_browser (not_implemented; event-specific logical requirements) | posthog_server (disabled; event-specific logical requirements) | The storefront PostHog integration is currently removed. |
| `view_category` | `active` | `supabase` | none | first_party_api (disabled; canonicalEnvelope) | Canonical first-party persistence is active. |
| `view_category` | `active` | `google` | google_tag_manager (implemented; googleBrowserDataLayer) | google_data_manager (active; googleServer) | GTM/sGTM and Data Manager outbox are active. |
| `view_category` | `active` | `meta` | meta_pixel (implemented; metaBrowser) | meta_conversions_api (active; metaServer) | Meta CAPI delivery is active. |
| `view_category` | `active` | `microsoft_uet` | none | none | No v1 marketing use case justifies a Microsoft UET export. |
| `view_category` | `active` | `pinterest` | pinterest_tag (implemented; pinterestBrowser) | pinterest_conversions_api (active; pinterestServer) | Pinterest Tag and Conversions API outbox are active. |
| `view_category` | `active` | `posthog` | posthog_browser (not_implemented; event-specific logical requirements) | posthog_server (disabled; event-specific logical requirements) | The storefront PostHog integration is currently removed. |
| `hero_interact` | `active` | `supabase` | none | first_party_api (disabled; canonicalEnvelope) | Canonical first-party persistence is active. |
| `hero_interact` | `active` | `google` | google_tag_manager (implemented; googleBrowserDataLayer) | google_data_manager (active; googleServer) | GTM/sGTM and Data Manager outbox are active. |
| `hero_interact` | `active` | `meta` | meta_pixel (implemented; metaBrowser) | meta_conversions_api (active; metaServer) | Meta CAPI delivery is active. |
| `hero_interact` | `active` | `microsoft_uet` | none | none | No v1 marketing use case justifies a Microsoft UET export. |
| `hero_interact` | `active` | `pinterest` | none | none | No v1 Pinterest conversion mapping is approved. |
| `hero_interact` | `active` | `posthog` | posthog_browser (not_implemented; event-specific logical requirements) | posthog_server (disabled; event-specific logical requirements) | The storefront PostHog integration is currently removed. |
| `interact_with_accordion` | `active` | `supabase` | none | first_party_api (disabled; canonicalEnvelope) | Canonical first-party persistence is active. |
| `interact_with_accordion` | `active` | `google` | google_tag_manager (implemented; googleBrowserDataLayer) | google_data_manager (active; googleServer) | GTM/sGTM and Data Manager outbox are active. |
| `interact_with_accordion` | `active` | `meta` | meta_pixel (implemented; metaBrowser) | meta_conversions_api (active; metaServer) | Meta CAPI delivery is active. |
| `interact_with_accordion` | `active` | `microsoft_uet` | microsoft_uet (implemented; microsoftBrowser) | microsoft_uet_capi (blocked_no_worker; microsoftServer) | Browser UET is active; server delivery is blocked because no UET CAPI worker exists. |
| `interact_with_accordion` | `active` | `pinterest` | none | none | No v1 Pinterest conversion mapping is approved. |
| `interact_with_accordion` | `active` | `posthog` | posthog_browser (not_implemented; event-specific logical requirements) | posthog_server (disabled; event-specific logical requirements) | The storefront PostHog integration is currently removed. |
| `open_quick_view` | `active` | `supabase` | none | first_party_api (disabled; canonicalEnvelope) | Canonical first-party persistence is active. |
| `open_quick_view` | `active` | `google` | google_tag_manager (implemented; googleBrowserDataLayer) | google_data_manager (active; googleServer) | GTM/sGTM and Data Manager outbox are active. |
| `open_quick_view` | `active` | `meta` | meta_pixel (implemented; metaBrowser) | meta_conversions_api (active; metaServer) | Meta CAPI delivery is active. |
| `open_quick_view` | `active` | `microsoft_uet` | microsoft_uet (implemented; microsoftBrowser) | microsoft_uet_capi (blocked_no_worker; microsoftServer) | Browser UET is active; server delivery is blocked because no UET CAPI worker exists. |
| `open_quick_view` | `active` | `pinterest` | none | none | No v1 Pinterest conversion mapping is approved. |
| `open_quick_view` | `active` | `posthog` | posthog_browser (not_implemented; event-specific logical requirements) | posthog_server (disabled; event-specific logical requirements) | The storefront PostHog integration is currently removed. |
| `video_progress` | `active` | `supabase` | none | first_party_api (disabled; canonicalEnvelope) | Canonical first-party persistence is active. |
| `video_progress` | `active` | `google` | google_tag_manager (implemented; googleBrowserDataLayer) | google_data_manager (active; googleServer) | GTM/sGTM and Data Manager outbox are active. |
| `video_progress` | `active` | `meta` | none | none | No v1 marketing use case justifies a Meta export. |
| `video_progress` | `active` | `microsoft_uet` | none | none | No v1 marketing use case justifies a Microsoft UET export. |
| `video_progress` | `active` | `pinterest` | none | none | No v1 Pinterest conversion mapping is approved. |
| `video_progress` | `active` | `posthog` | posthog_browser (not_implemented; event-specific logical requirements) | posthog_server (disabled; event-specific logical requirements) | The storefront PostHog integration is currently removed. |

## Installed integration owners

- `googleDataManager`: @google-ads/datamanager `^0.5.0`; Google server event protobuf types and transport; implementation `src/lib/analytics/server/googleDataManager`.
- `metaParameterBuilder`: capi-param-builder-nodejs `^1.3.1`; Trusted request-context extraction for fbc, fbp, IP, source URL, referrer, and hashed PII; implementation `src/lib/analytics/server/processMetaParameterContext.ts`.
- `metaBusinessSdk`: facebook-nodejs-business-sdk `file:vendor/facebook-nodejs-business-sdk-25.0.3.tgz`; Meta ServerEvent, UserData, CustomData, Content, and EventRequest payloads; implementation `src/lib/analytics/server/meta`.
- `shopifyGraphql`: @shopify/graphql-client `^1.4.2`; Shopify Storefront GraphQL transport; not a provider event SDK; implementation `src/lib/shopify`.
- `shopifyHydrogen`: @shopify/hydrogen-react `2026.4.3`; Storefront commerce types and helpers; not a provider event SDK; implementation `src/lib/shopify`.
- `microsoftUetCapi`: repository-owned integration; Direct HTTP plus repository-owned Zod schemas; implementation `src/lib/analytics/server/microsoftUet`.
- `pinterestConversionsApi`: repository-owned integration; Direct HTTP to Pinterest Conversions API v5 events; implementation `src/lib/analytics/server/dispatchCanonicalEventToPinterest.ts`.
- `shopifyCustomerEvents`: repository-owned integration; Shopify-hosted browser pixel for checkout_completed to GA4/sGTM; implementation `config/shopify/customer-events/ga4-commerce-pixel.js`.

## Official provider sources

- [Meta Conversions API parameters and deduplication](https://developers.facebook.com/docs/marketing-api/conversions-api/parameters/server-event)
- [Google Data Manager API Event](https://developers.google.com/data-manager/api/reference/rest/v1/events)
- [Microsoft UET Conversion API integration](https://learn.microsoft.com/en-us/advertising/guides/uet-conversion-api-integration?view=bingads-13)
- [Shopify Customer Events checkout_completed](https://shopify.dev/docs/api/web-pixels-api/standard-events/checkout_completed)
