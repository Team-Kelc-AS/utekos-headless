# Microsoft Advertising, Shopping, UET, and Clarity

Operational scope for Utekos Microsoft diagnostics. Microsoft/Bing is treated as a full ad platform, not only a UET endpoint.

## Official Sources

- OAuth with MFA: `https://learn.microsoft.com/en-us/advertising/guides/authentication-oauth-mfa?view=bingads-13`
- SDK authentication and refresh-token handling: `https://learn.microsoft.com/en-us/advertising/guides/sdk-authentication?view=bingads-13`
- OAuth tokens: `https://learn.microsoft.com/en-us/advertising/guides/authentication-oauth-get-tokens?view=bingads-13`
- Get started with Microsoft Advertising API: `https://learn.microsoft.com/en-us/advertising/guides/get-started?view=bingads-13`
- Ad Insight guides: `https://learn.microsoft.com/en-us/advertising/guides/ad-insight-guides?view=bingads-13`
- Shopping Content API: `https://learn.microsoft.com/en-us/advertising/shopping-content/get-started`
- Scripts: `https://learn.microsoft.com/en-us/advertising/scripts/`
- Clarity Advertising Dashboard: `https://learn.microsoft.com/en-us/clarity/advertising/advertising-dashboard`
- Clarity Consent API V2: `https://learn.microsoft.com/en-us/clarity/setup-and-installation/clarity-consent-api-v2`
- Microsoft Advertising MCP: `https://learn.microsoft.com/en-us/advertising/guides/mcp-setup?view=bingads-13`
- UET Conversions API: `https://learn.microsoft.com/en-us/advertising/guides/uet-conversion-api-integration?view=bingads-13`

CanonicalEvent-reisen, produksjonsfunnene og målarkitekturen er dokumentert i [`uet-capi-canonical-event-audit.md`](uet-capi-canonical-event-audit.md).

## Required Local Credentials

Store these in `.env.mcp.local`, never in generated MCP files or `.env.mcp.example`.

- `MICROSOFT_ADS_DEVELOPER_TOKEN`
- `MICROSOFT_ADS_CLIENT_ID`
- `MICROSOFT_ADS_CLIENT_SECRET` when the app flow requires it
- `MICROSOFT_ADS_ACCESS_TOKEN`
- `MICROSOFT_ADS_REFRESH_TOKEN`
- `MICROSOFT_ADS_CUSTOMER_ID`
- `MICROSOFT_ADS_ACCOUNT_ID`
- `MICROSOFT_ADS_MASTER_ACCOUNT_ID` for the second allowlisted ad account
- `MICROSOFT_ADS_MASTER_ACCOUNT_NUMBER` for operator reference
- `MICROSOFT_ADS_MASTER_MANAGER_ACCOUNT_ID`
- `MICROSOFT_ADS_MASTER_MANAGER_ACCOUNT_NUMBER`
- `MICROSOFT_ADS_ENVIRONMENT=production` or `sandbox`
- `MICROSOFT_MERCHANT_CENTER_STORE_ID`
- `MICROSOFT_UET_TAG_ID` or `NEXT_PUBLIC_MICROSOFT_UET_TAG_ID`
- `MICROSOFT_UET_CAPI_ACCESS_TOKEN` for server-side UET purchase dispatch
- `CLARITY_API_TOKEN`
- `MICROSOFT_CLARITY_PROJECT_ID` or `NEXT_PUBLIC_CLARITY_PROJECT_ID`

OAuth must request `msads.manage`. Refresh-token handling is mandatory; a short-lived access token alone is not sufficient for robust diagnostics.

The current Utekos customer/manager is `254835341`. The local operator accepts
the primary account `188365141` and the second account `188445594`. All seven
`utekos-microsoft-ads` tools accept an optional digits-only `accountId`; omit it
for the primary account. Unknown account IDs are rejected locally before a
provider call, and each selected account has a separate audit cache.

Both accounts use UET tag `97247724`. Do not duplicate CanonicalEvent CAPI
dispatch per account: one deduplicated event goes to the shared tag, while each
account sees the same three active `Scope=Customer` EventGoals: `47565453`
(`add_to_cart`), `47565454` (`begin_checkout`) and `47565502` (`purchase`). The
six superseded `Scope=Account` goals are paused.

## Read-Only MCP Probes

`scripts/mcp/utekos-commerce-tracking-server.mjs` exposes these read-only tools:

- `microsoft_ads_auth_readiness_probe`
- `microsoft_ads_account_access_probe`
- `microsoft_ads_campaign_status_probe`
- `microsoft_ads_ad_insight_probe`
- `microsoft_shopping_content_status_probe`
- `microsoft_clarity_ads_status_probe`
- `microsoft_uet_endpoint_status_probe`

Run:

```bash
npm run mcp:commerce-tracking:doctor
```

Verify the dedicated Microsoft operator for both configured accounts:

```bash
npm run mcp:microsoft-ads:doctor:live
npm run mcp:microsoft-ads:doctor:live -- --account-id=188445594
```

Microsoft is not OK until OAuth readiness, account access, campaign status, UET, Shopping Content, and Clarity readiness return structured success or a deliberate, documented fail-closed reason.

## Surface Boundaries

- Ads API: read account access, campaigns, conversion status, and reporting.
- Ad Insight: read keyword ideas, bid opportunities, budget opportunities, and responsive search ad opportunities. Do not auto-apply recommendations.
- Shopping Content API: read Merchant Center store/catalog/product status. Do not mutate store, catalog, product, or feed resources.
- Scripts: separate Microsoft Advertising automation surface, not app runtime. Any script deployment or execution requires explicit approval.
- UET CAPI: server-side purchase dispatch status is part of commerce smoke and provider audit.
- Clarity: verify Advertising Dashboard linkage, UET-Clarity linkage, and Consent API V2 with `ad_Storage` and `analytics_Storage`.

## Mutation Policy

No campaign creation, budget/bid changes, conversion goal changes, opportunity auto-apply, Shopping Content mutation, script deployment, GTM publish, provider write, or production deploy is allowed without separate explicit user approval.
